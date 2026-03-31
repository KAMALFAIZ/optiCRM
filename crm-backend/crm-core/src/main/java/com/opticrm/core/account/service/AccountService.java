package com.opticrm.core.account.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.dto.*;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.entity.AccountPhoto;
import com.opticrm.core.account.entity.Industry;
import com.opticrm.core.account.entity.PricingCategory;
import com.opticrm.core.account.repository.AccountPhotoRepository;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.account.repository.IndustryRepository;
import com.opticrm.core.account.repository.PricingCategoryRepository;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.TerritoryRepository;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final IndustryRepository industryRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final TerritoryRepository territoryRepository;
    private final AccountPhotoRepository accountPhotoRepository;
    private final FileStorageService fileStorageService;
    private final PricingCategoryRepository pricingCategoryRepository;
    private final HealthScoreService healthScoreService;

    @Transactional(readOnly = true)
    public AccountDto getById(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id));
        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public Page<AccountListDto> list(PageRequest pageRequest, String search, String accountType,
                                     String assignedToId, String territoryId, Boolean hasSageCode,
                                     String societeAffectation) {
        Page<Account> accounts;

        // COMMERCIAL ne voit que ses propres comptes
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                return accountRepository.findByAssignedToId(uid,
                        pageRequest.toPageable("name", Sort.Direction.ASC)).map(this::mapToListDto);
            }
        }

        if (societeAffectation != null && !societeAffectation.isBlank()) {
            accounts = accountRepository.findBySocieteAffectation(societeAffectation,
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (Boolean.TRUE.equals(hasSageCode)) {
            accounts = accountRepository.findBySageCodeIsNotNull(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (search != null && !search.isBlank()) {
            accounts = accountRepository.search(search.trim(),
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (accountType != null) {
            accounts = accountRepository.findByAccountType(accountType,
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (assignedToId != null) {
            accounts = accountRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (territoryId != null) {
            accounts = accountRepository.findByTerritoryId(UUID.fromString(territoryId),
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else {
            accounts = accountRepository.findAll(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        }

        return accounts.map(this::mapToListDto);
    }

    @Transactional
    public AccountDto create(CreateAccountRequest request) {
        // Check for duplicates
        if (request.getSiret() != null && accountRepository.existsBySiret(request.getSiret())) {
            throw new DuplicateEntryException("siret", request.getSiret());
        }
        if (request.getSiren() != null && accountRepository.existsBySiren(request.getSiren())) {
            throw new DuplicateEntryException("siren", request.getSiren());
        }

        Account account = Account.builder()
                .name(request.getName())
                .legalName(request.getLegalName())
                .codeClientCrm(request.getCodeClientCrm())
                .societeAffectation(request.getSocieteAffectation())
                .ice(request.getIce())
                .identifiantFiscal(request.getIdentifiantFiscal())
                .rc(request.getRc())
                .cnss(request.getCnss())
                .patente(request.getPatente())
                .capitalSocial(request.getCapitalSocial())
                .associes(request.getAssocies())
                .siret(request.getSiret())
                .siren(request.getSiren())
                .vatNumber(request.getVatNumber())
                .secteurActivite(request.getSecteurActivite())
                .categorieClient(request.getCategorieClient())
                .accountType(request.getAccountType())
                .employeeCount(request.getEmployeeCount())
                .annualRevenue(request.getAnnualRevenue())
                .revenueCurrency(request.getRevenueCurrency() != null ? request.getRevenueCurrency() : "EUR")
                .billingStreet(request.getBillingStreet())
                .billingCity(request.getBillingCity())
                .billingState(request.getBillingState())
                .billingPostalCode(request.getBillingPostalCode())
                .billingCountry(request.getBillingCountry())
                .shippingStreet(request.getShippingStreet())
                .shippingCity(request.getShippingCity())
                .shippingState(request.getShippingState())
                .shippingPostalCode(request.getShippingPostalCode())
                .shippingCountry(request.getShippingCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .website(request.getWebsite())
                .phone(request.getPhone())
                .whatsapp(request.getWhatsapp())
                .segment(request.getSegment())
                .tags(request.getTags())
                .famille(request.getFamille())
                .typeCompteOdyssee(request.getTypeCompteOdyssee())
                .prefecture(request.getPrefecture())
                .rolePrincipal(request.getRolePrincipal())
                .statutCompte(request.getStatutCompte())
                .potentiel(request.getPotentiel())
                .actionSuivante(request.getActionSuivante())
                .dateProchaineAction(request.getDateProchaineAction())
                .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO)
                .insuranceAmount(request.getInsuranceAmount() != null ? request.getInsuranceAmount() : BigDecimal.ZERO)
                .insuranceCompany(request.getInsuranceCompany())
                .build();

        // Set relations
        if (request.getIndustryId() != null) {
            Industry industry = industryRepository.findById(UUID.fromString(request.getIndustryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Industry", request.getIndustryId()));
            account.setIndustry(industry);
        }

        if (request.getParentAccountId() != null) {
            Account parent = accountRepository.findById(UUID.fromString(request.getParentAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getParentAccountId()));
            account.setParentAccount(parent);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            account.setAssignedTo(assignedTo);
        } else if (ContextUtils.hasRole("COMMERCIAL")) {
            // Auto-assigner le compte au commercial qui le crée
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    account.setAssignedTo(currentUser);
                    log.info("Auto-assigned account '{}' to commercial '{}'", request.getName(), currentUser.getEmail());
                }
            }
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(UUID.fromString(request.getTerritoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Territory", request.getTerritoryId()));
            account.setTerritory(territory);
        }

        if (request.getPaymentTermsId() != null) {
            account.setPaymentTermsId(UUID.fromString(request.getPaymentTermsId()));
        }

        if (request.getPricingCategoryId() != null) {
            PricingCategory pc = pricingCategoryRepository.findById(UUID.fromString(request.getPricingCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", request.getPricingCategoryId()));
            account.setPricingCategory(pc);
        }

        account = accountRepository.save(account);
        log.info("Created account: {}", account.getName());

        return mapToDto(account);
    }

    @Transactional
    public AccountDto update(UUID id, UpdateAccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id));

        // Check uniqueness
        if (request.getSiret() != null && !request.getSiret().equals(account.getSiret())) {
            if (accountRepository.existsBySiret(request.getSiret())) {
                throw new DuplicateEntryException("siret", request.getSiret());
            }
        }
        if (request.getSiren() != null && !request.getSiren().equals(account.getSiren())) {
            if (accountRepository.existsBySiren(request.getSiren())) {
                throw new DuplicateEntryException("siren", request.getSiren());
            }
        }

        // Optimistic locking — si le frontend envoie une version, on la force sur l'entité
        if (request.getVersion() != null) {
            account.setVersion(request.getVersion());
        }

        // Update fields if provided
        if (request.getName() != null) account.setName(request.getName());
        if (request.getLegalName() != null) account.setLegalName(request.getLegalName());
        if (request.getCodeClientCrm() != null) account.setCodeClientCrm(request.getCodeClientCrm());
        if (request.getSocieteAffectation() != null) account.setSocieteAffectation(request.getSocieteAffectation());
        if (request.getIce() != null) account.setIce(request.getIce());
        if (request.getIdentifiantFiscal() != null) account.setIdentifiantFiscal(request.getIdentifiantFiscal());
        if (request.getRc() != null) account.setRc(request.getRc());
        if (request.getCnss() != null) account.setCnss(request.getCnss());
        if (request.getPatente() != null) account.setPatente(request.getPatente());
        if (request.getCapitalSocial() != null) account.setCapitalSocial(request.getCapitalSocial());
        if (request.getAssocies() != null) account.setAssocies(request.getAssocies());
        if (request.getSecteurActivite() != null) account.setSecteurActivite(request.getSecteurActivite());
        if (request.getCategorieClient() != null) account.setCategorieClient(request.getCategorieClient());
        if (request.getSiret() != null) account.setSiret(request.getSiret());
        if (request.getSiren() != null) account.setSiren(request.getSiren());
        if (request.getVatNumber() != null) account.setVatNumber(request.getVatNumber());
        if (request.getAccountType() != null) account.setAccountType(request.getAccountType());
        if (request.getEmployeeCount() != null) account.setEmployeeCount(request.getEmployeeCount());
        if (request.getAnnualRevenue() != null) account.setAnnualRevenue(request.getAnnualRevenue());
        if (request.getRevenueCurrency() != null) account.setRevenueCurrency(request.getRevenueCurrency());
        if (request.getBillingStreet() != null) account.setBillingStreet(request.getBillingStreet());
        if (request.getBillingCity() != null) account.setBillingCity(request.getBillingCity());
        if (request.getBillingState() != null) account.setBillingState(request.getBillingState());
        if (request.getBillingPostalCode() != null) account.setBillingPostalCode(request.getBillingPostalCode());
        if (request.getBillingCountry() != null) account.setBillingCountry(request.getBillingCountry());
        if (request.getShippingStreet() != null) account.setShippingStreet(request.getShippingStreet());
        if (request.getShippingCity() != null) account.setShippingCity(request.getShippingCity());
        if (request.getShippingState() != null) account.setShippingState(request.getShippingState());
        if (request.getShippingPostalCode() != null) account.setShippingPostalCode(request.getShippingPostalCode());
        if (request.getShippingCountry() != null) account.setShippingCountry(request.getShippingCountry());
        if (request.getLatitude() != null) account.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) account.setLongitude(request.getLongitude());
        if (request.getWebsite() != null) account.setWebsite(request.getWebsite());
        if (request.getPhone() != null) account.setPhone(request.getPhone());
        if (request.getWhatsapp() != null) account.setWhatsapp(request.getWhatsapp());
        if (request.getAccountScore() != null) account.setAccountScore(request.getAccountScore());
        if (request.getSegment() != null) account.setSegment(request.getSegment());
        if (request.getTags() != null) account.setTags(request.getTags());
        if (request.getFamille() != null) account.setFamille(request.getFamille());
        if (request.getTypeCompteOdyssee() != null) account.setTypeCompteOdyssee(request.getTypeCompteOdyssee());
        if (request.getPrefecture() != null) account.setPrefecture(request.getPrefecture());
        if (request.getRolePrincipal() != null) account.setRolePrincipal(request.getRolePrincipal());
        if (request.getStatutCompte() != null) account.setStatutCompte(request.getStatutCompte());
        if (request.getRepresentant() != null) account.setRepresentant(request.getRepresentant());
        if (request.getPotentiel() != null) account.setPotentiel(request.getPotentiel());
        if (request.getActionSuivante() != null) account.setActionSuivante(request.getActionSuivante());
        if (request.getDateProchaineAction() != null) account.setDateProchaineAction(request.getDateProchaineAction());
        if (request.getCreditLimit() != null) account.setCreditLimit(request.getCreditLimit());
        if (request.getInsuranceAmount() != null) account.setInsuranceAmount(request.getInsuranceAmount());
        if (request.getInsuranceCompany() != null) account.setInsuranceCompany(request.getInsuranceCompany());

        // Update relations
        if (request.getIndustryId() != null) {
            Industry industry = industryRepository.findById(UUID.fromString(request.getIndustryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Industry", request.getIndustryId()));
            account.setIndustry(industry);
        }

        if (request.getParentAccountId() != null) {
            Account parent = accountRepository.findById(UUID.fromString(request.getParentAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getParentAccountId()));
            account.setParentAccount(parent);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            account.setAssignedTo(assignedTo);
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(UUID.fromString(request.getTerritoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Territory", request.getTerritoryId()));
            account.setTerritory(territory);
        }

        if (request.getPaymentTermsId() != null) {
            account.setPaymentTermsId(UUID.fromString(request.getPaymentTermsId()));
        }

        if (request.getPricingCategoryId() != null) {
            if (request.getPricingCategoryId().isBlank()) {
                account.setPricingCategory(null);
            } else {
                PricingCategory pc = pricingCategoryRepository.findById(UUID.fromString(request.getPricingCategoryId()))
                        .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", request.getPricingCategoryId()));
                account.setPricingCategory(pc);
            }
        }

        account = accountRepository.save(account);
        log.info("Updated account: {}", id);

        return mapToDto(account);
    }

    @Transactional
    public void delete(UUID id) {
        if (!accountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Account", id);
        }
        accountRepository.deleteById(id);
        log.info("Deleted account: {}", id);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getAccountTypeStats() {
        return accountRepository.countByAccountTypeGrouped()
                .stream()
                .collect(Collectors.toMap(
                        arr -> (String) arr[0],
                        arr -> (Long) arr[1]
                ));
    }

    @Transactional(readOnly = true)
    public List<AccountListDto> getChildAccounts(UUID parentId) {
        return accountRepository.findByParentAccountId(parentId)
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    // Mapping methods
    private AccountDto mapToDto(Account account) {
        long contactCount = contactRepository.countByAccountId(account.getId());

        AccountDto.AccountDtoBuilder builder = AccountDto.builder()
                .id(account.getId().toString())
                .name(account.getName())
                .legalName(account.getLegalName())
                .codeClientCrm(account.getCodeClientCrm())
                .societeAffectation(account.getSocieteAffectation())
                .siret(account.getSiret())
                .siren(account.getSiren())
                .vatNumber(account.getVatNumber())
                .accountType(account.getAccountType())
                .employeeCount(account.getEmployeeCount())
                .annualRevenue(account.getAnnualRevenue())
                .revenueCurrency(account.getRevenueCurrency())
                .billingStreet(account.getBillingStreet())
                .billingCity(account.getBillingCity())
                .billingState(account.getBillingState())
                .billingPostalCode(account.getBillingPostalCode())
                .billingCountry(account.getBillingCountry())
                .fullBillingAddress(account.getFullBillingAddress())
                .shippingStreet(account.getShippingStreet())
                .shippingCity(account.getShippingCity())
                .shippingState(account.getShippingState())
                .shippingPostalCode(account.getShippingPostalCode())
                .shippingCountry(account.getShippingCountry())
                .latitude(account.getLatitude())
                .longitude(account.getLongitude())
                .logoUrl(account.getLogoUrl())
                .website(account.getWebsite())
                .phone(account.getPhone())
                .whatsapp(account.getWhatsapp())
                .accountScore(account.getAccountScore())
                .segment(account.getSegment())
                .tags(account.getTags())
                .famille(account.getFamille())
                .typeCompteOdyssee(account.getTypeCompteOdyssee())
                .prefecture(account.getPrefecture())
                .rolePrincipal(account.getRolePrincipal())
                .statutCompte(account.getStatutCompte())
                .secteurActivite(account.getSecteurActivite())
                .categorieClient(account.getCategorieClient())
                .capitalSocial(account.getCapitalSocial())
                .associes(account.getAssocies())
                .categorieTarifaire(account.getCategorieTarifaire())
                .representant(account.getRepresentant())
                .potentiel(account.getPotentiel())
                .actionSuivante(account.getActionSuivante())
                .dateProchaineAction(account.getDateProchaineAction())
                .creditLimit(account.getCreditLimit())
                .insuranceAmount(account.getInsuranceAmount())
                .insuranceCompany(account.getInsuranceCompany())
                .paymentTermsId(account.getPaymentTermsId() != null ? account.getPaymentTermsId().toString() : null)
                .contactCount((int) contactCount)
                .version(account.getVersion())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt());

        if (account.getIndustry() != null) {
            builder.industry(AccountDto.IndustrySummary.builder()
                    .id(account.getIndustry().getId().toString())
                    .code(account.getIndustry().getCode())
                    .name(account.getIndustry().getName())
                    .build());
        }

        if (account.getParentAccount() != null) {
            builder.parentAccount(AccountDto.AccountSummary.builder()
                    .id(account.getParentAccount().getId().toString())
                    .name(account.getParentAccount().getName())
                    .build());
        }

        if (account.getAssignedTo() != null) {
            builder.assignedTo(AccountDto.UserSummary.builder()
                    .id(account.getAssignedTo().getId().toString())
                    .fullName(account.getAssignedTo().getFullName())
                    .email(account.getAssignedTo().getEmail())
                    .build());
        }

        if (account.getTerritory() != null) {
            builder.territory(AccountDto.TerritorySummary.builder()
                    .id(account.getTerritory().getId().toString())
                    .name(account.getTerritory().getName())
                    .region(account.getTerritory().getRegion())
                    .build());
        }

        if (account.getPricingCategory() != null) {
            builder.pricingCategory(AccountDto.PricingCategorySummary.builder()
                    .id(account.getPricingCategory().getId().toString())
                    .code(account.getPricingCategory().getCode())
                    .name(account.getPricingCategory().getName())
                    .isDefault(account.getPricingCategory().getIsDefault())
                    .build());
        }

        // Map photos
        List<AccountPhotoDto> photoDtos = accountPhotoRepository
                .findByAccountIdOrderByDisplayOrderAscUploadedAtAsc(account.getId())
                .stream()
                .map(p -> AccountPhotoDto.builder()
                        .id(p.getId().toString())
                        .url(p.getUrl())
                        .caption(p.getCaption())
                        .displayOrder(p.getDisplayOrder())
                        .uploadedAt(p.getUploadedAt())
                        .build())
                .collect(Collectors.toList());
        builder.photos(photoDtos);

        return builder.build();
    }

    // Photo management
    @Transactional
    public AccountPhotoDto uploadPhoto(UUID accountId, MultipartFile file, String caption) throws java.io.IOException {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        String url = fileStorageService.storeAccountPhoto(file);
        int order = accountPhotoRepository.countByAccountId(accountId);

        AccountPhoto photo = AccountPhoto.builder()
                .account(account)
                .url(url)
                .caption(caption)
                .displayOrder(order)
                .build();

        photo = accountPhotoRepository.save(photo);
        log.info("Photo uploaded for account {}: {}", accountId, url);

        return AccountPhotoDto.builder()
                .id(photo.getId().toString())
                .url(photo.getUrl())
                .caption(photo.getCaption())
                .displayOrder(photo.getDisplayOrder())
                .uploadedAt(photo.getUploadedAt())
                .build();
    }

    @Transactional
    public AccountDto uploadLogo(UUID accountId, MultipartFile file) throws java.io.IOException {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        String url = fileStorageService.storeAccountPhoto(file);
        account.setLogoUrl(url);
        accountRepository.save(account);
        log.info("Logo uploaded for account {}: {}", accountId, url);
        return mapToDto(account);
    }

    @Transactional
    public void deletePhoto(UUID accountId, UUID photoId) {
        accountPhotoRepository.deleteByAccountIdAndId(accountId, photoId);
        log.info("Photo {} deleted from account {}", photoId, accountId);
    }

    public List<AccountListDto> getAllGeolocated() {
        return accountRepository.findAllGeolocated().stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    private AccountListDto mapToListDto(Account account) {
        long contactCount = contactRepository.countByAccountId(account.getId());

        return AccountListDto.builder()
                .id(account.getId().toString())
                .name(account.getName())
                .logoUrl(account.getLogoUrl())
                .accountType(account.getAccountType())
                .segment(account.getSegment())
                .famille(account.getFamille())
                .typeCompteOdyssee(account.getTypeCompteOdyssee())
                .prefecture(account.getPrefecture())
                .statutCompte(account.getStatutCompte())
                .potentiel(account.getPotentiel())
                .industryName(account.getIndustry() != null ? account.getIndustry().getName() : null)
                .billingCity(account.getBillingCity())
                .billingCountry(account.getBillingCountry())
                .phone(account.getPhone())
                .ice(account.getIce())
                .sageCode(account.getSageCode())
                .codeClientCrm(account.getCodeClientCrm())
                .societeAffectation(account.getSocieteAffectation())
                .website(account.getWebsite())
                .annualRevenue(account.getAnnualRevenue())
                .assignedToName(account.getAssignedTo() != null ? account.getAssignedTo().getFullName() : null)
                .contactCount((int) contactCount)
                .accountScore(account.getAccountScore())
                .representant(account.getRepresentant())
                .categorieClient(account.getCategorieClient())
                .secteurActivite(account.getSecteurActivite())
                .latitude(account.getLatitude())
                .longitude(account.getLongitude())
                .build();
    }
}
