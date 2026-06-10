package com.opticrm.agent.sage;

import com.fasterxml.jackson.databind.JsonNode;
import com.opticrm.agent.config.AgentProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Écriture dans Sage : INSERT F_DOCENTETE / F_DOCLIGNE / F_REGLEMT.
 *
 * IMPORTANT : Sage 100 demande un schéma comptable cohérent (CT_Num existant,
 * AR_Ref existant, numérotation DO_Piece unique). On vérifie ces pré-requis
 * avant insertion ; on rollback toute la transaction sur la moindre erreur.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SageWriter {

    private final SageConnection connection;
    private final AgentProperties props;

    public record WriteResult(boolean success, String sagePiece, String errorMessage) {}

    /**
     * Insère un en-tête + lignes dans F_DOCENTETE/F_DOCLIGNE.
     * @param doType  0=Devis, 1=BC, 3=BL, 6=Facture
     * @param payload JSON { accountSageCode, date, ref, totalHT, totalTTC, lines:[{arRef, qte, prixU, tva}] }
     */
    public WriteResult writeDocument(int doType, JsonNode payload) {
        String accountCode = payload.path("accountSageCode").asText(null);
        if (accountCode == null || accountCode.isBlank()) {
            return new WriteResult(false, null, "accountSageCode manquant");
        }

        try (Connection c = connection.open()) {
            c.setAutoCommit(false);
            try {
                if (!exists(c, "SELECT 1 FROM dbo.F_COMPTET WHERE CT_Num = ?", accountCode)) {
                    return new WriteResult(false, null,
                            "Compte Sage CT_Num=" + accountCode + " introuvable");
                }

                String docRef  = payload.path("ref").asText("");
                String doPiece = nextDoPiece(c, doType);
                LocalDate date = payload.has("date") && !payload.get("date").isNull()
                        ? LocalDate.parse(payload.get("date").asText())
                        : LocalDate.now();
                BigDecimal totalHT  = bd(payload, "totalHT");
                BigDecimal totalTTC = bd(payload, "totalTTC");

                try (PreparedStatement ps = c.prepareStatement("""
                    INSERT INTO dbo.F_DOCENTETE (
                        DO_Domaine, DO_Type, DO_Piece, DO_Ref, DO_Date,
                        CT_NumPayeur, CT_NumPayeurOrig,
                        DO_TotalHT, DO_TotalTTC, DO_Statut, DO_Devise, DO_Cours
                    ) VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
                    """)) {
                    ps.setInt(1, doType);
                    ps.setString(2, doPiece);
                    ps.setString(3, docRef);
                    ps.setTimestamp(4, Timestamp.valueOf(date.atStartOfDay()));
                    ps.setString(5, accountCode);
                    ps.setString(6, accountCode);
                    ps.setBigDecimal(7, totalHT);
                    ps.setBigDecimal(8, totalTTC);
                    ps.setInt(9, props.getSync().getSageDefaults().getDevise());
                    ps.executeUpdate();
                }

                JsonNode lines = payload.path("lines");
                int lineNo = 1000;
                for (JsonNode line : lines) {
                    String arRef = line.path("arRef").asText();
                    if (!exists(c, "SELECT 1 FROM dbo.F_ARTICLE WHERE AR_Ref = ?", arRef)) {
                        throw new IllegalStateException("Article Sage AR_Ref=" + arRef + " introuvable");
                    }
                    try (PreparedStatement ps = c.prepareStatement("""
                        INSERT INTO dbo.F_DOCLIGNE (
                            DO_Domaine, DO_Type, DO_Piece, DL_Ligne,
                            AR_Ref, DL_Design, DL_Qte, DL_PrixUnitaire,
                            DL_MontantHT, DL_MontantTTC, DL_TVA1
                        ) VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)) {
                        ps.setInt(1, doType);
                        ps.setString(2, doPiece);
                        ps.setInt(3, lineNo);
                        ps.setString(4, arRef);
                        ps.setString(5, line.path("designation").asText(""));
                        ps.setBigDecimal(6, bd(line, "qte"));
                        ps.setBigDecimal(7, bd(line, "prixU"));
                        ps.setBigDecimal(8, bd(line, "montantHT"));
                        ps.setBigDecimal(9, bd(line, "montantTTC"));
                        ps.setBigDecimal(10, bd(line, "tva"));
                        ps.executeUpdate();
                    }
                    lineNo += 1000;
                }
                c.commit();
                return new WriteResult(true, doPiece, null);
            } catch (Exception e) {
                c.rollback();
                log.error("SageWriter doType={} échoué : {}", doType, e.getMessage(), e);
                return new WriteResult(false, null, e.getMessage());
            }
        } catch (Exception e) {
            return new WriteResult(false, null, e.getMessage());
        }
    }

    /** Insère un règlement client dans F_REGLEMT. */
    public WriteResult writePayment(JsonNode payload) {
        String accountCode = payload.path("accountSageCode").asText(null);
        if (accountCode == null) return new WriteResult(false, null, "accountSageCode manquant");

        try (Connection c = connection.open()) {
            c.setAutoCommit(false);
            try {
                if (!exists(c, "SELECT 1 FROM dbo.F_COMPTET WHERE CT_Num = ?", accountCode)) {
                    return new WriteResult(false, null, "Compte introuvable : " + accountCode);
                }
                BigDecimal amount = bd(payload, "amount");
                String reference  = payload.path("reference").asText("");
                int mode = mapPaymentMode(payload.path("paymentMethod").asText("CASH"));
                LocalDate date = payload.has("date") && !payload.get("date").isNull()
                        ? LocalDate.parse(payload.get("date").asText())
                        : LocalDate.now();

                try (PreparedStatement ps = c.prepareStatement("""
                    INSERT INTO dbo.F_REGLEMT (
                        CT_NumPayeur, RG_Date, RG_Montant,
                        RG_Reference, RG_ModeReglement, RG_Type
                    ) VALUES (?, ?, ?, ?, ?, 0)
                    """, new String[]{"RG_No"})) {
                    ps.setString(1, accountCode);
                    ps.setTimestamp(2, Timestamp.valueOf(date.atStartOfDay()));
                    ps.setBigDecimal(3, amount);
                    ps.setString(4, reference);
                    ps.setInt(5, mode);
                    ps.executeUpdate();
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        String rgNo = keys.next() ? String.valueOf(keys.getInt(1)) : null;
                        c.commit();
                        return new WriteResult(true, rgNo, null);
                    }
                }
            } catch (Exception e) {
                c.rollback();
                return new WriteResult(false, null, e.getMessage());
            }
        } catch (Exception e) {
            return new WriteResult(false, null, e.getMessage());
        }
    }

    private boolean exists(Connection c, String sql, String param) throws Exception {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, param);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private String nextDoPiece(Connection c, int doType) throws Exception {
        String prefix = switch (doType) {
            case 0 -> "DEV";
            case 1 -> "BC";
            case 3 -> "BL";
            case 6 -> "FA";
            default -> "DOC";
        };
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT MAX(DO_Piece) FROM dbo.F_DOCENTETE WHERE DO_Type = ? AND DO_Piece LIKE ?")) {
            ps.setInt(1, doType);
            ps.setString(2, prefix + "%");
            try (ResultSet rs = ps.executeQuery()) {
                String last = rs.next() ? rs.getString(1) : null;
                int n = 1;
                if (last != null && last.length() > prefix.length()) {
                    try { n = Integer.parseInt(last.substring(prefix.length())) + 1; }
                    catch (NumberFormatException ignored) {}
                }
                return String.format("%s%05d", prefix, n);
            }
        }
    }

    private int mapPaymentMode(String m) {
        return switch (m) {
            case "CASH" -> 0;
            case "CHECK" -> 1;
            case "BANK_TRANSFER" -> 2;
            case "CREDIT_CARD" -> 3;
            case "DIRECT_DEBIT" -> 4;
            default -> 0;
        };
    }

    private BigDecimal bd(JsonNode node, String field) {
        JsonNode v = node.path(field);
        if (v.isMissingNode() || v.isNull()) return BigDecimal.ZERO;
        return v.decimalValue();
    }
}
