package com.opticrm.security.aspect;

import com.opticrm.security.annotation.RequirePermission;
import com.opticrm.security.dto.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class PermissionAspect {

    @Before("@annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentification requise");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal)) {
            throw new AccessDeniedException("Utilisateur non reconnu");
        }

        UserPrincipal userPrincipal = (UserPrincipal) principal;

        // SUPER_ADMIN bypasses all permission checks
        if (userPrincipal.hasRole("SUPER_ADMIN")) {
            return;
        }

        String module = requirePermission.module();
        String action = requirePermission.action();

        if (!userPrincipal.hasPermission(module, action)) {
            log.warn("Permission refusée: user={}, module={}, action={}",
                    userPrincipal.getEmail(), module, action);
            throw new AccessDeniedException(
                    String.format("Vous n'avez pas la permission '%s' sur le module '%s'", action, module));
        }
    }
}
