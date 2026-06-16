package com.opticrm.agent.sage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lecture des entités Sage (F_COMPTET, F_CONTACTT, F_ARTICLE, F_ARTSTOCK).
 * Les requêtes utilisent SELECT * pour s'adapter aux variantes de schéma Sage.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SageReader {

    private final SageConnection connection;

    // Pas de TOP : on synchronise l'intégralité des tables Sage. Les anciens plafonds
    // (TOP 5000/10000/20000) tronquaient silencieusement les gros dossiers — ex. 10000
    // articles importés au lieu de 18000. Le push est déjà découpé en lots côté agent.
    public List<Map<String, Object>> fetchAccounts() throws Exception {
        return query("SELECT * FROM dbo.F_COMPTET WHERE CT_Type = 1");
    }

    public List<Map<String, Object>> fetchContacts() throws Exception {
        return query("SELECT * FROM dbo.F_CONTACTT");
    }

    public List<Map<String, Object>> fetchProducts() throws Exception {
        return query("SELECT * FROM dbo.F_ARTICLE WHERE AR_Sommeil = 0");
    }

    public List<Map<String, Object>> fetchInventory() throws Exception {
        return query("SELECT * FROM dbo.F_ARTSTOCK");
    }

    private List<Map<String, Object>> query(String sql) throws Exception {
        try (Connection c = connection.open();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setQueryTimeout(120);
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData md = rs.getMetaData();
                int cols = md.getColumnCount();
                List<Map<String, Object>> out = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>(cols);
                    for (int i = 1; i <= cols; i++) {
                        // Clés en minuscules ET majuscules : le backend accepte les deux formats
                        Object value = rs.getObject(i);
                        String label = md.getColumnLabel(i);
                        row.put(label, value);
                        row.put(label.toLowerCase(), value);
                    }
                    out.add(row);
                }
                return out;
            }
        }
    }
}
