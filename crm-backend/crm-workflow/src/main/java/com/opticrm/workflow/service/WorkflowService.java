package com.opticrm.workflow.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.workflow.dto.*;
import com.opticrm.workflow.entity.*;
import com.opticrm.workflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final WorkflowExecutionLogRepository executionLogRepository;
    private final UserRepository userRepository;

    // ── List ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<WorkflowListDto> list(PageRequest pageRequest, String search, String entityType, Boolean isActive) {
        Sort sort = Sort.by(
                pageRequest.getSortDirection().equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                pageRequest.getSortBy() != null ? pageRequest.getSortBy() : "createdAt"
        );
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPage() - 1,
                pageRequest.getPerPage(),
                sort
        );
        return workflowRepository.findAllWithFilters(search, entityType, isActive, pageable)
                .map(this::mapToListDto);
    }

    // ── Get by ID ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkflowDto getById(UUID id) {
        Workflow wf = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
        return mapToDto(wf);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public WorkflowDto create(CreateWorkflowRequest request) {
        Workflow wf = Workflow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .entityType(request.getEntityType())
                .triggerType(request.getTriggerType())
                .triggerConfig(request.getTriggerConfig())
                .isActive(false)
                .version(1)
                .build();

        workflowRepository.save(wf);

        // Create steps
        List<WorkflowStep> savedSteps = new ArrayList<>();
        if (request.getSteps() != null) {
            for (int i = 0; i < request.getSteps().size(); i++) {
                CreateWorkflowRequest.StepRequest sr = request.getSteps().get(i);
                WorkflowStep step = WorkflowStep.builder()
                        .workflow(wf)
                        .name(sr.getName())
                        .stepType(sr.getStepType())
                        .actionConfig(sr.getActionConfig())
                        .stepOrder(sr.getStepOrder() != null ? sr.getStepOrder() : i)
                        .positionX(sr.getPositionX() != null ? sr.getPositionX() : 0)
                        .positionY(sr.getPositionY() != null ? sr.getPositionY() : 0)
                        .isEntryPoint(sr.getIsEntryPoint() != null ? sr.getIsEntryPoint() : (i == 0))
                        .build();
                savedSteps.add(stepRepository.save(step));
            }
        }

        // Create transitions
        if (request.getTransitions() != null) {
            for (CreateWorkflowRequest.TransitionRequest tr : request.getTransitions()) {
                WorkflowStep fromStep = resolveStep(tr.getFromStepIndex(), tr.getFromStepId(), savedSteps);
                WorkflowStep toStep = resolveStep(tr.getToStepIndex(), tr.getToStepId(), savedSteps);
                if (fromStep != null && toStep != null) {
                    WorkflowTransition transition = WorkflowTransition.builder()
                            .workflow(wf)
                            .fromStep(fromStep)
                            .toStep(toStep)
                            .label(tr.getLabel())
                            .conditionExpression(tr.getConditionExpression())
                            .evalOrder(tr.getEvalOrder() != null ? tr.getEvalOrder() : 0)
                            .build();
                    transitionRepository.save(transition);
                }
            }
        }

        log.info("Workflow created: {} ({})", wf.getName(), wf.getId());
        return getById(wf.getId());
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public WorkflowDto update(UUID id, UpdateWorkflowRequest request) {
        Workflow wf = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        if (request.getName() != null) wf.setName(request.getName());
        if (request.getDescription() != null) wf.setDescription(request.getDescription());
        if (request.getEntityType() != null) wf.setEntityType(request.getEntityType());
        if (request.getTriggerType() != null) wf.setTriggerType(request.getTriggerType());
        if (request.getTriggerConfig() != null) wf.setTriggerConfig(request.getTriggerConfig());
        if (request.getIsActive() != null) wf.setIsActive(request.getIsActive());

        // If steps are provided, replace all steps and transitions
        if (request.getSteps() != null) {
            // Remove existing
            transitionRepository.deleteAll(transitionRepository.findByWorkflowId(id));
            stepRepository.deleteAll(stepRepository.findByWorkflowIdOrderByStepOrderAsc(id));

            // Create new steps
            List<WorkflowStep> savedSteps = new ArrayList<>();
            for (int i = 0; i < request.getSteps().size(); i++) {
                CreateWorkflowRequest.StepRequest sr = request.getSteps().get(i);
                WorkflowStep step = WorkflowStep.builder()
                        .workflow(wf)
                        .name(sr.getName())
                        .stepType(sr.getStepType())
                        .actionConfig(sr.getActionConfig())
                        .stepOrder(sr.getStepOrder() != null ? sr.getStepOrder() : i)
                        .positionX(sr.getPositionX() != null ? sr.getPositionX() : 0)
                        .positionY(sr.getPositionY() != null ? sr.getPositionY() : 0)
                        .isEntryPoint(sr.getIsEntryPoint() != null ? sr.getIsEntryPoint() : (i == 0))
                        .build();
                savedSteps.add(stepRepository.save(step));
            }

            // Create new transitions
            if (request.getTransitions() != null) {
                for (CreateWorkflowRequest.TransitionRequest tr : request.getTransitions()) {
                    WorkflowStep fromStep = resolveStep(tr.getFromStepIndex(), tr.getFromStepId(), savedSteps);
                    WorkflowStep toStep = resolveStep(tr.getToStepIndex(), tr.getToStepId(), savedSteps);
                    if (fromStep != null && toStep != null) {
                        WorkflowTransition transition = WorkflowTransition.builder()
                                .workflow(wf)
                                .fromStep(fromStep)
                                .toStep(toStep)
                                .label(tr.getLabel())
                                .conditionExpression(tr.getConditionExpression())
                                .evalOrder(tr.getEvalOrder() != null ? tr.getEvalOrder() : 0)
                                .build();
                        transitionRepository.save(transition);
                    }
                }
            }

            wf.setVersion(wf.getVersion() + 1);
        }

        workflowRepository.save(wf);
        log.info("Workflow updated: {} ({})", wf.getName(), wf.getId());
        return getById(wf.getId());
    }

    // ── Toggle active ────────────────────────────────────────────────────────

    @Transactional
    public WorkflowDto toggleActive(UUID id) {
        Workflow wf = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
        wf.setIsActive(!wf.getIsActive());
        workflowRepository.save(wf);
        log.info("Workflow {} {}", wf.getName(), wf.getIsActive() ? "activated" : "deactivated");
        return mapToDto(wf);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        Workflow wf = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
        workflowRepository.delete(wf);
        log.info("Workflow deleted: {} ({})", wf.getName(), id);
    }

    // ── Executions ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<WorkflowExecutionDto> listExecutions(PageRequest pageRequest, UUID workflowId, String status, String entityType) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPage() - 1,
                pageRequest.getPerPage(),
                Sort.by(Sort.Direction.DESC, "startedAt")
        );
        return executionRepository.findAllWithFilters(workflowId, status, entityType, pageable)
                .map(this::mapExecutionToDto);
    }

    @Transactional(readOnly = true)
    public WorkflowExecutionDto getExecutionById(UUID id) {
        WorkflowExecution exec = executionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found with id: " + id));
        WorkflowExecutionDto dto = mapExecutionToDto(exec);
        // Include logs for detail view
        dto.setLogs(executionLogRepository.findByExecutionIdOrderByExecutedAtAsc(id).stream()
                .map(this::mapLogToDto)
                .collect(Collectors.toList()));
        return dto;
    }

    // ── Cancel execution ─────────────────────────────────────────────────────

    @Transactional
    public WorkflowExecutionDto cancelExecution(UUID executionId) {
        WorkflowExecution exec = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found with id: " + executionId));
        if ("RUNNING".equals(exec.getStatus()) || "PAUSED".equals(exec.getStatus())) {
            exec.setStatus("CANCELLED");
            exec.setCompletedAt(java.time.Instant.now());
            executionRepository.save(exec);
            log.info("Execution {} cancelled", executionId);
        }
        return mapExecutionToDto(exec);
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkflowStatsDto getStats() {
        return WorkflowStatsDto.builder()
                .totalWorkflows(workflowRepository.count())
                .activeWorkflows(workflowRepository.countByIsActiveTrue())
                .totalExecutions(executionRepository.count())
                .runningExecutions(executionRepository.findAllWithFilters(null, "RUNNING", null,
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .completedExecutions(executionRepository.findAllWithFilters(null, "COMPLETED", null,
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .failedExecutions(executionRepository.findAllWithFilters(null, "FAILED", null,
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .pausedExecutions(executionRepository.findAllWithFilters(null, "PAUSED", null,
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .build();
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private WorkflowDto mapToDto(Workflow wf) {
        WorkflowDto.WorkflowDtoBuilder builder = WorkflowDto.builder()
                .id(wf.getId().toString())
                .name(wf.getName())
                .description(wf.getDescription())
                .entityType(wf.getEntityType())
                .triggerType(wf.getTriggerType())
                .triggerConfig(wf.getTriggerConfig())
                .isActive(wf.getIsActive())
                .version(wf.getVersion())
                .createdAt(wf.getCreatedAt())
                .updatedAt(wf.getUpdatedAt())
                .totalExecutions(executionRepository.countByWorkflowId(wf.getId()))
                .activeExecutions(executionRepository.countByWorkflowIdAndStatus(wf.getId(), "RUNNING"));

        // Steps
        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(wf.getId());
        builder.steps(steps.stream().map(this::mapStepToDto).collect(Collectors.toList()));

        // Transitions
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowId(wf.getId());
        builder.transitions(transitions.stream().map(this::mapTransitionToDto).collect(Collectors.toList()));

        // Created by
        if (wf.getCreatedBy() != null) {
            User u = wf.getCreatedBy();
            builder.createdBy(WorkflowDto.UserInfo.builder()
                    .id(u.getId().toString())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .build());
        }

        return builder.build();
    }

    private WorkflowListDto mapToListDto(Workflow wf) {
        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(wf.getId());
        String createdByName = null;
        if (wf.getCreatedBy() != null) {
            createdByName = wf.getCreatedBy().getFirstName() + " " + wf.getCreatedBy().getLastName();
        }
        return WorkflowListDto.builder()
                .id(wf.getId().toString())
                .name(wf.getName())
                .entityType(wf.getEntityType())
                .triggerType(wf.getTriggerType())
                .isActive(wf.getIsActive())
                .version(wf.getVersion())
                .stepCount(steps.size())
                .totalExecutions(executionRepository.countByWorkflowId(wf.getId()))
                .activeExecutions(executionRepository.countByWorkflowIdAndStatus(wf.getId(), "RUNNING"))
                .createdByName(createdByName)
                .createdAt(wf.getCreatedAt())
                .updatedAt(wf.getUpdatedAt())
                .build();
    }

    private WorkflowStepDto mapStepToDto(WorkflowStep step) {
        return WorkflowStepDto.builder()
                .id(step.getId().toString())
                .name(step.getName())
                .stepType(step.getStepType())
                .actionConfig(step.getActionConfig())
                .stepOrder(step.getStepOrder())
                .positionX(step.getPositionX())
                .positionY(step.getPositionY())
                .isEntryPoint(step.getIsEntryPoint())
                .build();
    }

    private WorkflowTransitionDto mapTransitionToDto(WorkflowTransition t) {
        return WorkflowTransitionDto.builder()
                .id(t.getId().toString())
                .fromStepId(t.getFromStep().getId().toString())
                .toStepId(t.getToStep().getId().toString())
                .label(t.getLabel())
                .conditionExpression(t.getConditionExpression())
                .evalOrder(t.getEvalOrder())
                .build();
    }

    private WorkflowExecutionDto mapExecutionToDto(WorkflowExecution exec) {
        return WorkflowExecutionDto.builder()
                .id(exec.getId().toString())
                .workflowId(exec.getWorkflow().getId().toString())
                .workflowName(exec.getWorkflow().getName())
                .entityType(exec.getEntityType())
                .entityId(exec.getEntityId().toString())
                .status(exec.getStatus())
                .currentStepId(exec.getCurrentStep() != null ? exec.getCurrentStep().getId().toString() : null)
                .currentStepName(exec.getCurrentStep() != null ? exec.getCurrentStep().getName() : null)
                .resumeAt(exec.getResumeAt())
                .errorMessage(exec.getErrorMessage())
                .triggeredById(exec.getTriggeredById() != null ? exec.getTriggeredById().toString() : null)
                .startedAt(exec.getStartedAt())
                .completedAt(exec.getCompletedAt())
                .build();
    }

    private WorkflowExecutionDto.ExecutionLogDto mapLogToDto(WorkflowExecutionLog log) {
        return WorkflowExecutionDto.ExecutionLogDto.builder()
                .id(log.getId().toString())
                .stepId(log.getStep().getId().toString())
                .stepName(log.getStep().getName())
                .stepType(log.getStep().getStepType())
                .status(log.getStatus())
                .inputData(log.getInputData())
                .outputData(log.getOutputData())
                .errorMessage(log.getErrorMessage())
                .durationMs(log.getDurationMs())
                .executedAt(log.getExecutedAt())
                .build();
    }

    private WorkflowStep resolveStep(Integer index, String stepId, List<WorkflowStep> savedSteps) {
        if (index != null && index >= 0 && index < savedSteps.size()) {
            return savedSteps.get(index);
        }
        if (stepId != null) {
            return stepRepository.findById(UUID.fromString(stepId)).orElse(null);
        }
        return null;
    }
}
