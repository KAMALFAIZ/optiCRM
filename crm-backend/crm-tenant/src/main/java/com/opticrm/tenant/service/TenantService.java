package com.opticrm.tenant.service;

import com.opticrm.tenant.context.TenantContext;
import com.opticrm.tenant.datasource.TenantDataSourceManager;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.entity.SubscriptionPlan;
import com.opticrm.tenant.exception.TenantNotFoundException;
import com.opticrm.tenant.repository.TenantRepository;
import com.opticrm.tenant.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service de gestion des tenants SaaS.
 *
 * IMPORTANT — Toutes les opérations qui lisent/écrivent dans la table `tenants`
 * doivent utiliser le datasource SYSTÈME (opticrm), pas le routing datasource du
 * tenant courant. On force ça en vidant temporairement le TenantContext avant
 * chaque opération sur le registre des tenants.
 *
 * Sans ça, un admin connecté sur le tenant "default" ferait écrire JPA dans
 * opticrm_default.tenants au lieu de opticrm.tenants — les nouveaux tenants
 * ne seraient jamais visibles par TenantDataSourceManager ni resolveSlug.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;
    private final TenantDataSourceManager dataSourceManager;

    /**
     * Exécute une opération en forçant le datasource système (TenantContext = null
     * → TenantRoutingDataSource fallback vers systemDataSource = opticrm).
     */
    private <T> T withSystemContext(java.util.function.Supplier<T> supplier) {
        UUID previous = TenantContext.get();
        TenantContext.clear();
        try {
            return supplier.get();
        } finally {
            if (previous != null) TenantContext.set(previous);
            else TenantContext.clear();
        }
    }

    @Transactional(readOnly = true)
    public Tenant getCurrentTenant() {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) throw new TenantNotFoundException("current");
        // getCurrentTenant lit le tenant courant depuis sa propre base — pas de withSystemContext ici
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
    }

    @Transactional(readOnly = true)
    public Tenant getById(UUID id) {
        return withSystemContext(() ->
            tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException(id.toString()))
        );
    }

    @Transactional(readOnly = true)
    public Tenant findBySlug(String slug) {
        return withSystemContext(() ->
            tenantRepository.findBySlug(slug.toLowerCase().trim()).orElse(null)
        );
    }

    @Transactional(readOnly = true)
    public boolean isSlugAvailable(String slug) {
        return withSystemContext(() -> !tenantRepository.existsBySlug(slug));
    }

    @Transactional
    public Tenant createTenant(String slug, String name, String adminEmail, String planId,
                               String phone, String address, String city, String ice,
                               String logoUrl, String primaryColor, String customDomain, Integer maxUsers) {
        return withSystemContext(() -> {
            SubscriptionPlan plan = planRepository.findById(planId).orElse(null);
            Tenant.TenantBuilder builder = Tenant.builder()
                    .slug(slug.toLowerCase().trim())
                    .name(name)
                    .adminEmail(adminEmail)
                    .plan(plan)
                    .status(Tenant.TenantStatus.TRIAL);
            if (phone != null && !phone.isBlank()) builder.phone(phone);
            if (address != null && !address.isBlank()) builder.address(address);
            if (city != null && !city.isBlank()) builder.city(city);
            if (ice != null && !ice.isBlank()) builder.ice(ice);
            if (logoUrl != null && !logoUrl.isBlank()) builder.logoUrl(logoUrl);
            if (primaryColor != null && !primaryColor.isBlank()) builder.primaryColor(primaryColor);
            if (customDomain != null && !customDomain.isBlank()) builder.customDomain(customDomain);
            if (maxUsers != null && maxUsers > 0) builder.maxUsers(maxUsers);
            return tenantRepository.save(builder.build());
        });
    }

    @Transactional
    public Tenant updateStatus(UUID tenantId, Tenant.TenantStatus status) {
        return withSystemContext(() -> {
            Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                    .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
            tenant.setStatus(status);
            Tenant saved = tenantRepository.save(tenant);

            if (status == Tenant.TenantStatus.CANCELLED || status == Tenant.TenantStatus.SUSPENDED) {
                dataSourceManager.deregister(tenantId);
            }

            return saved;
        });
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getActivePlans() {
        return withSystemContext(() ->
            planRepository.findByIsActiveTrueOrderBySortOrderAsc()
        );
    }

    @Transactional(readOnly = true)
    public List<Tenant> getAllTenants() {
        return withSystemContext(() -> tenantRepository.findAllWithPlan());
    }

    @Transactional
    public void deleteTenant(UUID tenantId) {
        withSystemContext(() -> {
            Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                    .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
            tenantRepository.delete(tenant);
            return null;
        });
    }

    @Transactional
    public Tenant updateTenant(UUID tenantId, String slug, String name, String adminEmail, String planId,
                               String phone, String address, String city, String ice,
                               String logoUrl, String primaryColor, String customDomain, Integer maxUsers) {
        return withSystemContext(() -> {
            Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                    .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
            if (slug != null && !slug.isBlank()) tenant.setSlug(slug.toLowerCase().trim());
            if (name != null && !name.isBlank()) tenant.setName(name);
            if (adminEmail != null && !adminEmail.isBlank()) tenant.setAdminEmail(adminEmail);
            if (planId != null) {
                SubscriptionPlan plan = planRepository.findById(planId).orElse(null);
                tenant.setPlan(plan);
            }
            if (phone != null) tenant.setPhone(phone.isBlank() ? null : phone);
            if (address != null) tenant.setAddress(address.isBlank() ? null : address);
            if (city != null) tenant.setCity(city.isBlank() ? null : city);
            if (ice != null) tenant.setIce(ice.isBlank() ? null : ice);
            if (logoUrl != null) tenant.setLogoUrl(logoUrl.isBlank() ? null : logoUrl);
            if (primaryColor != null && !primaryColor.isBlank()) tenant.setPrimaryColor(primaryColor);
            if (customDomain != null) tenant.setCustomDomain(customDomain.isBlank() ? null : customDomain);
            if (maxUsers != null) tenant.setMaxUsers(maxUsers);
            return tenantRepository.save(tenant);
        });
    }
}
