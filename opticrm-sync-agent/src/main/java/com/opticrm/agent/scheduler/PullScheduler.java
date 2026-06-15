package com.opticrm.agent.scheduler;

import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.sage.SageReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Lit Sage → pousse vers OptiCRM.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PullScheduler {

    private final AgentProperties props;
    private final SageReader sageReader;
    private final OptiCrmClient client;

    @Scheduled(cron = "${agent.sync.pull.cron:0 0 */2 * * *}")
    public void runPull() {
        if (!props.getSync().getPull().isEnabled()) return;
        log.info("[Pull] démarrage cycle Sage → CRM");

        for (String entity : props.getSync().getPull().getEntities()) {
            try {
                List<Map<String, Object>> rows = switch (entity) {
                    case "ACCOUNTS"  -> sageReader.fetchAccounts();
                    case "CONTACTS"  -> sageReader.fetchContacts();
                    case "PRODUCTS"  -> sageReader.fetchProducts();
                    case "INVENTORY" -> sageReader.fetchInventory();
                    default -> List.of();
                };
                if (rows.isEmpty()) {
                    log.info("[Pull] {} : 0 ligne", entity);
                    continue;
                }
                sendInBatches(entity, rows);
            } catch (Exception e) {
                log.error("[Pull] {} erreur : {}", entity, e.getMessage(), e);
            }
        }
    }

    /**
     * Envoie les lignes par lots. Si un lot est refusé en 413 (Payload Too Large),
     * la taille de lot est divisée par deux et le lot est réessayé — l'agent s'adapte
     * ainsi automatiquement à la largeur des lignes et à la limite du serveur.
     */
    private void sendInBatches(String entity, List<Map<String, Object>> rows) {
        int total = rows.size();
        int batchSize = Math.max(1, props.getSync().getPull().getBatchSize());
        int from = 0, sent = 0, integrated = 0, failed = 0;
        String firstError = null;
        while (from < total) {
            int size = Math.min(batchSize, total - from);
            List<Map<String, Object>> batch = rows.subList(from, from + size);
            try {
                Map<?, ?> resp = client.pushSageData(entity, batch).block();
                int[] counts = readCounts(resp);
                integrated += counts[0];
                failed += counts[1];
                if (firstError == null) firstError = readFirstError(resp);
                from += size;
                sent += size;
                log.info("[Pull] {} : {}/{} envoyées (intégrées={} erreurs={})",
                        entity, sent, total, integrated, failed);
            } catch (Exception e) {
                if (isPayloadTooLarge(e) && size > 1) {
                    batchSize = Math.max(1, size / 2);
                    log.warn("[Pull] {} : lot de {} trop volumineux (413), réduction à {} lignes/envoi",
                            entity, size, batchSize);
                } else {
                    throw e;
                }
            }
        }
        if (failed > 0) {
            log.warn("[Pull] {} TERMINÉ : {} intégrées, {} en ERREUR — 1ère erreur : {}",
                    entity, integrated, failed, firstError);
        } else {
            log.info("[Pull] {} TERMINÉ : {} intégrées en base", entity, integrated);
        }
    }

    /** Lit [successItems, errorItems] depuis la réponse {success, data:{...}}. */
    private int[] readCounts(Object resp) {
        if (resp instanceof Map<?, ?> m && m.get("data") instanceof Map<?, ?> d) {
            return new int[]{toInt(d.get("successItems")), toInt(d.get("errorItems"))};
        }
        return new int[]{0, 0};
    }

    private String readFirstError(Object resp) {
        if (resp instanceof Map<?, ?> m && m.get("data") instanceof Map<?, ?> d) {
            Object fe = d.get("firstError");
            return fe != null ? fe.toString() : null;
        }
        return null;
    }

    private int toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        try { return o != null ? Integer.parseInt(o.toString()) : 0; }
        catch (NumberFormatException e) { return 0; }
    }

    private boolean isPayloadTooLarge(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof WebClientResponseException w
                    && w.getStatusCode().value() == 413) {
                return true;
            }
            String msg = t.getMessage();
            if (msg != null && (msg.contains("413") || msg.contains("Payload Too Large"))) {
                return true;
            }
        }
        return false;
    }
}
