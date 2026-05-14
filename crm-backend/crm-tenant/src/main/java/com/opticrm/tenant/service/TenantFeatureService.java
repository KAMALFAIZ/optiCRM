package com.opticrm.tenant.service;

import com.opticrm.tenant.entity.SubscriptionPlan;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.exception.PlanLimitException;
import com.opticrm.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Enforces subscription plan limits (max users, max accounts, feature flags).
 * Called from UserService.createUser() and AccountService.createAccount().
 */
@Service
@RequiredArgsConstructor
public class TenantFeatureService {

    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public void enforceMaxUsers(UUID tenantId, long currentUserCount) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            int maxUsers = effectiveMaxUsers(tenant);
            if (maxUsers > 0 && currentUserCount >= maxUsers) {
                throw new PlanLimitException(
                    "Limite du plan atteinte : " + maxUsers + " utilisateurs maximum. " +
                    "Passez à un plan supérieur pour ajouter plus d'utilisateurs."
                );
            }
        });
    }

    @Transactional(readOnly = true)
    public void enforceMaxAccounts(UUID tenantId, long currentAccountCount) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            SubscriptionPlan plan = tenant.getPlan();
            if (plan == null) return;
            int maxAccounts = plan.getMaxAccounts();
            if (maxAccounts > 0 && currentAccountCount >= maxAccounts) {
                throw new PlanLimitException(
                    "Limite du plan atteinte : " + maxAccounts + " comptes maximum. " +
                    "Passez à un plan supérieur pour ajouter plus de comptes."
                );
            }
        });
    }

    @Transactional(readOnly = true)
    public boolean isFeatureEnabled(UUID tenantId, String feature) {
        return tenantRepository.findById(tenantId)
                .map(tenant -> {
                    SubscriptionPlan plan = tenant.getPlan();
                    if (plan == null) return false;
                    Map<String, Object> features = plan.getFeatures();
                    if (features == null) return false;
                    return Boolean.TRUE.equals(features.get(feature));
                })
                .orElse(false);
    }

    private int effectiveMaxUsers(Tenant tenant) {
        // License override takes priority (on-premise)
        if (tenant.getMaxUsers() != null && tenant.getMaxUsers() > 0) {
            return tenant.getMaxUsers();
        }
        SubscriptionPlan plan = tenant.getPlan();
        return plan != null ? plan.getMaxUsers() : -1;
    }
}
