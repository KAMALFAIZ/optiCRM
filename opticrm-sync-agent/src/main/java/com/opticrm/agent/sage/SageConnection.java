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
        String url = "jdbc:sqlserver://" + s.getHost() + ":" + s.getPort()
                + ";databaseName=" + s.getDatabase()
                + ";encrypt=false;trustServerCertificate=true;loginTimeout=15";
        return DriverManager.getConnection(url, s.getUsername(), s.getPassword());
    }

    public boolean ping() {
        try (Connection c = open()) {
            return c.isValid(5);
        } catch (SQLException e) {
            log.warn("Sage ping failed : {}", e.getMessage());
            return false;
        }
    }
}
