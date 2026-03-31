package com.opticrm.communication.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.communication.dto.NotificationDto;
import com.opticrm.communication.entity.Notification;
import com.opticrm.communication.repository.NotificationRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    /** Récupérer les notifications de l'utilisateur connecté */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(int page, int size) {
        UUID userId = ContextUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Utilisateur non authentifié"));
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    /** Nombre de notifications non lues */
    @Transactional(readOnly = true)
    public long countUnread() {
        UUID userId = ContextUtils.getCurrentUserId().orElse(null);
        if (userId == null) return 0;
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /** Marquer une notification comme lue */
    @Transactional
    public NotificationDto markAsRead(UUID id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        n.setIsRead(true);
        return toDto(notificationRepository.save(n));
    }

    /** Marquer toutes les notifications de l'utilisateur comme lues */
    @Transactional
    public void markAllAsRead() {
        UUID userId = ContextUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Utilisateur non authentifié"));
        notificationRepository.markAllAsReadByUserId(userId);
    }

    /** Supprimer une notification */
    @Transactional
    public void delete(UUID id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification", id);
        }
        notificationRepository.deleteById(id);
    }

    /** Créer une notification pour un utilisateur (usage interne/services) */
    @Transactional
    public NotificationDto create(UUID userId, String type, String title, String message, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(n);

        // Notification push temps réel
        try {
            pushNotificationService.sendToUser(userId, title, message, link);
        } catch (Exception e) {
            log.warn("Échec envoi push pour notification {}: {}", n.getId(), e.getMessage());
        }

        return toDto(n);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId().toString())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
