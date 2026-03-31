package com.opticrm.workflow.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.communication.service.NotificationService;
import com.opticrm.workflow.entity.WorkflowExecution;
import com.opticrm.workflow.entity.WorkflowStep;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowActionExecutor {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    /**
     * Execute an action step and return output as JSON string.
     */
    public String execute(WorkflowStep step, WorkflowExecution execution) {
        String type = step.getStepType();
        String config = step.getActionConfig();
        JsonNode configNode = parseConfig(config);

        return switch (type) {
            case "SEND_EMAIL" -> executeSendEmail(configNode, execution);
            case "CREATE_TASK" -> executeCreateTask(configNode, execution);
            case "CREATE_ACTIVITY" -> executeCreateActivity(configNode, execution);
            case "UPDATE_ENTITY" -> executeUpdateEntity(configNode, execution);
            case "SEND_NOTIFICATION" -> executeSendNotification(configNode, execution);
            case "WEBHOOK" -> executeWebhook(configNode, execution);
            case "AI_ACTION" -> executeAiAction(configNode, execution);
            default -> {
                log.warn("Unknown step type: {}", type);
                yield "{\"warning\":\"Unknown step type: " + type + "\"}";
            }
        };
    }

    public void executeApprovalRequest(WorkflowStep step, WorkflowExecution execution) {
        JsonNode config = parseConfig(step.getActionConfig());
        String approverIdStr = getTextValue(config, "approverId");
        String message = getTextValue(config, "message");

        if (approverIdStr != null) {
            UUID approverId = UUID.fromString(approverIdStr);
            notificationService.create(
                    approverId,
                    "WORKFLOW_APPROVAL",
                    "Approbation requise",
                    message != null ? message : "Un workflow nécessite votre approbation",
                    "/workflows/executions/" + execution.getId()
            );
        }
    }

    public long parseDelayMs(String config) {
        JsonNode node = parseConfig(config);
        int amount = node != null && node.has("amount") ? node.get("amount").asInt(1) : 1;
        String unit = node != null && node.has("unit") ? node.get("unit").asText("hours") : "hours";

        return switch (unit) {
            case "minutes" -> amount * 60L * 1000;
            case "hours" -> amount * 3600L * 1000;
            case "days" -> amount * 86400L * 1000;
            default -> amount * 3600L * 1000;
        };
    }

    // ── Action implementations ───────────────────────────────────────────────

    private String executeSendEmail(JsonNode config, WorkflowExecution execution) {
        String templateId = getTextValue(config, "templateId");
        String recipientField = getTextValue(config, "recipientField");
        log.info("SEND_EMAIL: template={}, recipientField={}, entity={}", templateId, recipientField, execution.getEntityId());
        // TODO: Integrate with EmailTemplateService to render and send email
        return "{\"action\":\"email_sent\",\"templateId\":\"" + templateId + "\"}";
    }

    private String executeCreateTask(JsonNode config, WorkflowExecution execution) {
        String title = getTextValue(config, "title");
        String assigneeId = getTextValue(config, "assigneeId");
        String priority = getTextValue(config, "priority");
        log.info("CREATE_TASK: title={}, assignee={}, entity={}", title, assigneeId, execution.getEntityId());
        // TODO: Integrate with TaskService to create task
        return "{\"action\":\"task_created\",\"title\":\"" + title + "\"}";
    }

    private String executeCreateActivity(JsonNode config, WorkflowExecution execution) {
        String type = getTextValue(config, "activityType");
        String subject = getTextValue(config, "subject");
        String assigneeId = getTextValue(config, "assigneeId");
        log.info("CREATE_ACTIVITY: type={}, subject={}, entity={}", type, subject, execution.getEntityId());
        // TODO: Integrate with ActivityService to create activity
        return "{\"action\":\"activity_created\",\"type\":\"" + type + "\",\"subject\":\"" + subject + "\"}";
    }

    private String executeUpdateEntity(JsonNode config, WorkflowExecution execution) {
        String field = getTextValue(config, "field");
        String value = getTextValue(config, "value");
        log.info("UPDATE_ENTITY: field={}, value={}, entity={}/{}", field, value, execution.getEntityType(), execution.getEntityId());
        // TODO: Integrate with entity-specific services to update fields dynamically
        return "{\"action\":\"entity_updated\",\"field\":\"" + field + "\",\"value\":\"" + value + "\"}";
    }

    private String executeSendNotification(JsonNode config, WorkflowExecution execution) {
        String userId = getTextValue(config, "userId");
        String title = getTextValue(config, "title");
        String message = getTextValue(config, "message");

        if (userId != null && title != null) {
            notificationService.create(
                    UUID.fromString(userId),
                    "WORKFLOW",
                    title,
                    message != null ? message : "",
                    "/workflows/executions/" + execution.getId()
            );
        }
        log.info("SEND_NOTIFICATION: user={}, title={}", userId, title);
        return "{\"action\":\"notification_sent\",\"userId\":\"" + userId + "\"}";
    }

    private String executeWebhook(JsonNode config, WorkflowExecution execution) {
        String url = getTextValue(config, "url");
        String method = getTextValue(config, "method");
        log.info("WEBHOOK: url={}, method={}, entity={}", url, method, execution.getEntityId());
        // TODO: HTTP call via RestTemplate/WebClient
        return "{\"action\":\"webhook_called\",\"url\":\"" + url + "\"}";
    }

    private String executeAiAction(JsonNode config, WorkflowExecution execution) {
        String prompt = getTextValue(config, "prompt");
        String aiAction = getTextValue(config, "aiAction");
        log.info("AI_ACTION: action={}, entity={}/{}", aiAction, execution.getEntityType(), execution.getEntityId());
        // TODO: Integrate with AI service
        return "{\"action\":\"ai_executed\",\"aiAction\":\"" + aiAction + "\"}";
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private JsonNode parseConfig(String config) {
        if (config == null || config.isBlank()) return null;
        try {
            return objectMapper.readTree(config);
        } catch (Exception e) {
            log.warn("Failed to parse action config: {}", e.getMessage());
            return null;
        }
    }

    private String getTextValue(JsonNode node, String field) {
        if (node == null || !node.has(field)) return null;
        return node.get(field).asText(null);
    }
}
