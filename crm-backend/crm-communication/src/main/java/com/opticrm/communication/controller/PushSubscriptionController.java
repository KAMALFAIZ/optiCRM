package com.opticrm.communication.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.communication.dto.PushSubscriptionRequest;
import com.opticrm.communication.entity.PushSubscription;
import com.opticrm.communication.repository.PushSubscriptionRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    @PostMapping("/subscribe")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        UUID userId = ContextUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Utilisateur non authentifié"));

        // Éviter les doublons
        if (pushSubscriptionRepository.existsByUserIdAndEndpoint(userId, request.getEndpoint())) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        PushSubscription sub = PushSubscription.builder()
                .user(user)
                .endpoint(request.getEndpoint())
                .p256dhKey(request.getP256dhKey())
                .authKey(request.getAuthKey())
                .build();

        pushSubscriptionRepository.save(sub);
        log.info("Push subscription enregistrée pour user {}", userId);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> unsubscribe(@RequestParam String endpoint) {
        UUID userId = ContextUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Utilisateur non authentifié"));

        pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
        log.info("Push subscription supprimée pour user {}", userId);

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
