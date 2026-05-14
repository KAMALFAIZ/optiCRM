package com.opticrm.core.activity.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.activity.dto.*;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.core.activity.entity.Activity;
import com.opticrm.core.activity.repository.ActivityRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ActivityDto getById(UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", id));
        return mapToDto(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityListDto> list(PageRequest pageRequest, String search, String status,
                                      String activityType, String assignedToId) {
        Page<Activity> activities;

        // COMMERCIAL ne voit que ses propres activités
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return activityRepository.findByAssignedToId(currentUserId,
                        pageRequest.toPageable("startDate", Sort.Direction.DESC))
                        .map(this::mapToListDto);
            }
        }

        if (search != null && !search.isBlank()) {
            activities = activityRepository.search(search.trim(),
                    pageRequest.toPageable("startDate", Sort.Direction.DESC));
        } else if (status != null && !status.isBlank()) {
            activities = activityRepository.findByStatus(status,
                    pageRequest.toPageable("startDate", Sort.Direction.DESC));
        } else if (activityType != null && !activityType.isBlank()) {
            activities = activityRepository.findByActivityType(activityType,
                    pageRequest.toPageable("startDate", Sort.Direction.DESC));
        } else if (assignedToId != null && !assignedToId.isBlank()) {
            activities = activityRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("startDate", Sort.Direction.DESC));
        } else {
            activities = activityRepository.findAll(
                    pageRequest.toPageable("startDate", Sort.Direction.DESC));
        }

        return activities.map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public List<ActivityListDto> getCalendarEvents(Instant from, Instant to, String assignedToId) {
        List<Activity> activities;

        // COMMERCIAL ne voit que son propre calendrier
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return activityRepository.findByAssignedToAndDateRange(currentUserId, from, to)
                        .stream().map(this::mapToListDto).collect(Collectors.toList());
            }
        }

        if (assignedToId != null && !assignedToId.isBlank()) {
            activities = activityRepository.findByAssignedToAndDateRange(
                    UUID.fromString(assignedToId), from, to);
        } else {
            activities = activityRepository.findByDateRange(from, to);
        }
        return activities.stream().map(this::mapToListDto).collect(Collectors.toList());
    }

    @Transactional
    public ActivityDto create(CreateActivityRequest request) {
        Activity activity = Activity.builder()
                .activityType(request.getActivityType())
                .subject(request.getSubject())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .dueDate(request.getDueDate())
                .duration(request.getDuration())
                .location(request.getLocation())
                .locationType(request.getLocationType())
                .status(request.getStatus() != null ? request.getStatus() : "planned")
                .priority(request.getPriority() != null ? request.getPriority() : "normal")
                .relatedToType(request.getRelatedToType())
                .relatedToId(request.getRelatedToId() != null ? UUID.fromString(request.getRelatedToId()) : null)
                .callDirection(request.getCallDirection())
                .callResult(request.getCallResult())
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurrenceRule(request.getRecurrenceRule())
                .reminderAt(request.getReminderAt())
                .objective(request.getObjective())
                .result(request.getResult())
                .productsDiscussed(request.getProductsDiscussed())
                .estimatedRevenue(request.getEstimatedRevenue())
                .expenses(request.getExpenses())
                .transportMode(request.getTransportMode())
                .mileage(request.getMileage())
                .followUpDate(request.getFollowUpDate())
                .build();

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            activity.setAssignedTo(assignedTo);
        }

        activity = activityRepository.save(activity);
        log.info("Created activity: {}", activity.getSubject());
        return mapToDto(activity);
    }

    @Transactional
    public ActivityDto update(UUID id, UpdateActivityRequest request) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", id));

        if (request.getActivityType() != null) activity.setActivityType(request.getActivityType());
        if (request.getSubject() != null) activity.setSubject(request.getSubject());
        if (request.getDescription() != null) activity.setDescription(request.getDescription());
        if (request.getStartDate() != null) activity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) activity.setEndDate(request.getEndDate());
        if (request.getDueDate() != null) activity.setDueDate(request.getDueDate());
        if (request.getDuration() != null) activity.setDuration(request.getDuration());
        if (request.getLocation() != null) activity.setLocation(request.getLocation());
        if (request.getLocationType() != null) activity.setLocationType(request.getLocationType());
        if (request.getStatus() != null) activity.setStatus(request.getStatus());
        if (request.getPriority() != null) activity.setPriority(request.getPriority());
        if (request.getRelatedToType() != null) activity.setRelatedToType(request.getRelatedToType());
        if (request.getRelatedToId() != null) activity.setRelatedToId(UUID.fromString(request.getRelatedToId()));
        if (request.getCallDirection() != null) activity.setCallDirection(request.getCallDirection());
        if (request.getCallResult() != null) activity.setCallResult(request.getCallResult());
        if (request.getIsRecurring() != null) activity.setIsRecurring(request.getIsRecurring());
        if (request.getRecurrenceRule() != null) activity.setRecurrenceRule(request.getRecurrenceRule());
        if (request.getReminderAt() != null) activity.setReminderAt(request.getReminderAt());
        if (request.getObjective() != null) activity.setObjective(request.getObjective());
        if (request.getResult() != null) activity.setResult(request.getResult());
        if (request.getProductsDiscussed() != null) activity.setProductsDiscussed(request.getProductsDiscussed());
        if (request.getEstimatedRevenue() != null) activity.setEstimatedRevenue(request.getEstimatedRevenue());
        if (request.getExpenses() != null) activity.setExpenses(request.getExpenses());
        if (request.getTransportMode() != null) activity.setTransportMode(request.getTransportMode());
        if (request.getMileage() != null) activity.setMileage(request.getMileage());
        if (request.getFollowUpDate() != null) activity.setFollowUpDate(request.getFollowUpDate());

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            activity.setAssignedTo(assignedTo);
        }

        activity = activityRepository.save(activity);
        log.info("Updated activity: {}", id);
        return mapToDto(activity);
    }

    @Transactional
    public void delete(UUID id) {
        if (!activityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Activity", id);
        }
        activityRepository.deleteById(id);
        log.info("Deleted activity: {}", id);
    }

    @Transactional
    public ActivityDto complete(UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", id));
        activity.setStatus("completed");
        activity.setCompletedAt(Instant.now());
        activity = activityRepository.save(activity);
        log.info("Completed activity: {}", id);
        return mapToDto(activity);
    }

    private ActivityDto mapToDto(Activity activity) {
        ActivityDto.ActivityDtoBuilder builder = ActivityDto.builder()
                .id(activity.getId().toString())
                .activityType(activity.getActivityType())
                .subject(activity.getSubject())
                .description(activity.getDescription())
                .startDate(activity.getStartDate())
                .endDate(activity.getEndDate())
                .dueDate(activity.getDueDate())
                .completedAt(activity.getCompletedAt())
                .duration(activity.getDuration())
                .location(activity.getLocation())
                .locationType(activity.getLocationType())
                .status(activity.getStatus())
                .priority(activity.getPriority())
                .relatedToType(activity.getRelatedToType())
                .relatedToId(activity.getRelatedToId() != null ? activity.getRelatedToId().toString() : null)
                .callDirection(activity.getCallDirection())
                .callResult(activity.getCallResult())
                .isRecurring(activity.getIsRecurring())
                .recurrenceRule(activity.getRecurrenceRule())
                .reminderAt(activity.getReminderAt())
                .objective(activity.getObjective())
                .result(activity.getResult())
                .productsDiscussed(activity.getProductsDiscussed())
                .estimatedRevenue(activity.getEstimatedRevenue())
                .expenses(activity.getExpenses())
                .transportMode(activity.getTransportMode())
                .mileage(activity.getMileage())
                .followUpDate(activity.getFollowUpDate())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt());

        if (activity.getAssignedTo() != null) {
            builder.assignedTo(ActivityDto.UserSummary.builder()
                    .id(activity.getAssignedTo().getId().toString())
                    .fullName(activity.getAssignedTo().getFullName())
                    .email(activity.getAssignedTo().getEmail())
                    .build());
        }

        return builder.build();
    }

    private ActivityListDto mapToListDto(Activity activity) {
        return ActivityListDto.builder()
                .id(activity.getId().toString())
                .activityType(activity.getActivityType())
                .subject(activity.getSubject())
                .startDate(activity.getStartDate())
                .endDate(activity.getEndDate())
                .dueDate(activity.getDueDate())
                .status(activity.getStatus())
                .priority(activity.getPriority())
                .location(activity.getLocation())
                .assignedToName(activity.getAssignedTo() != null ? activity.getAssignedTo().getFullName() : null)
                .relatedToType(activity.getRelatedToType())
                .relatedToId(activity.getRelatedToId() != null ? activity.getRelatedToId().toString() : null)
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
