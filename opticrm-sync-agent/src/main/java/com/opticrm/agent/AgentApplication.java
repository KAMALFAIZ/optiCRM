package com.opticrm.agent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.security.Security;
import java.util.Arrays;
import java.util.stream.Collectors;

@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        DataSourceTransactionManagerAutoConfiguration.class,
        JdbcTemplateAutoConfiguration.class
})
@EnableScheduling
public class AgentApplication {

    static {
        // Les serveurs Sage / SQL Server anciens ne proposent que TLS 1.0 lors du
        // handshake de login (même avec encrypt=false). Java 21 désactive TLS 1.0/1.1
        // par défaut, ce qui fait échouer la connexion. On les réautorise ici, avant
        // toute initialisation SSL. À retirer dès que le serveur SQL supporte TLS 1.2.
        relaxLegacyTls();
    }

    private static void relaxLegacyTls() {
        String disabled = Security.getProperty("jdk.tls.disabledAlgorithms");
        if (disabled == null || !disabled.contains("TLSv1")) {
            return;
        }
        String relaxed = Arrays.stream(disabled.split(","))
                .map(String::trim)
                .filter(a -> !a.equalsIgnoreCase("TLSv1") && !a.equalsIgnoreCase("TLSv1.1"))
                .collect(Collectors.joining(", "));
        Security.setProperty("jdk.tls.disabledAlgorithms", relaxed);
    }

    public static void main(String[] args) {
        // Spring Boot force java.awt.headless=true AVANT de lire application.yml, donc
        // spring.main.headless:false n'a aucun effet en `java -jar`. On le force ici,
        // avant tout init AWT, pour que la fenêtre Swing s'affiche dans tous les cas.
        System.setProperty("java.awt.headless", "false");
        SpringApplication.run(AgentApplication.class, args);
    }
}
