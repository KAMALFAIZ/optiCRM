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

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;
    private final TenantDataSourceManager dataSourceManager;

    @Transactional(readOnly = true)
    public Tenant getCurrentTenant() {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) throw new TenantNotFoundException("current");
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
    }

    @Transactional(readOnly = true)
    public Tenant getById(UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public Tenant findBySlug(String slug) {
        return tenantRepository.findBySlug(slug.toLowerCase().trim()).orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isSlugAvailable(String slug) {
        return !tenantRepository.existsBySlug(slug);
    }

    @Transactional
    public Tenant createTenant(String slug, String name, String adminEmail, String planId) {
        SubscriptionPlan plan = planRepository.findById(planId).orElse(null);
        Tenant tenant = Tenant.builder()
                .slug(slug.toLowerCase().trim())
                .name(name)
                .adminEmail(adminEmail)
                .plan(plan)
                .status(Tenant.TenantStatus.TRIAL)
                .build();
        return tenantRepository.save(tenant);
    }

    @Transactional
    public Tenant updateStatus(UUID tenantId, Tenant.TenantStatus status) {
        Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
        tenant.setStatus(status);
        Tenant saved = tenantRepository.save(tenant);

        if (status == Tenant.TenantStatus.CANCELLED || status == Tenant.TenantStatus.SUSPENDED) {
            dataSourceManager.deregister(tenantId);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getActivePlans() {
        return planRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAllWithPlan();
    }

    @Transactional
    public void deleteTenant(UUID tenantId) {
        Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
        tenantRepository.delete(tenant);
    }

    @Transactional
    public Tenant updateTenant(UUID tenantId, String name, String adminEmail, String planId) {
        Tenant tenant = tenantRepository.findByIdWithPlan(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));
        if (name != null && !name.isBlank()) tenant.setName(name);
        if (adminEmail != null && !adminEmail.isBlank()) tenant.setAdminEmail(adminEmail);
        if (planId != null) {
            SubscriptionPlan plan = planRepository.findById(planId).orElse(null);
            tenant.setPlan(plan);
        }
        return tenantRepository.save(tenant);
    }
}
