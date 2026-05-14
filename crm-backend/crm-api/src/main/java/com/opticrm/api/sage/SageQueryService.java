package com.opticrm.api.sage;

import com.opticrm.common.exception.BusinessException;
import com.opticrm.security.service.SettingService;
import com.opticrm.security.service.SettingService.SageConnectionInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SageQueryService {

    private final SettingService settingService;

    // ─── Comptes clients ──────────────────────────────────────────────────────

    public List<Map<String, Object>> fetchAccounts() {
        SageConnectionInfo info = settingService.getSageConnectionInfo();
        validate(info);

        StringBuilder sql = new StringBuilder(
            "SELECT " +
            "[Code client] CT_Num, [Intitulé] CT_Intitule, " +
            "ISNULL([Email],'') CT_Email, ISNULL([Téléphone],'') CT_Telephone, " +
            "ISNULL([Adresse],'') + ISNULL([Complément],'') CT_Adresse, " +
            "ISNULL([Code postal],'') CT_CodePostal, ISNULL([Ville],'') CT_Ville, ISNULL([Pays],'') CT_Pays, " +
            "'' CT_Siret, '' CT_Siren, ISNULL([ICE_],'') ICE " +
            "FROM [dbo].[Clients] " +
            "WHERE ISNULL(Catégorie_,'') NOT IN ('','NON AFFECTE','COMPTANT','SHOWROOM','=','PARTICULIER','PERSONNEL')"
        );

        // Filtre par dossier si configuré
        if (!info.dossier().isBlank()) {
            sql.append(" AND db = '").append(info.dossier().replace("'", "''")).append("'");
        }

        return execute(info, sql.toString());
    }

    // ─── Contacts ─────────────────────────────────────────────────────────────

    public List<Map<String, Object>> fetchContacts() {
        SageConnectionInfo info = settingService.getSageConnectionInfo();
        validate(info);

        String sql =
            "SELECT CT.CO_No, CT.CT_Num, CT.CO_Nom, CT.CO_Prenom, " +
            "ISNULL(CT.CO_Fonction,'') CO_Fonction, " +
            "ISNULL(CT.CO_Tel,'') CO_Tel, ISNULL(CT.CO_Portable,'') CO_Portable, " +
            "ISNULL(CT.CO_Email,'') CO_Email " +
            "FROM [dbo].[F_CONTACTT] CT " +
            "INNER JOIN [dbo].[F_COMPTET] C ON CT.CT_Num = C.CT_Num " +
            "WHERE CT.CO_Email IS NOT NULL AND CT.CO_Email <> '' " +
            "AND C.CT_Type = 0";

        return execute(info, sql);
    }

    // ─── Requête personnalisée ────────────────────────────────────────────────

    public List<Map<String, Object>> executeCustomQuery(String sql, String entityType) {
        SageConnectionInfo info = settingService.getSageConnectionInfo();
        validate(info);

        // Sécurité : on s'appuie sur executeQuery() qui lève une SQLException
        // si la requête produit un update count (INSERT/UPDATE/DELETE) plutôt qu'un ResultSet.
        // Cela couvre SELECT, WITH...SELECT (CTE), et bloque nativement tout DML.
        log.info("Requête Sage personnalisée [{}] : {}…", entityType,
                sql.strip().substring(0, Math.min(120, sql.strip().length())));
        return execute(info, sql);
    }

    // ─── Test de connexion ────────────────────────────────────────────────────

    public void testConnection() {
        SageConnectionInfo info = settingService.getSageConnectionInfo();
        validate(info);
        try (Connection conn = buildConnection(info)) {
            log.info("Test connexion Sage OK : {}:{}/{}", info.host(), info.port(), info.database());
        } catch (SQLException e) {
            throw new BusinessException("SAGE_CONNECTION_FAILED",
                    "Impossible de se connecter à Sage SQL Server : " + e.getMessage());
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void validate(SageConnectionInfo info) {
        if (!info.enabled()) {
            throw new BusinessException("SAGE_DISABLED",
                    "La connexion Sage n'est pas activée. Configurez-la dans l'onglet Configuration serveur.");
        }
        if (info.host().isBlank() || info.database().isBlank()) {
            throw new BusinessException("SAGE_NOT_CONFIGURED",
                    "Adresse du serveur ou nom de base de données non configuré.");
        }
    }

    private Connection buildConnection(SageConnectionInfo info) throws SQLException {
        String url = String.format(
            "jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true;loginTimeout=15",
            info.host(), info.port(), info.database()
        );
        return DriverManager.getConnection(url, info.username(), info.password());
    }

    private List<Map<String, Object>> execute(SageConnectionInfo info, String sql) {
        try (Connection conn = buildConnection(info);
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setQueryTimeout(240); // 4 minutes max par requête SQL
            try (ResultSet rs = stmt.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();
                List<Map<String, Object>> rows = new ArrayList<>();

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= cols; i++) {
                        Object val = rs.getObject(i);
                        row.put(meta.getColumnLabel(i).toLowerCase(), val != null ? val.toString().trim() : "");
                    }
                    rows.add(row);
                }

                log.info("Sage query ({} col) → {} lignes", cols, rows.size());
                return rows;
            }
        } catch (SQLException e) {
            log.error("Erreur requête Sage: {}", e.getMessage());
            throw new BusinessException("SAGE_QUERY_ERROR",
                    "Erreur lors de l'exécution de la requête Sage : " + e.getMessage());
        }
    }
}
