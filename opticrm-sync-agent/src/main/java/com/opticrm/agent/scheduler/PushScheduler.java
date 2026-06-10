package com.opticrm.agent.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.sage.SageWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Tire les documents OptiCRM à exporter → écrit dans Sage → confirme.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PushScheduler {

    private final AgentProperties props;
    private final OptiCrmClient client;
    private final SageWriter sageWriter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelayString = "${agent.sync.push.poll-interval-ms:30000}")
    public void runPush() {
        if (!props.getSync().getPush().isEnabled()) return;

        try {
            Map response = client.pullPendingExports(20).block();
            if (response == null) return;
            Object data = response.get("data");
            if (!(data instanceof List<?> exports) || exports.isEmpty()) return;

            log.info("[Push] {} exports à traiter", exports.size());
            for (Object item : exports) {
                if (!(item instanceof Map<?, ?> m)) continue;
                handleExport(m);
            }
        } catch (Exception e) {
            log.error("[Push] erreur cycle : {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("rawtypes")
    private void handleExport(Map exportItem) {
        String exportId   = String.valueOf(exportItem.get("exportId"));
        String entityType = String.valueOf(exportItem.get("entityType"));
        Integer docType   = (Integer) exportItem.get("sageDocType");
        String payloadStr = String.valueOf(exportItem.get("payload"));

        try {
            JsonNode payload = objectMapper.readTree(payloadStr);
            SageWriter.WriteResult res;
            if ("PAYMENT".equals(entityType)) {
                res = sageWriter.writePayment(payload);
            } else {
                int doType = docType != null ? docType : switch (entityType) {
                    case "QUOTE" -> 0;
                    case "SALES_ORDER" -> 1;
                    case "DELIVERY" -> 3;
                    default -> 0;
                };
                res = sageWriter.writeDocument(doType, payload);
            }

            if (res.success()) {
                client.sendExportResult(exportId, "SUCCESS", res.sagePiece(), null).block();
                log.info("[Push] {} {} → Sage piece={}", entityType, exportId, res.sagePiece());
            } else {
                client.sendExportResult(exportId, "RETRY", null, res.errorMessage()).block();
                log.warn("[Push] {} {} échec : {}", entityType, exportId, res.errorMessage());
            }
        } catch (Exception e) {
            client.sendExportResult(exportId, "ERROR", null, e.getMessage()).block();
            log.error("[Push] {} {} exception : {}", entityType, exportId, e.getMessage(), e);
        }
    }
}
