package com.opticrm.agent.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "agent")
@Getter @Setter
public class AgentProperties {

    private OptiCRM opticrm = new OptiCRM();
    private Sage sage = new Sage();
    private Sync sync = new Sync();

    @Getter @Setter
    public static class OptiCRM {
        private String serverUrl;
        private String tenantId;
        private String agentKey;
    }

    @Getter @Setter
    public static class Sage {
        private String host;
        private int port = 1433;
        private String database;
        private String username;
        private String password;
        private String dossier;
    }

    @Getter @Setter
    public static class Sync {
        private Pull pull = new Pull();
        private Push push = new Push();
        private SageDefaults sageDefaults = new SageDefaults();
    }

    @Getter @Setter
    public static class Pull {
        private boolean enabled = true;
        private String cron = "0 0 */2 * * *";  // toutes les 2 heures
        private List<String> entities = List.of("ACCOUNTS", "CONTACTS", "PRODUCTS", "INVENTORY");
        /** Nombre de lignes par envoi HTTP (évite les erreurs 413 Payload Too Large). */
        private int batchSize = 200;
    }

    @Getter @Setter
    public static class Push {
        private boolean enabled = true;
        private long pollIntervalMs = 30_000;
        private boolean autoApply = true;
    }

    @Getter @Setter
    public static class SageDefaults {
        private String compteClient = "411000";
        private String journalVente = "VE";
        private String journalBanque = "BQ";
        private int devise = 0;
        private int depotDefaut = 1;
    }
}
