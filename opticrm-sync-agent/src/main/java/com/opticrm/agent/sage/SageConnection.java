package com.opticrm.agent.sage;

import com.opticrm.agent.config.AgentProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@Slf4j
@Component
@RequiredArgsConstructor
public class SageConnection {

    private final AgentProperties props;

    public Connection open() throws SQLException {
        AgentProperties.Sage s = props.getSage();
        // Port 1433 = port par défaut SQL Server : on l'omet de l'URL et on laisse
        // le driver le résoudre. L'authentification se fait via login + mot de passe.
        String hostPort = s.getPort() == 1433 ? s.getHost() : s.getHost() + ":" + s.getPort();
        String url = "jdbc:sqlserver://" + hostPort
                + ";databaseName=" + s.getDatabase()
                + ";encrypt=false;trustServerCertificate=true;loginTimeout=15";
        return DriverManager.getConnection(url, s.getUsername(), s.getPassword());
    }

    public boolean ping() {
        return test().ok();
    }

    /** Résultat détaillé d'un test de connexion (message d'erreur réel inclus). */
    public record TestResult(boolean ok, String message) {}

    public TestResult test() {
        try (Connection c = open()) {
            boolean valid = c.isValid(5);
            return new TestResult(valid, valid ? "OK" : "Connexion ouverte mais jugée invalide");
        } catch (SQLException e) {
            log.warn("Sage ping failed : {}", e.getMessage());
            return new TestResult(false, e.getMessage());
        }
    }
}
