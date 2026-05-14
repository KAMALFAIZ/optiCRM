package com.opticrm.api.integration;

import com.opticrm.api.integration.dto.FieldMappingDto;
import com.opticrm.api.integration.dto.ImportResultDto;
import com.opticrm.api.integration.dto.SaveMappingsRequest;
import com.opticrm.api.integration.entity.FieldMapping;
import com.opticrm.api.integration.repository.FieldMappingRepository;
import com.opticrm.api.sage.SageQueryService;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.entity.ProductCategory;
import com.opticrm.stock.repository.ProductCategoryRepository;
import com.opticrm.stock.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FieldMappingService {

    private final FieldMappingRepository fieldMappingRepository;
    private final AccountRepository accountRepository;
    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final SageQueryService sageQueryService;

    // ── Mappings ──────────────────────────────────────────────────────────────

    public List<FieldMappingDto> getMappings(String entityType) {
        return fieldMappingRepository
                .findAllByEntityTypeOrderByChampSource(entityType)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public List<FieldMappingDto> saveMappings(SaveMappingsRequest req, String entityType) {
        fieldMappingRepository.deleteAllMappingsByEntityType(entityType);
        List<FieldMapping> saved = new ArrayList<>();
        if (req.getMappings() != null) {
            for (SaveMappingsRequest.MappingItem item : req.getMappings()) {
                if (item.getChampSource() == null || item.getChampSource().isBlank()) continue;
                if (item.getChampOpticrm() == null || item.getChampOpticrm().isBlank()) continue;
                saved.add(fieldMappingRepository.save(
                        FieldMapping.builder()
                                .champSource(item.getChampSource().trim())
                                .champOpticrm(item.getChampOpticrm().trim())
                                .actif(item.isActif())
                                .entityType(entityType)
                                .build()
                ));
            }
        }
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── CSV Import ────────────────────────────────────────────────────────────

    @Transactional
    public ImportResultDto importCsv(MultipartFile file, String entityType) throws Exception {
        Map<String, String> mappingMap = buildMappingMap(entityType);
        int total = 0, created = 0, updated = 0, errors = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                return ImportResultDto.builder().message("Fichier vide").build();
            }
            String[] headers = parseCsvLine(headerLine);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                total++;
                try {
                    String[] values = parseCsvLine(line);
                    Map<String, String> row = buildRow(headers, values, mappingMap);
                    boolean wasUpdate = applyRow(row, entityType);
                    if (wasUpdate) updated++; else created++;
                } catch (Exception e) {
                    log.warn("Erreur import ligne {}: {}", total, e.getMessage());
                    errors++;
                }
            }
        }

        return resultDto(total, created, updated, errors);
    }

    // ── Execute Query ─────────────────────────────────────────────────────────

    @Transactional
    public ImportResultDto executeQueryAndImport(String sqlQuery, String entityType) {
        Map<String, String> mappingMap = buildMappingMap(entityType);
        List<Map<String, Object>> rows = sageQueryService.executeCustomQuery(sqlQuery, "import");

        int total = 0, created = 0, updated = 0, errors = 0;
        for (Map<String, Object> rawRow : rows) {
            total++;
            try {
                Map<String, String> mapped = new LinkedHashMap<>();
                for (Map.Entry<String, Object> entry : rawRow.entrySet()) {
                    String sourceField = normalizeKey(entry.getKey());
                    String opticrmField = mappingMap.get(sourceField);
                    if (opticrmField != null && entry.getValue() != null) {
                        mapped.put(opticrmField, entry.getValue().toString().trim());
                    }
                }
                boolean wasUpdate = applyRow(mapped, entityType);
                if (wasUpdate) updated++; else created++;
            } catch (Exception e) {
                log.warn("Erreur import ligne {}: {}", total, e.getMessage());
                errors++;
            }
        }

        return resultDto(total, created, updated, errors);
    }

    // ── Row dispatch ──────────────────────────────────────────────────────────

    private boolean applyRow(Map<String, String> row, String entityType) {
        return switch (entityType) {
            case "PRODUCTS" -> applyRowToProduct(row);
            default         -> applyRowToAccount(row);
        };
    }

    // ── Account import ────────────────────────────────────────────────────────

    /** Returns true if account was updated (existed), false if created. */
    private boolean applyRowToAccount(Map<String, String> row) {
        String sageCode = row.get("sageCode");
        String name = row.get("name");

        Optional<Account> existing = Optional.empty();
        if (sageCode != null && !sageCode.isBlank()) {
            existing = accountRepository.findBySageCode(sageCode);
        }
        if (existing.isEmpty() && name != null && !name.isBlank()) {
            List<Account> byName = accountRepository.findByNameIgnoreCase(name);
            if (!byName.isEmpty()) existing = Optional.of(byName.get(0));
        }

        boolean isUpdate = existing.isPresent();
        Account account = existing.orElse(Account.builder().accountType("Client").build());

        applyAccountFields(account, row);

        if (account.getName() == null || account.getName().isBlank()) {
            account.setName("Import-" + Instant.now().toEpochMilli());
        }
        accountRepository.save(account);
        return isUpdate;
    }

    private void applyAccountFields(Account account, Map<String, String> row) {
        row.forEach((field, value) -> {
            if (value == null || value.isBlank()) return;
            switch (field) {
                case "name"              -> account.setName(value);
                case "legalName"         -> account.setLegalName(value);
                case "phone"             -> account.setPhone(value);
                case "website"           -> account.setWebsite(value);
                case "ice"               -> account.setIce(value);
                case "sageCode"          -> account.setSageCode(value);
                case "billingStreet"     -> account.setBillingStreet(value);
                case "billingCity"       -> account.setBillingCity(value);
                case "billingPostalCode" -> account.setBillingPostalCode(value);
                case "billingState"      -> account.setBillingState(value);
                case "billingCountry"    -> account.setBillingCountry(value);
                case "whatsapp"          -> account.setWhatsapp(value);
                case "identifiantFiscal" -> account.setIdentifiantFiscal(value);
                case "rc"                -> account.setRc(value);
                case "accountType"       -> account.setAccountType(value);
                case "famille"           -> account.setFamille(value);
                case "typeCompteOdyssee" -> account.setTypeCompteOdyssee(value);
                case "prefecture"        -> account.setPrefecture(value);
                case "statutCompte"      -> account.setStatutCompte(value);
                case "potentiel"         -> account.setPotentiel(value);
                case "secteurActivite"   -> account.setSecteurActivite(value);
                case "categorieClient"   -> account.setCategorieClient(value);
                case "representant"      -> account.setRepresentant(value);
                case "latitude"          -> {
                    try { account.setLatitude(new BigDecimal(value)); } catch (Exception ignored) {}
                }
                case "longitude"         -> {
                    try { account.setLongitude(new BigDecimal(value)); } catch (Exception ignored) {}
                }
                default -> log.debug("Champ compte non reconnu: {}", field);
            }
        });
    }

    // ── Product import ────────────────────────────────────────────────────────

    /** Returns true if product was updated (existed), false if created. */
    private boolean applyRowToProduct(Map<String, String> row) {
        String sageCode = row.get("sageCode");
        String code     = row.get("code") != null ? row.get("code") : sageCode;

        Optional<Product> existing = Optional.empty();
        if (sageCode != null && !sageCode.isBlank()) {
            existing = productRepository.findBySageCode(sageCode);
        }
        if (existing.isEmpty() && code != null && !code.isBlank()) {
            existing = productRepository.findByCode(code);
        }

        boolean isUpdate = existing.isPresent();
        Product product = existing.orElse(new Product());

        applyProductFields(product, row);

        // Mandatory fields for new products
        if (!isUpdate) {
            if (product.getCode() == null || product.getCode().isBlank()) {
                product.setCode(sageCode != null && !sageCode.isBlank()
                        ? sageCode : "IMP-" + Instant.now().toEpochMilli());
            }
            if (product.getName() == null || product.getName().isBlank()) {
                product.setName("Import-" + Instant.now().toEpochMilli());
            }
            if (product.getUnitPrice() == null) {
                product.setUnitPrice(BigDecimal.ZERO);
            }
        }
        productRepository.save(product);
        return isUpdate;
    }

    private void applyProductFields(Product product, Map<String, String> row) {
        row.forEach((field, value) -> {
            if (value == null || value.isBlank()) return;
            switch (field) {
                case "sageCode"       -> product.setSageCode(value);
                case "code"           -> product.setCode(value);
                case "name"           -> product.setName(value);
                case "description"    -> product.setDescription(value);
                case "unitOfMeasure"  -> product.setUnitOfMeasure(value);
                case "isActive"       -> {
                    // Sage AR_Sommeil : 0 = actif, 1 = en sommeil
                    product.setIsActive(!"1".equals(value.trim()));
                }
                case "unitPrice"      -> {
                    try { product.setUnitPrice(new BigDecimal(value.replace(",", "."))); }
                    catch (Exception ignored) {}
                }
                case "costPrice"      -> {
                    try { product.setCostPrice(new BigDecimal(value.replace(",", "."))); }
                    catch (Exception ignored) {}
                }
                case "categoryCode"   -> {
                    if (!value.isBlank()) {
                        ProductCategory cat = productCategoryRepository
                                .findByCode(value)
                                .orElseGet(() -> productCategoryRepository.save(
                                        ProductCategory.builder()
                                                .code(value)
                                                .name(value)
                                                .build()));
                        product.setCategory(cat);
                    }
                }
                default -> log.debug("Champ produit non reconnu: {}", field);
            }
        });
    }

    // ── Delete helpers ────────────────────────────────────────────────────────

    @Transactional
    public int deleteAllProducts() {
        long count = productRepository.count();
        productRepository.deleteAllInBatch();
        log.warn("deleteAllInBatch products exécuté — {} produits supprimés.", count);
        return (int) count;
    }

    @Transactional
    public void deleteAllAccounts() {
        accountRepository.truncateAllCascade();
        log.warn("TRUNCATE accounts CASCADE exécuté — toutes les données comptes supprimées.");
    }

    @Transactional
    public int deleteImportedAccounts() {
        List<Account> toDelete = accountRepository.findAll().stream()
                .filter(a -> a.getName() != null && a.getName().startsWith("Import-"))
                .collect(Collectors.toList());
        accountRepository.deleteAll(toDelete);
        log.info("Supprimé {} comptes importés (Import-*)", toDelete.size());
        return toDelete.size();
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private Map<String, String> buildMappingMap(String entityType) {
        return fieldMappingRepository
                .findAllByEntityTypeOrderByChampSource(entityType)
                .stream()
                .filter(FieldMapping::isActif)
                .collect(Collectors.toMap(
                        m -> normalizeKey(m.getChampSource()),
                        FieldMapping::getChampOpticrm,
                        (existing, replacement) -> replacement));
    }

    private Map<String, String> buildRow(String[] headers, String[] values, Map<String, String> mappingMap) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            String sourceField = normalizeKey(headers[i]);
            String opticrmField = mappingMap.get(sourceField);
            if (opticrmField != null) {
                row.put(opticrmField, values[i].trim());
            }
        }
        return row;
    }

    private static ImportResultDto resultDto(int total, int created, int updated, int errors) {
        return ImportResultDto.builder()
                .total(total).created(created).updated(updated).errors(errors)
                .message(String.format("%d créés, %d mis à jour, %d erreurs", created, updated, errors))
                .build();
    }

    private static String normalizeKey(String s) {
        if (s == null) return "";
        String nfd = Normalizer.normalize(s.toLowerCase().trim(), Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}", "");
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens.toArray(new String[0]);
    }

    private FieldMappingDto toDto(FieldMapping m) {
        return FieldMappingDto.builder()
                .id(m.getId())
                .champSource(m.getChampSource())
                .champOpticrm(m.getChampOpticrm())
                .actif(m.isActif())
                .build();
    }
}
