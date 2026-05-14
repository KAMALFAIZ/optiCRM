package com.opticrm.workflow.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowConditionEvaluator {

    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final ObjectMapper objectMapper;

    /**
     * Evaluate a condition against an entity.
     * Config format: {"field": "leadScore", "operator": ">=", "value": "50"}
     */
    public boolean evaluate(String config, String entityType, UUID entityId) {
        if (config == null || config.isBlank()) return true;

        try {
            JsonNode node = objectMapper.readTree(config);
            String field = node.has("field") ? node.get("field").asText() : null;
            String operator = node.has("operator") ? node.get("operator").asText() : "==";
            String value = node.has("value") ? node.get("value").asText() : null;

            if (field == null || value == null) return true;

            String entityValue = getEntityFieldValue(entityType, entityId, field);
            if (entityValue == null) return false;

            return compareValues(entityValue, operator, value);
        } catch (Exception e) {
            log.error("Condition evaluation failed: {}", e.getMessage());
            return false;
        }
    }

    private String getEntityFieldValue(String entityType, UUID entityId, String field) {
        return switch (entityType) {
            case "LEAD" -> getLeadFieldValue(entityId, field);
            case "OPPORTUNITY" -> getOpportunityFieldValue(entityId, field);
            default -> null;
        };
    }

    private String getLeadFieldValue(UUID leadId, String field) {
        return leadRepository.findById(leadId).map(lead -> switch (field) {
            case "leadScore" -> String.valueOf(lead.getLeadScore());
            case "status" -> lead.getStatus();
            case "rating" -> lead.getRating();
            case "source" -> lead.getSource();
            case "budgetRange" -> lead.getBudgetRange();
            case "city" -> lead.getCity();
            case "isConverted" -> String.valueOf(lead.getIsConverted());
            default -> null;
        }).orElse(null);
    }

    private String getOpportunityFieldValue(UUID oppId, String field) {
        return opportunityRepository.findById(oppId).map(opp -> switch (field) {
            case "amount" -> opp.getAmount() != null ? opp.getAmount().toString() : null;
            case "probability" -> opp.getProbability() != null ? opp.getProbability().toString() : null;
            case "stageName" -> opp.getStage() != null ? opp.getStage().getName() : null;
            default -> null;
        }).orElse(null);
    }

    private boolean compareValues(String entityValue, String operator, String expectedValue) {
        try {
            double numEntity = Double.parseDouble(entityValue);
            double numExpected = Double.parseDouble(expectedValue);
            return switch (operator) {
                case "==" -> numEntity == numExpected;
                case "!=" -> numEntity != numExpected;
                case ">" -> numEntity > numExpected;
                case ">=" -> numEntity >= numExpected;
                case "<" -> numEntity < numExpected;
                case "<=" -> numEntity <= numExpected;
                default -> false;
            };
        } catch (NumberFormatException e) {
            // String comparison
            return switch (operator) {
                case "==", "equals" -> entityValue.equalsIgnoreCase(expectedValue);
                case "!=" -> !entityValue.equalsIgnoreCase(expectedValue);
                case "contains" -> entityValue.toLowerCase().contains(expectedValue.toLowerCase());
                default -> entityValue.equalsIgnoreCase(expectedValue);
            };
        }
    }
}
