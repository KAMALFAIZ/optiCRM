package com.opticrm.security.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.dto.*;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        LoginResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        TokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest request
    ) {
        if (request != null && request.getRefreshToken() != null) {
            authService.logout(request.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        authService.logoutAll(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        UserResponse response = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request);
        // Always return success — don't reveal if email exists
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/set-initial-password")
    public ResponseEntity<ApiResponse<Void>> setInitialPassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SetInitialPasswordRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        authService.setInitialPassword(principal.getId(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Temporary diagnostic endpoint — remove after debugging login issue.
     * Tests BCrypt password matching directly, bypassing Spring Security chain.
     */
    @PostMapping("/debug-login")
    public ResponseEntity<java.util.Map<String, Object>> debugLogin(@RequestBody LoginRequest request) {
        var result = new java.util.LinkedHashMap<String, Object>();
        result.put("email", request.getEmail());

        var userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            result.put("userFound", false);
            return ResponseEntity.ok(result);
        }

        var user = userOpt.get();
        result.put("userFound", true);
        result.put("isActive", user.getIsActive());
        result.put("isLocked", user.isLocked());
        result.put("failedAttempts", user.getFailedLoginAttempts());
        result.put("hashLength", user.getPasswordHash() != null ? user.getPasswordHash().length() : null);
        result.put("hashPrefix", user.getPasswordHash() != null ? user.getPasswordHash().substring(0, Math.min(29, user.getPasswordHash().length())) : null);

        result.put("passwordMatches", passwordEncoder.matches(request.getPassword(), user.getPasswordHash()));

        // Check for invisible characters in hash
        String hash = user.getPasswordHash();
        if (hash != null) {
            result.put("hashHasNonAscii", !hash.matches("\\A[\\x20-\\x7E]*\\z"));
            result.put("hashTrimmedLength", hash.trim().length());
        }

        return ResponseEntity.ok(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
