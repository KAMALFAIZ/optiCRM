package com.opticrm.agent.executor;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Exécute des requêtes SQL sur la base de données locale du client.
 *
 * Supporte :
 * - SQL_QUERY  : SELECT / WITH — retourne {columns, rows, rowCount, capturedAt}
 * - SQL_EXECUTE: UPDATE / DELETE / INSERT — retourne {affectedRows, updateCount}
 *
 * Paramètres :
 * - Positionnels : payload.params = [val1, val2, ...]
 * - Nommés       : payload.namedParams = { "article_ref": "ART-001", "prix": 42.5 }
 *                  Les :paramName dans la requête sont remplacés par ? dans l'ordre d'apparition.
 */
@Slf4j
@Component
public class SqlQueryExecutor implements CommandExecutor {

    private static final Pattern NAMED_PARAM_PATTERN = Pattern.compile(":([a-zA-Z_]\\w*)");

    private final AgentProperties properties;
    private final DataSource dataSource;
    private final boolean enabled;

    public SqlQueryExecutor(AgentProperties properties,
                            org.springframework.beans.factory.ObjectProvider<DataSource> dataSourceProvider) {
        this.properties = properties;
        this.enabled = properties.getLocalDatabase().isEnabled()
                && properties.getLocalDatabase().getUrl() != null
                && !properties.getLocalDatabase().getUrl().isBlank();

        if (enabled) {
            this.dataSource = dataSourceProvider.getIfAvailable();
            log.info("SQL Executor enabled, DB URL: {}", properties.getLocalDatabase().getUrl());
        } else {
            this.dataSource = null;
            log.info("SQL Executor disabled (no local database configured)");
        }
    }

    @Override
    public AgentResponse execute(AgentCommand command) {
        if (!enabled || dataSource == null) {
            return AgentResponse.failed(command.getCommandId(),
                    "SQL_DISABLED", "L'exécution SQL n'est pas activée sur cet agent");
        }

        Map<String, Object> payload = command.getPayload();
        String rawQuery = (String) payload.get("query");

        if (rawQuery == null || rawQuery.isBlank()) {
            return AgentResponse.failed(command.getCommandId(), "INVALID_QUERY", "La requête SQL est vide");
        }

        // ── Résoudre les paramètres (nommés ou positionnels) ──────────────────
        @SuppressWarnings("unchecked")
        Map<String, Object> namedParams = (Map<String, Object>) payload.getOrDefault("namedParams", null);

        @SuppressWarnings("unchecked")
        List<Object> positionalParams = (List<Object>) payload.getOrDefault("params", Collections.emptyList());

        ParsedQuery parsed;
        if (namedParams != null && !namedParams.isEmpty()) {
            parsed = resolveNamedParams(rawQuery, namedParams);
        } else {
            parsed = new ParsedQuery(rawQuery, positionalParams);
        }

        String commandType = command.getType() != null ? command.getType().name() : "SQL_QUERY";
        boolean isModification = "SQL_EXECUTE".equals(commandType) || isModificationQuery(parsed.sql);

        log.info("[{}] SQL: {} | params: {}", commandType, truncate(parsed.sql, 200), parsed.params.size());

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(true);
            conn.setReadOnly(!isModification);

            try (PreparedStatement stmt = conn.prepareStatement(parsed.sql)) {
                stmt.setQueryTimeout(properties.getLocalDatabase().getQueryTimeoutSeconds());
                if (!isModification) {
                    stmt.setMaxRows(properties.getLocalDatabase().getMaxRows());
                }

                // Bind params
                for (int i = 0; i < parsed.params.size(); i++) {
                    stmt.setObject(i + 1, parsed.params.get(i));
                }

                if (isModification) {
                    int affectedRows = stmt.executeUpdate();
                    log.info("SQL_EXECUTE affected {} rows", affectedRows);
                    return AgentResponse.success(command.getCommandId(),
                            Map.of("updateCount", affectedRows, "affectedRows", affectedRows), 0);
                } else {
                    boolean hasResultSet = stmt.execute();
                    if (hasResultSet) {
                        return handleResultSet(command.getCommandId(), stmt.getResultSet());
                    } else {
                        return AgentResponse.success(command.getCommandId(),
                                Map.of("updateCount", stmt.getUpdateCount()), 0);
                    }
                }
            }
        } catch (SQLException e) {
            log.error("SQL execution error [{}]: {}", commandType, e.getMessage());
            return AgentResponse.failed(command.getCommandId(), "SQL_ERROR", e.getMessage());
        }
    }

    // ─── Named parameter resolution ───────────────────────────────────────────

    /**
     * Transforme une requête avec des paramètres nommés (:paramName) en requête JDBC (?)
     * et construit la liste ordonnée des valeurs.
     */
    private ParsedQuery resolveNamedParams(String query, Map<String, Object> namedParams) {
        List<Object> orderedValues = new ArrayList<>();
        Matcher matcher = NAMED_PARAM_PATTERN.matcher(query);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String paramName = matcher.group(1);
            orderedValues.add(namedParams.get(paramName));
            matcher.appendReplacement(sb, "?");
        }
        matcher.appendTail(sb);

        return new ParsedQuery(sb.toString(), orderedValues);
    }

    // ─── ResultSet handling ───────────────────────────────────────────────────

    private AgentResponse handleResultSet(String commandId, ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        int columnCount = meta.getColumnCount();

        List<Map<String, String>> columns = new ArrayList<>();
        for (int i = 1; i <= columnCount; i++) {
            columns.add(Map.of("name", meta.getColumnLabel(i), "type", meta.getColumnTypeName(i)));
        }

        List<List<Object>> rows = new ArrayList<>();
        int maxRows = properties.getLocalDatabase().getMaxRows();
        int rowCount = 0;

        while (rs.next() && rowCount < maxRows) {
            List<Object> row = new ArrayList<>();
            for (int i = 1; i <= columnCount; i++) {
                row.add(rs.getObject(i));
            }
            rows.add(row);
            rowCount++;
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("columns", columns);
        data.put("rows", rows);
        data.put("rowCount", rowCount);
        data.put("capturedAt", Instant.now().toString());
        data.put("truncated", rowCount >= maxRows);

        return AgentResponse.success(commandId, data, 0);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private boolean isModificationQuery(String query) {
        String upper = query.trim().toUpperCase();
        return upper.startsWith("UPDATE")   ||
               upper.startsWith("DELETE")   ||
               upper.startsWith("INSERT")   ||
               upper.startsWith("DROP")     ||
               upper.startsWith("TRUNCATE") ||
               upper.startsWith("ALTER")    ||
               upper.startsWith("CREATE")   ||
               upper.startsWith("MERGE");
    }

    private String truncate(String s, int maxLen) {
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }

    // ─── Inner class ──────────────────────────────────────────────────────────

    private static class ParsedQuery {
        final String sql;
        final List<Object> params;

        ParsedQuery(String sql, List<Object> params) {
            this.sql = sql;
            this.params = params;
        }
    }
}
