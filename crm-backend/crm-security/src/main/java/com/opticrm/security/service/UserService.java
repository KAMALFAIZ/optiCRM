package com.opticrm.security.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.security.dto.*;
import com.opticrm.security.entity.Role;
import com.opticrm.security.entity.Team;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.PasswordResetTokenRepository;
import com.opticrm.security.repository.RefreshTokenRepository;
import com.opticrm.security.repository.RoleRepository;
import com.opticrm.security.repository.UserActivityRepository;
import com.opticrm.security.repository.TeamRepository;
import com.opticrm.security.repository.TerritoryRepository;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final TerritoryRepository territoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserActivityService activityService;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserActivityRepository userActivityRepository;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    // ---- Statistics ----

    @Transactional(readOnly = true)
    public UserStatsDto getStats() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (Object[] row : userRepository.countByRoleGrouped()) {
            usersByRole.put((String) row[0], ((Number) row[1]).longValue());
        }

        return UserStatsDto.builder()
                .totalUsers(userRepository.countAll())
                .activeUsers(userRepository.countActive())
                .inactiveUsers(userRepository.countInactive())
                .lockedUsers(userRepository.countLocked())
                .recentLogins(userRepository.countRecentLogins())
                .usersByRole(usersByRole)
                .build();
    }

    // ---- List ----

    @Transactional(readOnly = true)
    public Page<UserResponse> list(PageRequest pageRequest, String search, UUID roleId, Boolean isActive) {
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : "";
        // Map JPA field names to native SQL column names for native query
        String sortBy = mapToColumnName(pageRequest.getSortBy() != null ? pageRequest.getSortBy() : "createdAt");
        PageRequest nativePageRequest = PageRequest.builder()
                .page(pageRequest.getPage())
                .perPage(pageRequest.getPerPage())
                .sortBy(sortBy)
                .sortDirection(pageRequest.getSortDirection())
                .build();
        Page<User> page = userRepository.findAllFiltered(searchTerm, roleId, isActive, nativePageRequest.toPageable());
        return page.map(this::mapToUserResponse);
    }

    private String mapToColumnName(String fieldName) {
        return switch (fieldName) {
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            case "firstName" -> "first_name";
            case "lastName" -> "last_name";
            case "isActive" -> "is_active";
            case "lastLoginAt" -> "last_login_at";
            case "preferredLanguage" -> "preferred_language";
            case "passwordChangedAt" -> "password_changed_at";
            default -> fieldName;
        };
    }

    // ---- CRUD ----

    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEntryException("email", request.getEmail());
        }

        // Resolve role
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Rôle non trouvé : " + request.getRoleId()));

        // Capture plain-text password before hashing (needed for welcome email)
        String plainPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : generateRandomPassword();

        // Build user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(plainPassword))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(role)
                .preferredLanguage(request.getPreferredLanguage())
                .timezone(request.getTimezone())
                .isActive(true)
                .build();

        // Optional team
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Équipe non trouvée : " + request.getTeamId()));
            user.setTeam(team);
        }

        // Optional territory
        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territoire non trouvé : " + request.getTerritoryId()));
            user.setTerritory(territory);
        }

        User saved = userRepository.save(user);
        log.info("User created: {} ({})", saved.getEmail(), saved.getId());
        activityService.log(saved.getId(), "USER_CREATED", "Utilisateur créé : " + saved.getEmail());

        // Envoi asynchrone de l'email de bienvenue avec les identifiants
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getFirstName(), plainPassword);

        return mapToUserResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        String email = user.getEmail();
        // Supprimer les enregistrements liés avant de supprimer l'utilisateur (contraintes FK)
        userActivityRepository.deleteByUserId(id);
        refreshTokenRepository.revokeAllByUserId(id, Instant.now());
        refreshTokenRepository.deleteExpiredAndRevoked(Instant.now());
        passwordResetTokenRepository.invalidateAllForUser(id, Instant.now());
        passwordResetTokenRepository.deleteExpiredAndUsed(Instant.now());
        userRepository.delete(user);
        log.info("User deleted: {} ({})", email, id);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateEntryException("email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getPreferredLanguage() != null) user.setPreferredLanguage(request.getPreferredLanguage());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());

        // Update role
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rôle non trouvé : " + request.getRoleId()));
            user.setRole(role);
        }

        // Update team
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Équipe non trouvée : " + request.getTeamId()));
            user.setTeam(team);
        }

        // Update territory
        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territoire non trouvé : " + request.getTerritoryId()));
            user.setTerritory(territory);
        }

        User saved = userRepository.save(user);
        log.info("User updated: {} ({})", saved.getEmail(), saved.getId());
        activityService.log(saved.getId(), "USER_UPDATED", "Utilisateur modifié");
        return mapToUserResponse(saved);
    }

    @Transactional
    public void activate(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {} ({})", user.getEmail(), user.getId());
        activityService.log(id, "USER_ACTIVATED", "Utilisateur activé");
    }

    @Transactional
    public void deactivate(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {} ({})", user.getEmail(), user.getId());
        activityService.log(id, "USER_DEACTIVATED", "Utilisateur désactivé");
    }

    @Transactional
    public void changePassword(UUID id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);
        log.info("Password changed for user: {} ({})", user.getEmail(), user.getId());
        activityService.log(id, "PASSWORD_CHANGED", "Mot de passe modifié");
    }

    @Transactional
    public void unlockUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        user.resetFailedAttempts();
        userRepository.save(user);
        log.info("User unlocked: {} ({})", user.getEmail(), user.getId());
        activityService.log(id, "USER_UNLOCKED", "Utilisateur déverrouillé");
    }

    // ---- Batch operations ----

    @Transactional
    public int batchActivate(List<UUID> ids) {
        List<User> users = userRepository.findAllByIdIn(ids);
        users.forEach(u -> {
            u.setIsActive(true);
            activityService.log(u.getId(), "USER_ACTIVATED", "Activation en masse");
        });
        userRepository.saveAll(users);
        log.info("Batch activated {} users", users.size());
        return users.size();
    }

    @Transactional
    public int batchDeactivate(List<UUID> ids) {
        List<User> users = userRepository.findAllByIdIn(ids);
        users.forEach(u -> {
            u.setIsActive(false);
            activityService.log(u.getId(), "USER_DEACTIVATED", "Désactivation en masse");
        });
        userRepository.saveAll(users);
        log.info("Batch deactivated {} users", users.size());
        return users.size();
    }

    // ---- Avatar ----

    @Transactional
    public UserResponse updateAvatar(UUID id, String avatarUrl) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + id));
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);
        log.info("Avatar updated for user: {} ({})", saved.getEmail(), saved.getId());
        activityService.log(id, "AVATAR_UPDATED", "Avatar mis à jour");
        return mapToUserResponse(saved);
    }

    // ---- Helpers ----

    private String generateRandomPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .lastLoginAt(user.getLastLoginAt())
                .preferredLanguage(user.getPreferredLanguage())
                .timezone(user.getTimezone())
                .createdAt(user.getCreatedAt());

        if (user.getRole() != null) {
            builder.role(UserResponse.RoleInfo.builder()
                    .id(user.getRole().getId().toString())
                    .name(user.getRole().getName())
                    .description(user.getRole().getDescription())
                    .permissions(user.getRole().getPermissions())
                    .build());
        }

        if (user.getTeam() != null) {
            builder.team(UserResponse.TeamInfo.builder()
                    .id(user.getTeam().getId().toString())
                    .name(user.getTeam().getName())
                    .build());
        }

        if (user.getTerritory() != null) {
            builder.territory(UserResponse.TerritoryInfo.builder()
                    .id(user.getTerritory().getId().toString())
                    .name(user.getTerritory().getName())
                    .region(user.getTerritory().getRegion())
                    .build());
        }

        return builder.build();
    }
}
