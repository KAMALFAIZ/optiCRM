package com.opticrm.security.service;

import com.opticrm.common.exception.BusinessException;
import com.opticrm.common.exception.UnauthorizedException;
import com.opticrm.security.dto.*;
import com.opticrm.security.entity.PasswordResetToken;
import com.opticrm.security.entity.RefreshToken;
import com.opticrm.security.entity.User;
import com.opticrm.security.jwt.JwtService;
import com.opticrm.security.repository.PasswordResetTokenRepository;
import com.opticrm.security.repository.RefreshTokenRepository;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    private static final long EXTENDED_REFRESH_TOKEN_DURATION = 30L * 24 * 60 * 60 * 1000; // 30 days
    private static final Duration RESET_TOKEN_EXPIRY = Duration.ofHours(1);

    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Check if account is locked
        if (user.isLocked()) {
            throw new BusinessException("AUTH_ACCOUNT_LOCKED",
                    "Account is temporarily locked. Please try again later.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Reset failed attempts on successful login
            user.resetFailedAttempts();
            user.setLastLoginAt(Instant.now());
            userRepository.save(user);

            // Generate tokens
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = createRefreshToken(user, request.isRememberMe(), ipAddress, userAgent);

            return buildLoginResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            handleFailedLogin(user);
            throw e;
        }
    }

    @Transactional
    public TokenResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!storedToken.isValid()) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        User user = storedToken.getUser();

        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is inactive");
        }

        // Revoke old refresh token
        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        // Generate new tokens
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = createRefreshToken(user, false,
                storedToken.getIpAddress(), storedToken.getUserAgent());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getRefreshTokenExpirationMs() / 1000)
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional
    public void logoutAll(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return mapToUserResponse(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Always succeed silently — don't reveal if email exists
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Invalidate any existing reset tokens for this user
            passwordResetTokenRepository.invalidateAllForUser(user.getId(), Instant.now());

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(UUID.randomUUID().toString())
                    .user(user)
                    .expiresAt(Instant.now().plus(RESET_TOKEN_EXPIRY))
                    .build();

            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
            log.info("Demande de réinitialisation de mot de passe pour : {}", user.getEmail());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("INVALID_TOKEN", "Lien de réinitialisation invalide ou expiré."));

        if (!resetToken.isValid()) {
            throw new BusinessException("EXPIRED_TOKEN", "Ce lien de réinitialisation a expiré ou a déjà été utilisé.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.resetFailedAttempts();
        userRepository.save(user);

        // Invalidate the used token
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        // Revoke all active sessions for security
        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        log.info("Mot de passe réinitialisé pour : {}", user.getEmail());
    }

    private String createRefreshToken(User user, boolean extendedDuration, String ipAddress, String userAgent) {
        long duration = extendedDuration ? EXTENDED_REFRESH_TOKEN_DURATION : jwtService.getRefreshTokenExpirationMs();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusMillis(duration))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    private void handleFailedLogin(User user) {
        user.incrementFailedAttempts();

        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plus(LOCK_DURATION));
            log.warn("User account locked due to too many failed attempts: {}", user.getEmail());
        }

        userRepository.save(user);
    }

    private LoginResponse buildLoginResponse(User user, String accessToken, String refreshToken) {
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getRefreshTokenExpirationMs() / 1000)
                .user(LoginResponse.UserDto.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .avatarUrl(user.getAvatarUrl())
                        .role(user.getRole() != null ? user.getRole().getName() : null)
                        .teamId(user.getTeam() != null ? user.getTeam().getId().toString() : null)
                        .territoryId(user.getTerritory() != null ? user.getTerritory().getId().toString() : null)
                        .build())
                .build();
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
