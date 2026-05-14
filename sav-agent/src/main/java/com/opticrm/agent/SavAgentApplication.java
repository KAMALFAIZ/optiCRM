package com.opticrm.agent;

import com.opticrm.agent.config.AgentProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SAV Agent — Agent local OptiCRM.
 *
 * Application Spring Boot légère déployée chez le client.
 * Se connecte au serveur CRM central via WebSocket sortant (wss://)
 * et exécute des commandes locales à la demande :
 *   - Requêtes SQL sur la base de données locale
 *   - Appels HTTP vers des API locales (ERP, POS, Sage...)
 *   - Commandes shell (impression, scripts batch...)
 *   - Opérations fichier (lecture/écriture)
 *
 * Aucun port entrant n'est nécessaire chez le client.
 *
 * @see <a href="https://opticrm.com/docs/agent">Documentation Agent</a>
 */
@Slf4j
@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(AgentProperties.class)
public class SavAgentApplication {

    public static void main(String[] args) {
        log.info("===========================================");
        log.info("  SAV Agent - OptiCRM Local Agent");
        log.info("  Version: 1.0.0");
        log.info("===========================================");

        SpringApplication.run(SavAgentApplication.class, args);
    }
}
