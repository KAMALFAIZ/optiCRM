package com.opticrm.security.service;

import com.opticrm.security.dto.CreateRoleRequest;
import com.opticrm.security.dto.RoleResponse;
import com.opticrm.security.dto.UpdateRoleRequest;
import com.opticrm.security.entity.Role;
import com.opticrm.security.repository.RoleRepository;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public List<RoleResponse> listAll() {
        return roleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RoleResponse getById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable avec l'ID: " + id));
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse create(CreateRoleRequest request) {
        if (roleRepository.existsByName(request.getName().toUpperCase())) {
            throw new RuntimeException("Un rôle avec le nom '" + request.getName() + "' existe déjà");
        }

        Role role = Role.builder()
                .name(request.getName().toUpperCase())
                .description(request.getDescription())
                .permissions(request.getPermissions() != null ? request.getPermissions() : Map.of())
                .isSystem(false)
                .build();

        role = roleRepository.save(role);
        log.info("Rôle créé: {} ({})", role.getName(), role.getId());
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse update(UUID id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable avec l'ID: " + id));

        if (role.getIsSystem()) {
            // System roles: allow updating description and permissions only
            if (request.getDescription() != null) {
                role.setDescription(request.getDescription());
            }
            if (request.getPermissions() != null) {
                role.setPermissions(request.getPermissions());
            }
        } else {
            if (request.getName() != null) {
                String newName = request.getName().toUpperCase();
                if (!newName.equals(role.getName()) && roleRepository.existsByName(newName)) {
                    throw new RuntimeException("Un rôle avec le nom '" + request.getName() + "' existe déjà");
                }
                role.setName(newName);
            }
            if (request.getDescription() != null) {
                role.setDescription(request.getDescription());
            }
            if (request.getPermissions() != null) {
                role.setPermissions(request.getPermissions());
            }
        }

        role = roleRepository.save(role);
        log.info("Rôle mis à jour: {} ({})", role.getName(), role.getId());
        return mapToResponse(role);
    }

    @Transactional
    public void delete(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable avec l'ID: " + id));

        if (role.getIsSystem()) {
            throw new RuntimeException("Impossible de supprimer un rôle système");
        }

        long usersCount = userRepository.countByRoleId(id);
        if (usersCount > 0) {
            throw new RuntimeException("Impossible de supprimer ce rôle, il est assigné à " + usersCount + " utilisateur(s)");
        }

        roleRepository.delete(role);
        log.info("Rôle supprimé: {} ({})", role.getName(), id);
    }

    @Transactional
    public RoleResponse updatePermissions(UUID id, Map<String, Object> permissions) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable avec l'ID: " + id));

        role.setPermissions(permissions);
        role = roleRepository.save(role);
        log.info("Permissions mises à jour pour le rôle: {} ({})", role.getName(), role.getId());
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse duplicateRole(UUID id, String newName) {
        Role source = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable avec l'ID: " + id));

        String upperName = newName.toUpperCase();
        if (roleRepository.existsByName(upperName)) {
            throw new RuntimeException("Un rôle avec le nom '" + newName + "' existe déjà");
        }

        // Deep copy permissions
        Map<String, Object> copiedPermissions = new HashMap<>();
        if (source.getPermissions() != null) {
            for (Map.Entry<String, Object> entry : source.getPermissions().entrySet()) {
                if (entry.getValue() instanceof Map) {
                    copiedPermissions.put(entry.getKey(), new HashMap<>((Map<?, ?>) entry.getValue()));
                } else {
                    copiedPermissions.put(entry.getKey(), entry.getValue());
                }
            }
        }

        Role duplicate = Role.builder()
                .name(upperName)
                .description("Copie de " + source.getName() + " - " + (source.getDescription() != null ? source.getDescription() : ""))
                .permissions(copiedPermissions)
                .isSystem(false)
                .build();

        duplicate = roleRepository.save(duplicate);
        log.info("Rôle dupliqué: {} -> {} ({})", source.getName(), duplicate.getName(), duplicate.getId());
        return mapToResponse(duplicate);
    }

    private RoleResponse mapToResponse(Role role) {
        long usersCount = userRepository.countByRoleId(role.getId());

        return RoleResponse.builder()
                .id(role.getId().toString())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getPermissions() != null ? role.getPermissions() : Map.of())
                .isSystem(role.getIsSystem())
                .usersCount(usersCount)
                .createdAt(role.getCreatedAt() != null ? role.getCreatedAt().toString() : null)
                .build();
    }
}
