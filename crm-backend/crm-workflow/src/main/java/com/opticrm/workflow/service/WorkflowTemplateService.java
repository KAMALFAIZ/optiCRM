package com.opticrm.workflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.workflow.dto.*;
import com.opticrm.workflow.entity.WorkflowTemplate;
import com.opticrm.workflow.repository.WorkflowTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowTemplateService {

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowService            workflowService;
    private final ObjectMapper               objectMapper;

    // ── List ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<WorkflowTemplateListDto> list(PageRequest pageRequest,
                                              String search,
                                              String category,
                                              String entityType) {
        Sort sort = Sort.by(Sort.Direction.ASC, "category", "name");
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPage() - 1,
                pageRequest.getPerPage(),
                sort
        );
        return templateRepository.findAllWithFilters(search, category, entityType, pageable)
                .map(this::mapToListDto);
    }

    // ── Get by ID ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkflowTemplateDto getById(UUID id) {
        WorkflowTemplate tpl = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template introuvable : " + id));
        return mapToDto(tpl);
    }

    // ── Créer un workflow depuis un template ─────────────────────────────────

    /**
     * Instancie un nouveau workflow (inactif) à partir du template donné.
     * Le nom peut être surchargé via {@code customName}.
     *
     * @param templateId UUID du template source
     * @param customName Nom personnalisé (optionnel, si null → nom du template)
     * @return WorkflowDto du workflow nouvellement créé
     */
    @Transactional
    public WorkflowDto createWorkflowFromTemplate(UUID templateId, String customName) {
        WorkflowTemplate tpl = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template introuvable : " + templateId));

        // Désérialiser les étapes
        List<CreateWorkflowRequest.StepRequest> steps = parseSteps(tpl.getStepsConfig());

        // Désérialiser les transitions
        List<CreateWorkflowRequest.TransitionRequest> transitions = parseTransitions(tpl.getTransitionsConfig());

        // Construire la requête de création
        CreateWorkflowRequest request = CreateWorkflowRequest.builder()
                .name(customName != null && !customName.isBlank() ? customName : tpl.getName())
                .description(tpl.getDescription())
                .entityType(tpl.getEntityType())
                .triggerType(tpl.getTriggerType())
                .triggerConfig(tpl.getTriggerConfig())
                .steps(steps)
                .transitions(transitions)
                .build();

        WorkflowDto created = workflowService.create(request);

        // Incrémenter le compteur d'utilisation
        templateRepository.incrementUsageCount(templateId);

        log.info("Workflow créé depuis template '{}' ({}): nouveau workflow '{}'",
                tpl.getName(), templateId, created.getName());

        return created;
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private WorkflowTemplateListDto mapToListDto(WorkflowTemplate tpl) {
        int stepCount = countSteps(tpl.getStepsConfig());
        return WorkflowTemplateListDto.builder()
                .id(tpl.getId().toString())
                .name(tpl.getName())
                .description(tpl.getDescription())
                .category(tpl.getCategory())
                .icon(tpl.getIcon())
                .entityType(tpl.getEntityType())
                .triggerType(tpl.getTriggerType())
                .tags(tpl.getTags())
                .isSystem(tpl.getIsSystem())
                .usageCount(tpl.getUsageCount())
                .stepCount(stepCount)
                .createdAt(tpl.getCreatedAt())
                .build();
    }

    private WorkflowTemplateDto mapToDto(WorkflowTemplate tpl) {
        List<WorkflowTemplateDto.StepPreview> steps = parseStepsAsPreview(tpl.getStepsConfig());
        List<WorkflowTemplateDto.TransitionPreview> transitions = parseTransitionsAsPreview(tpl.getTransitionsConfig());

        return WorkflowTemplateDto.builder()
                .id(tpl.getId().toString())
                .name(tpl.getName())
                .description(tpl.getDescription())
                .category(tpl.getCategory())
                .icon(tpl.getIcon())
                .entityType(tpl.getEntityType())
                .triggerType(tpl.getTriggerType())
                .triggerConfig(tpl.getTriggerConfig())
                .steps(steps)
                .transitions(transitions)
                .tags(tpl.getTags())
                .isSystem(tpl.getIsSystem())
                .usageCount(tpl.getUsageCount())
                .createdAt(tpl.getCreatedAt())
                .updatedAt(tpl.getUpdatedAt())
                .build();
    }

    // ── JSON helpers ─────────────────────────────────────────────────────────

    private List<CreateWorkflowRequest.StepRequest> parseSteps(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json,
                    new TypeReference<List<CreateWorkflowRequest.StepRequest>>() {});
        } catch (Exception e) {
            log.warn("Impossible de parser stepsConfig: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<CreateWorkflowRequest.TransitionRequest> parseTransitions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json,
                    new TypeReference<List<CreateWorkflowRequest.TransitionRequest>>() {});
        } catch (Exception e) {
            log.warn("Impossible de parser transitionsConfig: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<WorkflowTemplateDto.StepPreview> parseStepsAsPreview(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            List<Map<String, Object>> raw = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, Object>>>() {});
            return raw.stream().map(m -> WorkflowTemplateDto.StepPreview.builder()
                    .name(str(m, "name"))
                    .stepType(str(m, "stepType"))
                    .actionConfig(str(m, "actionConfig"))
                    .stepOrder(intVal(m, "stepOrder"))
                    .isEntryPoint(boolVal(m, "isEntryPoint"))
                    .positionX(intVal(m, "positionX"))
                    .positionY(intVal(m, "positionY"))
                    .build()
            ).toList();
        } catch (Exception e) {
            log.warn("Impossible de parser stepsConfig en preview: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<WorkflowTemplateDto.TransitionPreview> parseTransitionsAsPreview(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            List<Map<String, Object>> raw = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, Object>>>() {});
            return raw.stream().map(m -> WorkflowTemplateDto.TransitionPreview.builder()
                    .fromStepIndex(intVal(m, "fromStepIndex"))
                    .toStepIndex(intVal(m, "toStepIndex"))
                    .label(str(m, "label"))
                    .conditionExpression(str(m, "conditionExpression"))
                    .evalOrder(intVal(m, "evalOrder"))
                    .build()
            ).toList();
        } catch (Exception e) {
            log.warn("Impossible de parser transitionsConfig en preview: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private int countSteps(String json) {
        if (json == null || json.isBlank()) return 0;
        try {
            List<?> list = objectMapper.readValue(json, new TypeReference<List<?>>() {});
            return list.size();
        } catch (Exception e) {
            return 0;
        }
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Integer intVal(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }

    private Boolean boolVal(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(v.toString());
    }
}
