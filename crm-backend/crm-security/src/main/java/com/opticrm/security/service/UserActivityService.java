package com.opticrm.security.service;

import com.opticrm.security.dto.UserActivityDto;
import com.opticrm.security.entity.UserActivity;
import com.opticrm.security.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserActivityRepository activityRepository;

    @Transactional
    public void log(UUID userId, String action, String details) {
        UserActivity activity = UserActivity.builder()
                .userId(userId)
                .action(action)
                .details(details)
                .build();
        activityRepository.save(activity);
        log.debug("Activity logged: {} for user {}", action, userId);
    }

    @Transactional(readOnly = true)
    public Page<UserActivityDto> getActivities(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        return activityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    private UserActivityDto toDto(UserActivity activity) {
        return UserActivityDto.builder()
                .id(activity.getId().toString())
                .userId(activity.getUserId().toString())
                .action(activity.getAction())
                .details(activity.getDetails())
                .performedBy(activity.getPerformedBy() != null ? activity.getPerformedBy().toString() : null)
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
