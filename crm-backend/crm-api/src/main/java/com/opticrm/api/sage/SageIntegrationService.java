package com.opticrm.api.sage;

import com.opticrm.api.sage.dto.CreateSyncRequestRequest;
import com.opticrm.api.sage.dto.SageSyncRequestDto;
import com.opticrm.api.sage.entity.BalanceAgeeSnapshot;
import com.opticrm.api.sage.entity.SageSyncItem;
import com.opticrm.api.sage.entity.SageSyncRequest;
import com.opticrm.api.sage.repository.BalanceAgeeSnapshotRepository;
import com.opticrm.api.sage.repository.SageSyncItemRepository;
import com.opticrm.api.sage.repository.SageSyncRequestRepository;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.entity.ProductCategory;
import com.opticrm.stock.entity.StockLevel;
import com.opticrm.stock.entity.Warehouse;
import com.opticrm.stock.repository.ProductCategoryRepository;
import com.opticrm.stock.repository.ProductRepository;
import com.opticrm.stock.repository.StockLevelRepository;
import com.opticrm.stock.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SageIntegrationService {

    private final SageSyncRequestRepository    requestRepository;
    private final SageSyncItemRepository       itemRepository;
    private final AccountRepository            accountRepository;
    private final ContactRepository            contactRepository;
    private final UserRepository               userRepository;
    private final ProductRepository            productRepository;
    private final ProductCategoryRepository    productCategoryRepository;
    private final WarehouseRepository          warehouseRepository;
    private final StockLevelRepository         stockLevelRepository;
    private final BalanceAgeeSnapshotRepository balanceAgeeSnapshotRepository;

    // ─── Création d'une requête de synchronisation ────────────────────────────

    @Transactional
    public SageSyncRequestDto createRequest(CreateSyncRequestRequest req) {
        User currentUser = currentUser();

        SageSyncRequest syncReq = SageSyncRequest.builder()
                .entityType(req.getEntityType().toUpperCase())
                .label(req.getLabel())
                .sourceFormat(req.getSourceFormat() != null ? req.getSourceFormat() : "CSV")
                .periodYear(req.getPeriodYear())
                .periodMonth(req.getPeriodMonth())
                .createdBy(currentUser)
                .totalItems(req.getRows().size())
                .build();

        syncReq = requestRepository.save(syncReq);

        // ── Pré-charger tous les comptes par sage_code en un seul appel ──────
        // Évite N×3 requêtes individuelles (1 requête batch à la place)
        List<String> sageCodes = req.getRows().stream()
                .map(row -> getString(row, "sage_code", "ct_num", "code", "ref"))
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .collect(Collectors.toList());

        Map<String, Account> accountBySageCode = sageCodes.isEmpty() ? Collections.emptyMap()
                : accountRepository.findBySageCodeIn(sageCodes).stream()
                        .collect(Collectors.toMap(Account::getSageCode, a -> a, (a1, a2) -> a1));

        // Créer les items avec preview (matching)
        List<SageSyncItem> items = new ArrayList<>();
        int idx = 0;
        for (Map<String, Object> row : req.getRows()) {
            SageSyncItem item = buildItem(syncReq, row, req.getEntityType(), idx++, accountBySageCode);
            items.add(item);
        }
        itemRepository.saveAll(items);
        syncReq.setTotalItems(items.size());
        requestRepository.save(syncReq);

        return mapToDto(syncReq, items);
    }

    // ─── Appliquer une requête (CREATE / UPDATE en base CRM) ──────────────────

    @Transactional
    public SageSyncRequestDto applyRequest(UUID requestId) {
        SageSyncRequest syncReq = requestRepository.findByIdWithCreatedBy(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SyncRequest", requestId.toString()));

        if (!"PENDING".equals(syncReq.getStatus())) {
            throw new IllegalStateException("Requête déjà traitée (statut : " + syncReq.getStatus() + ")");
        }

        syncReq.setStatus("PROCESSING");
        requestRepository.save(syncReq);

        List<SageSyncItem> items = itemRepository.findByRequestIdOrderByRowIndex(requestId);
        int success = 0, errors = 0, skips = 0;

        for (SageSyncItem item : items) {
            if ("SKIP".equals(item.getAction())) {
                item.setStatus("SKIPPED");
                skips++;
                continue;
            }
            try {
                applyItem(item, syncReq.getEntityType());
                item.setStatus("DONE");
                item.setProcessedAt(LocalDateTime.now());
                success++;
            } catch (Exception e) {
                item.setStatus("ERROR");
                item.setErrorMessage(e.getMessage());
                item.setProcessedAt(LocalDateTime.now());
                errors++;
                log.warn("Erreur sync item {}: {}", item.getSageRef(), e.getMessage());
            }
        }

        itemRepository.saveAll(items);

        syncReq.setStatus(errors == 0 ? "DONE" : (success > 0 ? "DONE" : "ERROR"));
        syncReq.setProcessedItems(success + errors + skips);
        syncReq.setSuccessItems(success);
        syncReq.setErrorItems(errors);
        syncReq.setSkipItems(skips);
        syncReq.setProcessedAt(LocalDateTime.now());
        requestRepository.save(syncReq);

        return mapToDto(syncReq, items);
    }

    // ─── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SageSyncRequestDto> listRequests(String entityType, Pageable pageable) {
        Page<SageSyncRequest> page = (entityType != null && !entityType.isBlank())
                ? requestRepository.findByEntityTypeOrderByCreatedAtDesc(entityType.toUpperCase(), pageable)
                : requestRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(r -> mapToDto(r, null));
    }

    @Transactional(readOnly = true)
    public SageSyncRequestDto getRequest(UUID id) {
        SageSyncRequest req = requestRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("SyncRequest", id.toString()));
        List<SageSyncItem> items = itemRepository.findByRequestIdOrderByRowIndex(id);
        return mapToDto(req, items);
    }

    @Transactional
    public void cancelRequest(UUID id) {
        SageSyncRequest req = requestRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("SyncRequest", id.toString()));
        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Seules les requêtes PENDING peuvent être annulées");
        }
        req.setStatus("CANCELLED");
        requestRepository.save(req);
    }

    // ─── Matching & Mapping privé ─────────────────────────────────────────────

    /**
     * Construit un SageSyncItem en utilisant le cache pré-chargé (accountBySageCode).
     * Évite les N+1 queries : la majorité des lignes sont résolues via le Map en mémoire.
     */
    private SageSyncItem buildItem(SageSyncRequest req, Map<String, Object> row,
                                   String entityType, int idx,
                                   Map<String, Account> accountBySageCode) {
        String sageRef = getString(row, "sage_code", "ct_num", "code", "ref");
        UUID crmId = null;
        String action = "CREATE";
        Map<String, Object> diff = new LinkedHashMap<>();

        switch (entityType.toUpperCase()) {
            case "ACCOUNTS" -> {
                Optional<Account> existing = findAccountFast(sageRef, row, accountBySageCode);
                if (existing.isPresent()) {
                    crmId = existing.get().getId();
                    action = "UPDATE";
                    diff = diffAccount(existing.get(), row);
                    if (diff.isEmpty()) action = "SKIP";
                }
            }
            case "CONTACTS" -> {
                Optional<Contact> existing = findContact(row);
                if (existing.isPresent()) {
                    crmId = existing.get().getId();
                    action = "UPDATE";
                    if (computeDiff(existing.get(), row).isEmpty()) action = "SKIP";
                }
            }
            case "CA", "OBJECTIVES", "VENTES", "BALANCE_AGEE" -> {
                action = "CREATE";
            }
            case "PRODUCTS" -> {
                String arRef = getString(row, "ar_ref", "sage_code", "code", "ref");
                Optional<Product> existing = (arRef != null)
                        ? productRepository.findBySageCode(arRef) : Optional.empty();
                if (existing.isPresent()) {
                    crmId = existing.get().getId();
                    action = "UPDATE";
                    diff = diffProduct(existing.get(), row);
                    if (diff.isEmpty()) action = "SKIP";
                }
            }
            case "INVENTORY" -> {
                // Matching par (sageCode produit + code dépôt)
                String arRef   = getString(row, "ar_ref", "sage_code");
                String deNo    = getString(row, "de_no", "depot");
                if (arRef != null && deNo != null) {
                    Optional<Product> prod = productRepository.findBySageCode(arRef);
                    Optional<Warehouse> wh = warehouseRepository.findByCode(deNo);
                    if (prod.isPresent() && wh.isPresent()) {
                        Optional<StockLevel> sl = stockLevelRepository
                                .findByProductIdAndWarehouseId(prod.get().getId(), wh.get().getId());
                        if (sl.isPresent()) {
                            crmId = sl.get().getId();
                            action = "UPDATE";
                            diff = diffInventory(sl.get(), row);
                            if (diff.isEmpty()) action = "SKIP";
                        }
                    }
                }
            }
        }

        return SageSyncItem.builder()
                .request(req)
                .rowIndex(idx)
                .sageRef(sageRef)
                .crmId(crmId)
                .action(action)
                .status("PENDING")
                .rawData(row)
                .diffData(diff.isEmpty() ? null : diff)
                .build();
    }

    private void applyItem(SageSyncItem item, String entityType) {
        Map<String, Object> data = item.getRawData();
        switch (entityType.toUpperCase()) {
            case "ACCOUNTS"     -> applyAccount(item, data);
            case "CONTACTS"     -> applyContact(item, data);
            case "CA"           -> applyCA(item, data);
            case "OBJECTIVES"   -> applyObjective(item, data);
            case "PRODUCTS"     -> applyProduct(item, data);
            case "INVENTORY"    -> applyInventory(item, data);
            case "VENTES"       -> applyVente(item, data);
            case "BALANCE_AGEE" -> applyBalanceAgee(item, data);
        }
    }

    // ── Comptes ───────────────────────────────────────────────────────────────

    /**
     * Applique un enregistrement Sage 100C sur un compte CRM.
     *
     * Mapping complet Sage 100C → CRM Account :
     *   CT_Num                → sageCode              (clé de jointure)
     *   CT_Intitule           → name                  (obligatoire — fallback sur [CT_Num])
     *   CT_Telephone          → phone
     *   CT_Telecopie          → fax
     *   CT_Site               → website
     *   CT_Adresse            → billingStreet
     *   CT_CodePostal         → billingPostalCode
     *   CT_Ville              → billingCity
     *   CT_Pays               → billingCountry
     *   ICE                   → ice                   (Identifiant Commun Entreprise — Maroc)
     *   CT_IF                 → identifiantFiscal     (Identifiant Fiscal — Maroc)
     *   CT_RC                 → rc                    (Registre de Commerce — Maroc)
     *   CT_Siret              → siret                 (France — conservé pour compatibilité)
     *   CT_Siren              → siren                 (France — conservé pour compatibilité)
     *   CT_Encours            → creditLimit           (Encours autorisé)
     *   CT_Categorie          → categorieClient       ([Catégorie_])
     *   CT_CategorieTarifaire → categorieTarifaire    ([Catégorie tarifaire_])
     *   CT_Secteur            → secteurActivite       ([Secteur_])
     *   CT_TypeCompte         → typeCompteOdyssee     ([Type de compte ODYSSÉE_])
     *   CT_Prefecture         → prefecture            ([Préfecture_])
     *   CT_Statut             → statutCompte          ([Statut_])
     *
     * Tous les champs sont optionnels — seuls les champs présents dans les données
     * Sage sont mis à jour. Les champs absents ou vides sont ignorés.
     */
    private void applyAccount(SageSyncItem item, Map<String, Object> data) {
        String sageCode = getString(data, "sage_code", "ct_num", "code");

        Account account;
        if ("UPDATE".equals(item.getAction()) && item.getCrmId() != null) {
            account = accountRepository.findById(item.getCrmId()).orElseThrow();
        } else {
            // Upsert : si un compte avec ce sage_code existe déjà (ex. import partiel), on le met à jour
            account = (sageCode != null ? accountRepository.findBySageCode(sageCode) : Optional.<Account>empty())
                    .orElseGet(() -> Account.builder().accountType("Client").build());
        }

        // ── Nom : champ obligatoire en base — fallback sur le code Sage si absent ──
        String name = getString(data, "name", "ct_intitule", "nom");
        if (name != null) {
            account.setName(name);
        } else if (account.getName() == null) {
            // Nouveau compte sans intitulé Sage → placeholder temporaire
            account.setName(sageCode != null ? "[" + sageCode + "]" : "[SANS NOM]");
        }

        // ── Coordonnées ───────────────────────────────────────────────────────
        String phone   = getString(data, "phone", "ct_telephone");
        String website = getString(data, "website", "ct_site");
        if (phone   != null) account.setPhone(phone);
        if (website != null) account.setWebsite(website);

        // ── Adresse facturation ───────────────────────────────────────────────
        String street  = getString(data, "billing_street", "ct_adresse", "adresse");
        String city    = getString(data, "billing_city", "ct_ville", "city");
        String postal  = getString(data, "billing_postal_code", "ct_codepostal");
        String country = getString(data, "billing_country", "ct_pays", "pays");
        if (street  != null) account.setBillingStreet(street);
        if (city    != null) account.setBillingCity(city);
        if (postal  != null) account.setBillingPostalCode(postal);
        if (country != null) account.setBillingCountry(country);

        // ── Identification légale — Maroc ─────────────────────────────────────
        String ice = getString(data, "ice");
        String IF  = getString(data, "identifiant_fiscal", "ct_if");
        String rc  = getString(data, "rc", "ct_rc");
        if (ice != null) account.setIce(ice);
        if (IF  != null) account.setIdentifiantFiscal(IF);
        if (rc  != null) account.setRc(rc);

        // ── Identification légale — France (compatibilité) ────────────────────
        String siret = getString(data, "siret", "ct_siret");
        String siren = getString(data, "siren", "ct_siren");
        if (siret != null) account.setSiret(siret);
        if (siren != null) account.setSiren(siren);

        // ── Finance ───────────────────────────────────────────────────────────
        java.math.BigDecimal encours = getBigDecimal(data, "credit_limit", "ct_encours", "encours");
        if (encours != null) account.setCreditLimit(encours);

        // ── Classification Sage 100C ──────────────────────────────────────────
        String categorieClient    = getString(data, "ct_categorie",          "categorie_client");
        String categorieTarifaire = getString(data, "ct_categorietarifaire", "categorie_tarifaire");
        String secteurActivite    = getString(data, "ct_secteur",            "secteur_activite");
        String typeCompteOdyssee  = getString(data, "ct_typecompte",         "type_compte_odyssee");
        String prefecture         = getString(data, "ct_prefecture",         "prefecture");
        String statutCompte       = getString(data, "ct_statut",             "statut_compte");
        String representant       = getString(data, "ct_representant",       "representant");
        if (categorieClient    != null) account.setCategorieClient(categorieClient);
        if (categorieTarifaire != null) account.setCategorieTarifaire(categorieTarifaire);
        if (secteurActivite    != null) account.setSecteurActivite(secteurActivite);
        if (typeCompteOdyssee  != null) account.setTypeCompteOdyssee(typeCompteOdyssee);
        if (prefecture         != null) account.setPrefecture(prefecture);
        if (statutCompte       != null) account.setStatutCompte(statutCompte);
        if (representant       != null) account.setRepresentant(representant);

        // ── Sage ──────────────────────────────────────────────────────────────
        account.setSageCode(sageCode);
        account.setSageSyncedAt(Instant.now());

        account = accountRepository.save(account);
        item.setCrmId(account.getId());
    }

    private void applyContact(SageSyncItem item, Map<String, Object> data) {
        Contact contact;
        if ("UPDATE".equals(item.getAction()) && item.getCrmId() != null) {
            contact = contactRepository.findById(item.getCrmId()).orElseThrow();
        } else {
            contact = new Contact();
            contact.setFirstName(getString(data, "first_name", "prenom") != null
                    ? getString(data, "first_name", "prenom") : "");
            contact.setLastName(getString(data, "last_name", "nom") != null
                    ? getString(data, "last_name", "nom") : "");
        }
        if (getString(data, "email") != null) contact.setEmail(getString(data, "email"));
        if (getString(data, "phone", "telephone") != null)
            contact.setPhoneOffice(getString(data, "phone", "telephone"));
        if (getString(data, "mobile") != null) contact.setPhoneMobile(getString(data, "mobile"));
        if (getString(data, "job_title", "fonction") != null)
            contact.setJobTitle(getString(data, "job_title", "fonction"));

        if (getString(data, "sage_code", "ct_num") != null) {
            String sageCode = getString(data, "sage_code", "ct_num");
            accountRepository.findBySageCode(sageCode).ifPresent(contact::setAccount);
        }

        contact.setSageSyncedAt(Instant.now());
        contact = contactRepository.save(contact);
        item.setCrmId(contact.getId());
    }

    private void applyCA(SageSyncItem item, Map<String, Object> data) {
        String sageCode = getString(data, "sage_code", "ct_num");
        if (sageCode == null) return;

        accountRepository.findBySageCode(sageCode).ifPresent(account -> {
            Object caVal = data.get("ca_ht");
            if (caVal != null) {
                try {
                    account.setAnnualRevenue(new java.math.BigDecimal(caVal.toString()));
                    account.setSageSyncedAt(Instant.now());
                    accountRepository.save(account);
                    item.setCrmId(account.getId());
                } catch (NumberFormatException ignored) {}
            }
        });
    }

    private void applyObjective(SageSyncItem item, Map<String, Object> data) {
        log.info("Sync objectif Sage: {}", data);
        item.setCrmId(null);
    }

    // ── Produits ──────────────────────────────────────────────────────────────

    /**
     * Applique un enregistrement Sage F_ARTICLE sur un produit CRM.
     *
     * Mapping :
     *   AR_Ref        → sageCode (clé de matching)
     *   AR_Design     → name
     *   AR_PrixVen    → unitPrice
     *   AR_PrixAch    → costPrice
     *   AR_Unite      → unitOfMeasure
     *   FA_CodeFamille / AR_Famille → category.name (find or create)
     *   AR_Sommeil    → isActive (0 = actif, 1 = sommeil)
     */
    private void applyProduct(SageSyncItem item, Map<String, Object> data) {
        String arRef = getString(data, "ar_ref", "sage_code", "code", "ref");
        if (arRef == null) return;

        Product product;
        if ("UPDATE".equals(item.getAction()) && item.getCrmId() != null) {
            product = productRepository.findById(item.getCrmId()).orElseThrow();
        } else {
            product = productRepository.findBySageCode(arRef)
                    .orElseGet(() -> Product.builder()
                            .code(arRef)
                            .name(arRef)
                            .unitPrice(java.math.BigDecimal.ZERO)
                            .build());
        }

        product.setSageCode(arRef);

        String name = getString(data, "ar_design", "name", "designation");
        if (name != null) product.setName(name);

        java.math.BigDecimal unitPrice = getBigDecimal(data, "ar_prixven", "unit_price", "prix_vente");
        if (unitPrice != null) product.setUnitPrice(unitPrice);

        java.math.BigDecimal costPrice = getBigDecimal(data, "ar_prixach", "cost_price", "prix_achat");
        if (costPrice != null) product.setCostPrice(costPrice);

        String uom = getString(data, "ar_unite", "unit_of_measure", "unite");
        if (uom != null) product.setUnitOfMeasure(uom);

        // Famille → catégorie (find or create)
        String famCode = getString(data, "fa_codefamille", "ar_famille", "famille", "category");
        if (famCode != null && !famCode.isBlank()) {
            ProductCategory cat = productCategoryRepository.findByCode(famCode.toUpperCase())
                    .orElseGet(() -> {
                        ProductCategory newCat = new ProductCategory();
                        newCat.setCode(famCode.length() > 20 ? famCode.substring(0, 20).toUpperCase() : famCode.toUpperCase());
                        newCat.setName(famCode);
                        return productCategoryRepository.save(newCat);
                    });
            product.setCategory(cat);
        }

        // AR_Sommeil : 0 = actif, 1 = en sommeil (inactif)
        String sommeil = getString(data, "ar_sommeil", "sommeil");
        if (sommeil != null) {
            product.setIsActive("0".equals(sommeil.trim()) || "false".equalsIgnoreCase(sommeil.trim()));
        }

        product.setSageSyncedAt(Instant.now());
        product = productRepository.save(product);
        item.setCrmId(product.getId());
    }

    // ── Inventaire ────────────────────────────────────────────────────────────

    /**
     * Applique un enregistrement Sage F_ARTSTOCK sur un niveau de stock CRM.
     *
     * Mapping :
     *   AR_Ref     → Product via sageCode
     *   DE_No      → Warehouse via code (find or create)
     *   AS_QteSto  → quantityOnHand
     *   AS_QteRes  → quantityReserved
     *   AR_PAMP    → averageCost
     */
    private void applyInventory(SageSyncItem item, Map<String, Object> data) {
        String arRef = getString(data, "ar_ref", "sage_code");
        String deNo  = getString(data, "de_no", "depot");
        if (arRef == null || deNo == null) return;

        Product product = productRepository.findBySageCode(arRef).orElse(null);
        if (product == null) {
            log.warn("Inventaire Sage : produit introuvable pour AR_Ref={}", arRef);
            return;
        }

        // Dépôt : find or create par code
        Warehouse warehouse = warehouseRepository.findByCode(deNo)
                .orElseGet(() -> {
                    Warehouse wh = Warehouse.builder()
                            .code(deNo.length() > 20 ? deNo.substring(0, 20) : deNo)
                            .name("Dépôt " + deNo)
                            .build();
                    return warehouseRepository.save(wh);
                });

        StockLevel stockLevel = stockLevelRepository
                .findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseGet(() -> StockLevel.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .build());

        java.math.BigDecimal qteSto = getBigDecimal(data, "as_qtesto", "quantity_on_hand", "qte_stock");
        java.math.BigDecimal qteRes = getBigDecimal(data, "as_qteres", "quantity_reserved", "qte_reserve");
        java.math.BigDecimal pamp   = getBigDecimal(data, "ar_pamp",   "average_cost",     "pamp");

        if (qteSto != null) stockLevel.setQuantityOnHand(qteSto);
        if (qteRes != null) stockLevel.setQuantityReserved(qteRes);
        if (pamp   != null) stockLevel.setAverageCost(pamp);

        stockLevel = stockLevelRepository.save(stockLevel);
        item.setCrmId(stockLevel.getId());
    }

    // ── Ventes ────────────────────────────────────────────────────────────────

    /**
     * Applique un enregistrement Sage F_DOCENTETE sur le CA d'un compte CRM.
     * Réutilise la logique applyCA : met à jour annualRevenue par agrégation.
     *
     * Mapping :
     *   CT_Num      → Account.sageCode
     *   DO_TotalHT  → montant HT (ajouté à annualRevenue)
     */
    private void applyVente(SageSyncItem item, Map<String, Object> data) {
        String sageCode = getString(data, "ct_num", "sage_code", "client");
        if (sageCode == null) return;

        accountRepository.findBySageCode(sageCode).ifPresent(account -> {
            java.math.BigDecimal totalHt = getBigDecimal(data, "do_totalht", "montant_ht", "total_ht");
            if (totalHt != null) {
                java.math.BigDecimal current = account.getAnnualRevenue() != null
                        ? account.getAnnualRevenue() : java.math.BigDecimal.ZERO;
                account.setAnnualRevenue(current.add(totalHt));
                account.setSageSyncedAt(Instant.now());
                accountRepository.save(account);
                item.setCrmId(account.getId());
            }
        });
    }

    // ── Balance Âgée ─────────────────────────────────────────────────────────

    /**
     * Crée un snapshot de balance âgée pour le compte Sage donné.
     *
     * Mapping :
     *   CT_Num        → sageCode → account_id
     *   BA_NonEchu    → nonEchu
     *   BA_Echu1a30   → echu1a30
     *   BA_Echu31a60  → echu31a60
     *   BA_Echu61a90  → echu61a90
     *   BA_Echu91Plus → echu91plus
     *   BA_TotalDu    → totalDu
     */
    private void applyBalanceAgee(SageSyncItem item, Map<String, Object> data) {
        String sageCode = getString(data, "ct_num", "sage_code", "client");
        if (sageCode == null) return;

        Account account = accountRepository.findBySageCode(sageCode).orElse(null);

        BalanceAgeeSnapshot snapshot = BalanceAgeeSnapshot.builder()
                .syncRequest(item.getRequest())
                .account(account)
                .sageCode(sageCode)
                .nonEchu (getOrZero(getBigDecimal(data, "ba_nonechu",   "non_echu")))
                .echu1a30(getOrZero(getBigDecimal(data, "ba_echu1a30",  "echu_1_30")))
                .echu31a60(getOrZero(getBigDecimal(data, "ba_echu31a60","echu_31_60")))
                .echu61a90(getOrZero(getBigDecimal(data, "ba_echu61a90","echu_61_90")))
                .echu91plus(getOrZero(getBigDecimal(data, "ba_echu91plus","echu_91_plus")))
                .totalDu(getOrZero(getBigDecimal(data, "ba_totaldu",   "total_du")))
                .syncedAt(Instant.now())
                .build();

        snapshot = balanceAgeeSnapshotRepository.save(snapshot);
        item.setCrmId(snapshot.getId());
    }

    private java.math.BigDecimal getOrZero(java.math.BigDecimal v) {
        return v != null ? v : java.math.BigDecimal.ZERO;
    }

    // ── Helpers matching ──────────────────────────────────────────────────────

    /**
     * Version optimisée de findAccount : utilise d'abord le cache pré-chargé,
     * puis fall-back sur findByIce/findByName uniquement si nécessaire.
     */
    private Optional<Account> findAccountFast(String sageRef, Map<String, Object> row,
                                               Map<String, Account> accountBySageCode) {
        // 1. Cache pré-chargé (pas de requête DB)
        if (sageRef != null && !sageRef.isBlank()) {
            Account cached = accountBySageCode.get(sageRef);
            if (cached != null) return Optional.of(cached);
        }

        // 2. Fallback ICE (requête DB uniquement si pas trouvé par sage_code)
        String ice = getString(row, "ice");
        if (ice != null && !ice.isBlank()) {
            List<Account> byIce = accountRepository.findByIce(ice);
            if (!byIce.isEmpty()) return Optional.of(byIce.get(0));
        }

        // 3. Fallback nom
        String name = getString(row, "name", "ct_intitule", "nom");
        if (name != null) {
            List<Account> byName = accountRepository.findByNameIgnoreCase(name);
            if (!byName.isEmpty()) return Optional.of(byName.get(0));
        }

        return Optional.empty();
    }

    private Optional<Contact> findContact(Map<String, Object> row) {
        String email = getString(row, "email");
        if (email != null && !email.isBlank()) {
            return contactRepository.findByEmailIgnoreCase(email).stream().findFirst();
        }
        return Optional.empty();
    }

    /**
     * Calcule les différences entre le compte CRM existant et les données Sage.
     * Seuls les champs présents dans les données Sage (non-null) sont comparés.
     * Un champ absent dans Sage n'est jamais signalé comme différence.
     */
    private Map<String, Object> diffAccount(Account existing, Map<String, Object> row) {
        Map<String, Object> diff = new LinkedHashMap<>();

        // Identité
        addStringDiff(diff, "name",              existing.getName(),              getString(row, "name", "ct_intitule", "nom"));

        // Coordonnées
        addStringDiff(diff, "phone",             existing.getPhone(),             getString(row, "phone", "ct_telephone"));
        addStringDiff(diff, "website",           existing.getWebsite(),           getString(row, "website", "ct_site"));

        // Adresse facturation
        addStringDiff(diff, "billingStreet",     existing.getBillingStreet(),     getString(row, "billing_street", "ct_adresse", "adresse"));
        addStringDiff(diff, "billingCity",       existing.getBillingCity(),       getString(row, "billing_city", "ct_ville", "city"));
        addStringDiff(diff, "billingPostalCode", existing.getBillingPostalCode(), getString(row, "billing_postal_code", "ct_codepostal"));
        addStringDiff(diff, "billingCountry",    existing.getBillingCountry(),    getString(row, "billing_country", "ct_pays", "pays"));

        // Identification légale — Maroc
        addStringDiff(diff, "ice",               existing.getIce(),               getString(row, "ice"));
        addStringDiff(diff, "identifiantFiscal", existing.getIdentifiantFiscal(), getString(row, "identifiant_fiscal", "ct_if"));
        addStringDiff(diff, "rc",                existing.getRc(),                getString(row, "rc", "ct_rc"));

        // Identification légale — France
        addStringDiff(diff, "siret",             existing.getSiret(),             getString(row, "siret", "ct_siret"));
        addStringDiff(diff, "siren",             existing.getSiren(),             getString(row, "siren", "ct_siren"));

        // Classification Sage 100C
        addStringDiff(diff, "categorieClient",    existing.getCategorieClient(),    getString(row, "ct_categorie",          "categorie_client"));
        addStringDiff(diff, "categorieTarifaire", existing.getCategorieTarifaire(), getString(row, "ct_categorietarifaire", "categorie_tarifaire"));
        addStringDiff(diff, "secteurActivite",    existing.getSecteurActivite(),    getString(row, "ct_secteur",            "secteur_activite"));
        addStringDiff(diff, "typeCompteOdyssee",  existing.getTypeCompteOdyssee(),  getString(row, "ct_typecompte",         "type_compte_odyssee"));
        addStringDiff(diff, "prefecture",         existing.getPrefecture(),         getString(row, "ct_prefecture",         "prefecture"));
        addStringDiff(diff, "statutCompte",       existing.getStatutCompte(),       getString(row, "ct_statut",             "statut_compte"));
        addStringDiff(diff, "representant",       existing.getRepresentant(),       getString(row, "ct_representant",       "representant"));

        // Finance — encours (BigDecimal : compare les valeurs numériques)
        java.math.BigDecimal newEncours = getBigDecimal(row, "credit_limit", "ct_encours", "encours");
        if (newEncours != null) {
            java.math.BigDecimal crmEncours = existing.getCreditLimit() != null
                    ? existing.getCreditLimit() : java.math.BigDecimal.ZERO;
            if (newEncours.compareTo(crmEncours) != 0) {
                diff.put("creditLimit", new LinkedHashMap<>(Map.of(
                        "crm",  crmEncours.toPlainString(),
                        "sage", newEncours.toPlainString())));
            }
        }

        return diff;
    }

    /**
     * Ajoute une entrée dans le diff si la valeur Sage est non-null et différente du CRM.
     * Null-safe côté CRM : Objects.toString() évite les NPE avec Map.of().
     */
    private void addStringDiff(Map<String, Object> diff, String field,
                                String crmVal, String sageVal) {
        if (sageVal == null) return; // champ absent dans Sage → on n'y touche pas
        String crm = Objects.toString(crmVal, "");
        if (!sageVal.equals(crm)) {
            diff.put(field, new LinkedHashMap<>(Map.of("crm", crm, "sage", sageVal)));
        }
    }

    private Map<String, Object> diffProduct(Product existing, Map<String, Object> row) {
        Map<String, Object> diff = new LinkedHashMap<>();
        addStringDiff(diff, "name",          existing.getName(),          getString(row, "ar_design", "name", "designation"));
        addStringDiff(diff, "unitOfMeasure", existing.getUnitOfMeasure(), getString(row, "ar_unite",  "unit_of_measure", "unite"));
        addBigDecimalDiff(diff, "unitPrice", existing.getUnitPrice(),     getBigDecimal(row, "ar_prixven", "unit_price"));
        addBigDecimalDiff(diff, "costPrice", existing.getCostPrice(),     getBigDecimal(row, "ar_prixach", "cost_price"));
        // isActive via AR_Sommeil
        String sommeil = getString(row, "ar_sommeil", "sommeil");
        if (sommeil != null) {
            boolean sageActive = "0".equals(sommeil.trim()) || "false".equalsIgnoreCase(sommeil.trim());
            Boolean crmActive  = existing.getIsActive();
            if (crmActive == null || crmActive != sageActive) {
                diff.put("isActive", Map.of("crm", String.valueOf(crmActive), "sage", String.valueOf(sageActive)));
            }
        }
        return diff;
    }

    private Map<String, Object> diffInventory(StockLevel existing, Map<String, Object> row) {
        Map<String, Object> diff = new LinkedHashMap<>();
        addBigDecimalDiff(diff, "quantityOnHand",   existing.getQuantityOnHand(),   getBigDecimal(row, "as_qtesto", "quantity_on_hand"));
        addBigDecimalDiff(diff, "quantityReserved", existing.getQuantityReserved(), getBigDecimal(row, "as_qteres", "quantity_reserved"));
        addBigDecimalDiff(diff, "averageCost",      existing.getAverageCost(),      getBigDecimal(row, "ar_pamp",   "average_cost"));
        return diff;
    }

    private void addBigDecimalDiff(Map<String, Object> diff, String field,
                                    java.math.BigDecimal crmVal, java.math.BigDecimal sageVal) {
        if (sageVal == null) return;
        java.math.BigDecimal crm = crmVal != null ? crmVal : java.math.BigDecimal.ZERO;
        if (sageVal.compareTo(crm) != 0) {
            diff.put(field, new LinkedHashMap<>(Map.of("crm", crm.toPlainString(), "sage", sageVal.toPlainString())));
        }
    }

    private Map<String, Object> computeDiff(Object existing, Map<String, Object> row) {
        return Map.of(); // Simplifié pour les contacts
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private SageSyncRequestDto mapToDto(SageSyncRequest req, List<SageSyncItem> items) {
        var builder = SageSyncRequestDto.builder()
                .id(req.getId())
                .entityType(req.getEntityType())
                .label(req.getLabel())
                .sourceFormat(req.getSourceFormat())
                .status(req.getStatus())
                .totalItems(req.getTotalItems())
                .processedItems(req.getProcessedItems())
                .successItems(req.getSuccessItems())
                .errorItems(req.getErrorItems())
                .skipItems(req.getSkipItems())
                .periodYear(req.getPeriodYear())
                .periodMonth(req.getPeriodMonth())
                .createdByName(req.getCreatedBy() != null
                        ? req.getCreatedBy().getFirstName() + " " + req.getCreatedBy().getLastName()
                        : null)
                .processedAt(req.getProcessedAt())
                .createdAt(req.getCreatedAt());

        if (items != null) {
            builder.items(items.stream().map(i -> SageSyncRequestDto.SageSyncItemDto.builder()
                    .id(i.getId())
                    .rowIndex(i.getRowIndex() != null ? i.getRowIndex() : 0)
                    .sageRef(i.getSageRef())
                    .crmId(i.getCrmId())
                    .action(i.getAction())
                    .status(i.getStatus())
                    .rawData(i.getRawData())
                    .mappedData(i.getMappedData())
                    .diffData(i.getDiffData())
                    .errorMessage(i.getErrorMessage())
                    .build()).toList());
        }

        return builder.build();
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

    private String getString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null) val = map.get(key.toLowerCase());
            if (val == null) val = map.get(key.toUpperCase());
            if (val != null && !val.toString().isBlank()) return val.toString().trim();
        }
        return null;
    }

    /**
     * Extrait une valeur BigDecimal depuis les données Sage.
     * Gère les formats Sage : virgule décimale, espaces, parenthèses négatives.
     * Retourne null si la valeur est absente, vide, ou non numérique.
     */
    private java.math.BigDecimal getBigDecimal(Map<String, Object> map, String... keys) {
        String raw = getString(map, keys);
        if (raw == null) return null;
        try {
            // Normalisation : espace milliers → supprimé, virgule décimale → point
            String normalized = raw.replace(" ", "").replace("\u00A0", "").replace(",", ".");
            return new java.math.BigDecimal(normalized);
        } catch (NumberFormatException e) {
            log.debug("Valeur non numérique ignorée pour BigDecimal : '{}'", raw);
            return null;
        }
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }
}
