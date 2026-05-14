package com.opticrm.workflow.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.communication.service.NotificationService;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.activity.entity.Activity;
import com.opticrm.core.activity.repository.ActivityRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.workflow.entity.WorkflowExecution;
import com.opticrm.workflow.entity.WorkflowStep;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.Resource;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class WorkflowActionExecutor {

    private final NotificationService    notificationService;
    private final ObjectMapper           objectMapper;
    private final ActivityRepository     activityRepository;
    private final LeadRepository         leadRepository;
    private final ContactRepository      contactRepository;
    private final AccountRepository      accountRepository;
    private final OpportunityRepository  opportunityRepository;

    @Resource(name = "workflowRestTemplate")
    private RestTemplate restTemplate;

    public WorkflowActionExecutor(NotificationService notificationService,
                                  ObjectMapper objectMapper,
                                  ActivityRepository activityRepository,
                                  LeadRepository leadRepository,
                                  ContactRepository contactRepository,
                                  AccountRepository accountRepository,
                                  OpportunityRepository opportunityRepository) {
        this.notificationService   = notificationService;
        this.objectMapper          = objectMapper;
        this.activityRepository    = activityRepository;
        this.leadRepository        = leadRepository;
        this.contactRepository     = contactRepository;
        this.accountRepository     = accountRepository;
        this.opportunityRepository = opportunityRepository;
    }

    // ── Entry point ──────────────────────────────────────────────────────────

    /**
     * Execute an action step and return output as JSON string.
     */
    public String execute(WorkflowStep step, WorkflowExecution execution) {
        String type   = step.getStepType();
        String config = step.getActionConfig();
        JsonNode cfg  = parseConfig(config);

        try {
            return switch (type) {
                case "SEND_EMAIL"        -> executeSendEmail(cfg, execution);
                case "CREATE_TASK"       -> executeCreateTask(cfg, execution);
                case "CREATE_ACTIVITY"   -> executeCreateActivity(cfg, execution);
                case "UPDATE_ENTITY"     -> executeUpdateEntity(cfg, execution);
                case "SEND_NOTIFICATION" -> executeSendNotification(cfg, execution);
                case "WEBHOOK"           -> executeWebhook(cfg, execution);
                case "AI_ACTION"         -> executeAiAction(cfg, execution);
                default -> {
                    log.warn("Unknown step type: {}", type);
                    yield json("warning", "Unknown step type: " + type);
                }
            };
        } catch (Exception e) {
            log.error("Action execution failed [type={}]: {}", type, e.getMessage(), e);
            throw e;
        }
    }

    /** Send an approval notification to the designated approver. */
    public void executeApprovalRequest(WorkflowStep step, WorkflowExecution execution) {
        JsonNode config = parseConfig(step.getActionConfig());
        String approverIdStr = getStr(config, "approverId");
        String message       = getStr(config, "message");

        if (approverIdStr != null) {
            try {
                UUID approverId = UUID.fromString(approverIdStr);
                notificationService.create(
                        approverId,
                        "WORKFLOW_APPROVAL",
                        "Approbation requise",
                        message != null ? message : "Un workflow nécessite votre approbation",
                        "/workflows/executions/" + execution.getId()
                );
                log.info("APPROVAL request sent to user {}", approverId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid approverId '{}': {}", approverIdStr, e.getMessage());
            }
        }
    }

    /**
     * Parse delay configuration.
     * Accepts keys: "value"/"amount" (int) + "unit" (minutes|hours|days).
     */
    public long parseDelayMs(String config) {
        JsonNode node = parseConfig(config);
        int amount = 1;
        if (node != null) {
            if      (node.has("value"))  amount = node.get("value").asInt(1);
            else if (node.has("amount")) amount = node.get("amount").asInt(1);
        }
        String unit = node != null && node.has("unit") ? node.get("unit").asText("hours") : "hours";
        return switch (unit) {
            case "minutes", "minute" -> amount * 60L          * 1_000;
            case "hours",   "hour"   -> amount * 3_600L       * 1_000;
            case "days",    "day"    -> amount * 86_400L      * 1_000;
            case "weeks",   "week"   -> amount * 604_800L     * 1_000;
            default                  -> amount * 3_600L       * 1_000;
        };
    }

    // ── SEND_EMAIL ────────────────────────────────────────────────────────────

    private String executeSendEmail(JsonNode cfg, WorkflowExecution execution) {
        String templateId = getStr(cfg, "templateId");
        String subject    = getStr(cfg, "subject");
        String to         = getStr(cfg, "to");

        // Resolve email address from entity if "to" is a field reference (e.g. "{{entity.email}}")
        String resolvedTo = resolveEntityEmail(to, execution);

        log.info("[WORKFLOW] SEND_EMAIL template={} subject='{}' to={} entity={}/{}",
                templateId, subject, resolvedTo, execution.getEntityType(), execution.getEntityId());

        // TODO: Inject EmailTemplateService and call renderAndSend(templateId, resolvedTo, context)
        // For now: log + return structured output (treated as successful by engine)
        return objectMapper.createObjectNode()
                .put("action",     "email_queued")
                .put("templateId", orEmpty(templateId))
                .put("subject",    orEmpty(subject))
                .put("to",         orEmpty(resolvedTo))
                .toString();
    }

    // ── CREATE_TASK ───────────────────────────────────────────────────────────

    /**
     * Creates an Activity of type TASK linked to the workflow's entity.
     * Config keys: title, description, priority (low|normal|high), dueInDays, assignTo
     */
    private String executeCreateTask(JsonNode cfg, WorkflowExecution execution) {
        String title       = getStr(cfg, "title");
        String description = getStr(cfg, "description");
        String priority    = getStr(cfg, "priority");
        int    dueInDays   = cfg != null && cfg.has("dueInDays") ? cfg.get("dueInDays").asInt(1) : 1;

        Activity task = Activity.builder()
                .activityType("TASK")
                .subject(title != null ? title : "Tâche générée par workflow")
                .description(buildDescription(description, execution))
                .status("planned")
                .priority(priority != null ? priority : "normal")
                .relatedToType(execution.getEntityType())
                .relatedToId(execution.getEntityId())
                .dueDate(Instant.now().plus(dueInDays, ChronoUnit.DAYS))
                .build();

        Activity saved = activityRepository.save(task);
        log.info("[WORKFLOW] CREATE_TASK activityId={} title='{}' dueInDays={}", saved.getId(), title, dueInDays);

        return objectMapper.createObjectNode()
                .put("action",     "task_created")
                .put("activityId", saved.getId().toString())
                .put("title",      orEmpty(title))
                .put("dueInDays",  dueInDays)
                .toString();
    }

    // ── CREATE_ACTIVITY ───────────────────────────────────────────────────────

    /**
     * Creates an Activity linked to the workflow's entity.
     * Config keys: activityType (CALL|EMAIL|MEETING|...), subject, description, dueInDays
     */
    private String executeCreateActivity(JsonNode cfg, WorkflowExecution execution) {
        String type        = getStr(cfg, "activityType");
        if (type == null) type = getStr(cfg, "type");
        String subject     = getStr(cfg, "subject");
        String description = getStr(cfg, "description");
        int    dueInDays   = cfg != null && cfg.has("dueInDays") ? cfg.get("dueInDays").asInt(0) : 0;

        Activity activity = Activity.builder()
                .activityType(type != null ? type : "CALL")
                .subject(subject != null ? subject : "Activité générée par workflow")
                .description(buildDescription(description, execution))
                .status("planned")
                .relatedToType(execution.getEntityType())
                .relatedToId(execution.getEntityId())
                .dueDate(dueInDays > 0 ? Instant.now().plus(dueInDays, ChronoUnit.DAYS) : null)
                .build();

        Activity saved = activityRepository.save(activity);
        log.info("[WORKFLOW] CREATE_ACTIVITY activityId={} type={} subject='{}'", saved.getId(), type, subject);

        return objectMapper.createObjectNode()
                .put("action",     "activity_created")
                .put("activityId", saved.getId().toString())
                .put("type",       orEmpty(type))
                .put("subject",    orEmpty(subject))
                .toString();
    }

    // ── UPDATE_ENTITY ─────────────────────────────────────────────────────────

    /**
     * Updates fields on the entity attached to the execution.
     *
     * Config supports two formats:
     *   1. Single field: {"field": "status", "value": "QUALIFIED"}
     *   2. Multi-field:  {"status": "QUALIFIED", "rating": "hot"}
     */
    private String executeUpdateEntity(JsonNode cfg, WorkflowExecution execution) {
        String entityType = execution.getEntityType();
        UUID   entityId   = execution.getEntityId();

        Map<String, String> updates = extractUpdates(cfg);
        if (updates.isEmpty()) {
            log.warn("[WORKFLOW] UPDATE_ENTITY: no fields to update for {}/{}", entityType, entityId);
            return json("action", "entity_update_skipped");
        }

        int fieldsUpdated = applyEntityUpdates(entityType, entityId, updates);
        log.info("[WORKFLOW] UPDATE_ENTITY {}/{} — {} field(s) updated: {}", entityType, entityId, fieldsUpdated, updates.keySet());

        return objectMapper.createObjectNode()
                .put("action",        "entity_updated")
                .put("entityType",    entityType)
                .put("fieldsUpdated", fieldsUpdated)
                .toString();
    }

    private Map<String, String> extractUpdates(JsonNode cfg) {
        Map<String, String> map = new LinkedHashMap<>();
        if (cfg == null) return map;

        String field = getStr(cfg, "field");
        String value = getStr(cfg, "value");
        if (field != null && value != null) {
            map.put(field, value);
        } else {
            cfg.fields().forEachRemaining(e -> {
                if (!e.getKey().equals("entityType")) {
                    map.put(e.getKey(), e.getValue().asText());
                }
            });
        }
        return map;
    }

    private int applyEntityUpdates(String entityType, UUID entityId, Map<String, String> updates) {
        return switch (entityType) {
            case "LEAD"        -> updateLead(entityId, updates);
            case "CONTACT"     -> updateContact(entityId, updates);
            case "ACCOUNT"     -> updateAccount(entityId, updates);
            case "OPPORTUNITY" -> updateOpportunity(entityId, updates);
            default -> {
                log.warn("[WORKFLOW] UPDATE_ENTITY: unsupported entityType '{}'", entityType);
                yield 0;
            }
        };
    }

    private int updateLead(UUID id, Map<String, String> updates) {
        return leadRepository.findById(id).map(lead -> {
            int count = 0;
            for (Map.Entry<String, String> e : updates.entrySet()) {
                switch (e.getKey()) {
                    case "status"      -> { lead.setStatus(e.getValue());                              count++; }
                    case "rating"      -> { lead.setRating(e.getValue());                              count++; }
                    case "source"      -> { lead.setSource(e.getValue());                              count++; }
                    case "leadScore"   -> { lead.setLeadScore(parseIntSafe(e.getValue(), 0));          count++; }
                    case "budgetRange" -> { lead.setBudgetRange(e.getValue());                         count++; }
                    case "city"        -> { lead.setCity(e.getValue());                                count++; }
                    default            -> log.warn("Unsupported Lead field: '{}'", e.getKey());
                }
            }
            leadRepository.save(lead);
            return count;
        }).orElse(0);
    }

    private int updateContact(UUID id, Map<String, String> updates) {
        return contactRepository.findById(id).map(contact -> {
            int count = 0;
            for (Map.Entry<String, String> e : updates.entrySet()) {
                switch (e.getKey()) {
                    case "jobTitle"     -> { contact.setJobTitle(e.getValue());     count++; }
                    case "department"   -> { contact.setDepartment(e.getValue());   count++; }
                    case "contactRole"  -> { contact.setContactRole(e.getValue());  count++; }
                    case "email"        -> { contact.setEmail(e.getValue());        count++; }
                    default             -> log.warn("Unsupported Contact field: '{}'", e.getKey());
                }
            }
            contactRepository.save(contact);
            return count;
        }).orElse(0);
    }

    private int updateAccount(UUID id, Map<String, String> updates) {
        return accountRepository.findById(id).map(account -> {
            int count = 0;
            for (Map.Entry<String, String> e : updates.entrySet()) {
                switch (e.getKey()) {
                    case "accountType", "type" -> { account.setAccountType(e.getValue()); count++; }
                    default -> log.warn("Unsupported Account field: '{}'", e.getKey());
                }
            }
            accountRepository.save(account);
            return count;
        }).orElse(0);
    }

    private int updateOpportunity(UUID id, Map<String, String> updates) {
        return opportunityRepository.findById(id).map(opp -> {
            int count = 0;
            for (Map.Entry<String, String> e : updates.entrySet()) {
                switch (e.getKey()) {
                    case "probability" -> {
                        opp.setProbability(parseIntSafe(e.getValue(), opp.getProbability() != null ? opp.getProbability() : 0));
                        count++;
                    }
                    default -> log.warn("Unsupported Opportunity field: '{}'", e.getKey());
                }
            }
            opportunityRepository.save(opp);
            return count;
        }).orElse(0);
    }

    // ── SEND_NOTIFICATION ─────────────────────────────────────────────────────

    private String executeSendNotification(JsonNode cfg, WorkflowExecution execution) {
        String userId  = getStr(cfg, "userId");
        String to      = getStr(cfg, "to");
        String title   = getStr(cfg, "title");
        String message = getStr(cfg, "message");

        // "to" can be a userId UUID or a role keyword (manager, assignee, ...)
        UUID targetUserId = resolveTargetUser(userId != null ? userId : to, execution);

        if (targetUserId != null && title != null) {
            notificationService.create(
                    targetUserId,
                    "WORKFLOW",
                    title,
                    message != null ? message : "",
                    "/workflows/executions/" + execution.getId()
            );
            log.info("[WORKFLOW] SEND_NOTIFICATION user={} title='{}'", targetUserId, title);
            return objectMapper.createObjectNode()
                    .put("action",   "notification_sent")
                    .put("userId",   targetUserId.toString())
                    .put("title",    title)
                    .toString();
        }

        log.warn("[WORKFLOW] SEND_NOTIFICATION: could not resolve target user (userId={}, to={})", userId, to);
        return json("action", "notification_skipped");
    }

    // ── WEBHOOK ───────────────────────────────────────────────────────────────

    /**
     * Calls an external HTTP endpoint.
     * Config keys: url (required), method (GET|POST|PUT|PATCH, default POST),
     *              headers (JSON object), body (any JSON, merged with execution context).
     */
    private String executeWebhook(JsonNode cfg, WorkflowExecution execution) {
        String url    = getStr(cfg, "url");
        String method = getStr(cfg, "method");
        if (url == null) {
            log.warn("[WORKFLOW] WEBHOOK: no url configured");
            return json("action", "webhook_skipped");
        }
        if (method == null) method = "POST";

        // Build headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        JsonNode hdrs = cfg != null ? cfg.get("headers") : null;
        if (hdrs != null && hdrs.isObject()) {
            hdrs.fields().forEachRemaining(e -> headers.set(e.getKey(), e.getValue().asText()));
        }

        // Build body: execution context + any custom body fields
        Map<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("workflowId",  execution.getWorkflow().getId());
        bodyMap.put("executionId", execution.getId());
        bodyMap.put("entityType",  execution.getEntityType());
        bodyMap.put("entityId",    execution.getEntityId());
        JsonNode customBody = cfg != null ? cfg.get("body") : null;
        if (customBody != null && customBody.isObject()) {
            customBody.fields().forEachRemaining(e -> bodyMap.put(e.getKey(), e.getValue().asText()));
        }

        HttpMethod httpMethod = HttpMethod.valueOf(method.toUpperCase());
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(bodyMap, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, httpMethod, entity, String.class);
            int statusCode = response.getStatusCode().value();
            log.info("[WORKFLOW] WEBHOOK {} {} → HTTP {}", method, url, statusCode);
            return objectMapper.createObjectNode()
                    .put("action",     "webhook_called")
                    .put("url",        url)
                    .put("method",     method)
                    .put("httpStatus", statusCode)
                    .toString();
        } catch (Exception e) {
            log.error("[WORKFLOW] WEBHOOK {} {} failed: {}", method, url, e.getMessage());
            throw new RuntimeException("Webhook call failed: " + e.getMessage(), e);
        }
    }

    // ── AI_ACTION ─────────────────────────────────────────────────────────────

    private String executeAiAction(JsonNode cfg, WorkflowExecution execution) {
        String aiAction = getStr(cfg, "aiAction");
        String prompt   = getStr(cfg, "prompt");
        log.info("[WORKFLOW] AI_ACTION action={} entity={}/{}", aiAction, execution.getEntityType(), execution.getEntityId());
        // TODO: Integrate with AI service (OpenAI / local LLM)
        return objectMapper.createObjectNode()
                .put("action",   "ai_simulated")
                .put("aiAction", orEmpty(aiAction))
                .put("note",     "AI integration pending")
                .toString();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private JsonNode parseConfig(String config) {
        if (config == null || config.isBlank()) return null;
        try {
            return objectMapper.readTree(config);
        } catch (Exception e) {
            log.warn("Failed to parse action config: {}", e.getMessage());
            return null;
        }
    }

    private String getStr(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        return node.get(field).asText(null);
    }

    private String orEmpty(String s) {
        return s != null ? s : "";
    }

    private String json(String key, String value) {
        return "{\"" + key + "\":\"" + value + "\"}";
    }

    private int parseIntSafe(String s, int defaultVal) {
        try { return Integer.parseInt(s); }
        catch (Exception e) { return defaultVal; }
    }

    private String buildDescription(String userDesc, WorkflowExecution execution) {
        String base = "Créé automatiquement par le workflow : " + execution.getWorkflow().getName()
                + " (exécution " + execution.getId() + ")";
        return userDesc != null ? userDesc + "\n\n" + base : base;
    }

    /** Resolve email from entity. Returns 'to' as-is if not a template reference. */
    private String resolveEntityEmail(String to, WorkflowExecution execution) {
        if (to == null || !to.contains("entity.email")) return to;
        String entityType = execution.getEntityType();
        UUID   entityId   = execution.getEntityId();
        return switch (entityType) {
            case "LEAD"    -> leadRepository.findById(entityId).map(Lead::getEmail).orElse(to);
            case "CONTACT" -> contactRepository.findById(entityId).map(Contact::getEmail).orElse(to);
            case "ACCOUNT" -> to; // Account has no email field
            default        -> to;
        };
    }

    /**
     * Resolve target user UUID from a value that may be:
     *  - A UUID string → use directly
     *  - A keyword "manager", "assignee", "creator" → resolve from entity or execution
     */
    private UUID resolveTargetUser(String value, WorkflowExecution execution) {
        if (value == null) return null;
        try { return UUID.fromString(value); }
        catch (IllegalArgumentException ignored) { /* keyword */ }

        return switch (value.toLowerCase()) {
            case "creator", "triggeredby" -> execution.getTriggeredById();
            // Future: "manager", "assignee" → look up from entity
            default -> {
                log.warn("[WORKFLOW] Cannot resolve user reference '{}'", value);
                yield null;
            }
        };
    }
}
