package com.opticrm.tenant.health;

import com.opticrm.tenant.config.DeploymentModeProperties;
import com.opticrm.tenant.license.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.deployment.mode", havingValue = "onpremise", matchIfMissing = true)
@RequiredArgsConstructor
public class LicenseHealthIndicator implements HealthIndicator {

    private final LicenseService licenseService;

    @Override
    public Health health() {
        LicenseService.LicenseStatus status = licenseService.getStatus();
        String message = licenseService.getStatusMessage();

        if (licenseService.isOperational()) {
            return Health.up()
                    .withDetail("license", status.name())
                    .withDetail("message", message)
                    .build();
        } else {
            return Health.down()
                    .withDetail("license", status.name())
                    .withDetail("message", message)
                    .build();
        }
    }
}
