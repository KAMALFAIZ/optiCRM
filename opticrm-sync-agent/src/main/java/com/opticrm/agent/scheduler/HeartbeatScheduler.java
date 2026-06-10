package com.opticrm.agent.scheduler;

import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.sage.SageConnection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HeartbeatScheduler {

    private final OptiCrmClient client;
    private final SageConnection sage;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Agent OptiCRM démarré — enregistrement…");
        client.register()
                .doOnSuccess(r -> log.info("Enregistrement OK : {}", r))
                .doOnError(e -> log.error("Échec enregistrement : {}", e.getMessage()))
                .subscribe();
    }

    @Scheduled(fixedDelay = 60_000)
    public void heartbeat() {
        boolean sageOk = sage.ping();
        client.heartbeat(sageOk ? "OK" : "ERROR",
                         sageOk ? null : "Connexion SQL Server impossible")
                .doOnError(e -> log.debug("Heartbeat échec : {}", e.getMessage()))
                .subscribe();
    }
}
