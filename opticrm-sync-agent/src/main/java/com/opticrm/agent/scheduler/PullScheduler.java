package com.opticrm.agent.scheduler;

import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.sage.SageReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

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
                client.pushSageData(entity, rows)
                        .doOnSuccess(r -> log.info("[Pull] {} : {} lignes envoyées", entity, rows.size()))
                        .doOnError(e -> log.error("[Pull] {} échec : {}", entity, e.getMessage()))
                        .block();
            } catch (Exception e) {
                log.error("[Pull] {} erreur : {}", entity, e.getMessage(), e);
            }
        }
    }
}
