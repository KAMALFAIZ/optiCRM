package com.opticrm.security.dto;

import com.opticrm.security.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final UUID tenantId;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;
    private final boolean enabled;
    private final boolean locked;
    private final UUID teamId;
    private final UUID territoryId;
    private final String roleName;
    private final Map<String, Object> permissions;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.tenantId = user.getTenantId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.enabled = user.getIsActive();
        this.locked = user.isLocked();
        this.teamId = user.getTeam() != null ? user.getTeam().getId() : null;
        this.territoryId = user.getTerritory() != null ? user.getTerritory().getId() : null;

        if (user.getRole() != null) {
            this.roleName = user.getRole().getName();
            this.permissions = user.getRole().getPermissions() != null
                    ? user.getRole().getPermissions()
                    : Collections.emptyMap();
            this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().toUpperCase()));
        } else {
            this.roleName = null;
            this.permissions = Collections.emptyMap();
            this.authorities = Collections.emptyList();
        }
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean hasPermission(String module, String action) {
        if (permissions == null || permissions.isEmpty()) {
            return false;
        }

        Object modulePerms = permissions.get(module);
        if (modulePerms instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Boolean> perms = (Map<String, Boolean>) modulePerms;
            return Boolean.TRUE.equals(perms.get(action));
        }

        return false;
    }

    public boolean hasRole(String role) {
        return roleName != null && roleName.equalsIgnoreCase(role);
    }

    public boolean isAdmin() {
        return hasRole("SUPER_ADMIN") || hasRole("ADMIN");
    }

    public boolean isManager() {
        return hasRole("MANAGER") || isAdmin();
    }
}
