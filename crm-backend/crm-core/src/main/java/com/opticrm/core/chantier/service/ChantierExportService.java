package com.opticrm.core.chantier.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.entity.ChantierHistory;
import com.opticrm.core.chantier.repository.ChantierHistoryRepository;
import com.opticrm.core.chantier.repository.ChantierRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChantierExportService {

    private final ChantierService chantierService;
    private final ChantierRepository chantierRepository;
    private final ChantierHistoryRepository chantierHistoryRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("Africa/Casablanca"));
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Africa/Casablanca"));
    private static final DateTimeFormatter LOCAL_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> STADE_LABELS = Map.ofEntries(
            Map.entry("ETUDE_CONCEPTION", "Étude / Conception"),
            Map.entry("AUTORISATION", "Autorisation"),
            Map.entry("TERRASSEMENT", "Terrassement"),
            Map.entry("GROS_OEUVRE", "Gros œuvre"),
            Map.entry("SECOND_OEUVRE", "Second œuvre"),
            Map.entry("PHASE_EQUIPEMENT", "Phase équipement"),
            Map.entry("LIVRAISON", "Livraison"),
            Map.entry("CLOTURE", "Clôturé")
    );

    private static final Map<String, String> STATUT_LABELS = Map.of(
            "ACTIF", "Actif",
            "PRIORITAIRE", "Prioritaire",
            "GAGNE", "Gagné",
            "PARTIEL_GAGNE", "Partiellement gagné",
            "PERDU", "Perdu"
    );

    private static final Map<String, String> ROLE_ACTEUR_LABELS = Map.of(
            "PROMOTEUR", "Promoteur",
            "ARCHITECTE", "Architecte",
            "BUREAU_ETUDES", "Bureau d'études",
            "ENTREPRISE_GENERALE", "Entreprise générale",
            "INSTALLATEUR_PLOMBIER", "Installateur/Plombier"
    );

    private static final Map<String, String> NIVEAU_OPPORTUNITE_LABELS = Map.of(
            "FERME", "Fermé",
            "PARTIELLEMENT_OUVERT", "Partiellement ouvert",
            "LIBRE", "Libre / influençable"
    );

    private static final Map<String, String> DECISEUR_LABELS = Map.of(
            "PROMOTEUR", "Promoteur",
            "ARCHITECTE", "Architecte",
            "BET", "Bureau d'études (BET)",
            "MAITRE_OUVRAGE", "Maître d'ouvrage",
            "MAITRE_OEUVRE", "Maître d'œuvre",
            "INSTALLATEUR", "Installateur",
            "AUTRE", "Autre"
    );

    /** Traduit un code en libellé ; tolère les valeurs null (contrairement à Map.getOrDefault sur Map immuable). */
    private static String label(Map<String, String> labels, String code) {
        if (code == null) return null;
        return labels.getOrDefault(code, code);
    }

    /** Formate une coordonnée GPS sans zéros de fin ; chaîne vide si absente. */
    private static String coord(java.math.BigDecimal v) {
        if (v == null) return "";
        return v.stripTrailingZeros().toPlainString();
    }

    /** Concatène les acteurs liés au chantier sous la forme "Rôle: Nom (Téléphone)". */
    private static String formatActeurs(Chantier c) {
        if (c.getActeurs() == null || c.getActeurs().isEmpty()) return "";
        return c.getActeurs().stream()
                .map(a -> {
                    String base = label(ROLE_ACTEUR_LABELS, a.getRoleActeur()) + ": " + a.getNom();
                    return (a.getTelephone() != null && !a.getTelephone().isBlank())
                            ? base + " (" + a.getTelephone() + ")" : base;
                })
                .collect(java.util.stream.Collectors.joining(", "));
    }

    /** Combine le libellé de la prochaine action et sa date d'échéance. */
    private static String formatProchaineAction(Chantier c) {
        String texte = c.getActionSuivante();
        String date = c.getDateProchaineAction() != null
                ? c.getDateProchaineAction().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : null;
        if (texte != null && !texte.isBlank() && date != null) return texte + " (" + date + ")";
        if (texte != null && !texte.isBlank()) return texte;
        return date;
    }

    /** Parse le JSON des tranches en liste de nœuds ; liste vide si absent/invalide (jamais d'exception propagée). */
    private List<JsonNode> parseTranches(String tranchesJson) {
        if (tranchesJson == null || tranchesJson.isBlank()) return Collections.emptyList();
        try {
            JsonNode arr = objectMapper.readTree(tranchesJson);
            if (!arr.isArray()) return Collections.emptyList();
            List<JsonNode> list = new ArrayList<>();
            arr.forEach(list::add);
            return list;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static String trancheText(JsonNode tranche, String field) {
        if (tranche == null) return "";
        JsonNode v = tranche.get(field);
        return (v == null || v.isNull()) ? "" : v.asText();
    }

    private static String trancheInt(JsonNode tranche, String field) {
        if (tranche == null) return "";
        JsonNode v = tranche.get(field);
        if (v == null || v.isNull()) return "";
        int i = v.asInt(0);
        return i == 0 ? "" : String.valueOf(i);
    }

    /** Reformate une date de tranche "yyyy-MM-dd" en "dd/MM/yyyy" ; tolère les valeurs manquantes/invalides. */
    private static String trancheDate(JsonNode tranche, String field) {
        String raw = trancheText(tranche, field);
        if (raw.isBlank()) return "";
        try {
            return LOCAL_DATE_FMT.format(LocalDate.parse(raw));
        } catch (Exception e) {
            return raw;
        }
    }

    private static final String[] HEADERS = {
            "Nom du chantier", "Code Client", "Compte", "Ville", "Province", "Préfecture d'arrondissement", "Région",
            "Latitude", "Longitude",
            "Type de projet", "Sous-type / Précision",
            "Opportunité", "Décideur", "Concurrent", "Robinetterie",
            "Nb immeubles", "Nb unités", "Nb salles de bain",
            "Segment taille", "Stade", "Statut commercial", "Promoteur", "Représentant", "Acteur",
            "Témoin", "Échantillon", "Prochaine action", "Date de création",
            "N° tranche", "Immeubles (tranche)", "Unités (tranche)", "SDB (tranche)",
            "Stade (tranche)", "Statut (tranche)", "Opportunité (tranche)", "Décideur (tranche)",
            "Date livraison prévue", "Concurrent (tranche)", "Robinetterie (tranche)"
    };

    @Transactional(readOnly = true)
    public byte[] exportToExcel(String search, String stadeChantier, String statutChantier, String typeProjet,
                                 String assignedToId, String accountId, Boolean temoin, String promoteur,
                                 String segmentTaille, String sousTypeProjet, Instant createdFrom, Instant createdTo) throws IOException {

        List<Chantier> chantiers = chantierService.findAllFiltered(search, stadeChantier, statutChantier, typeProjet,
                assignedToId, accountId, temoin, promoteur, segmentTaille, sousTypeProjet, createdFrom, createdTo);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Chantiers");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 1;
            for (Chantier c : chantiers) {
                List<JsonNode> tranches = parseTranches(c.getTranches());
                // Un chantier sans tranche produit tout de même une ligne (colonnes tranche vides).
                List<JsonNode> rows = tranches.isEmpty() ? Collections.singletonList(null) : tranches;
                for (JsonNode tranche : rows) {
                    Row row = sheet.createRow(rowIdx++);
                    int col = 0;
                    createCell(row, col++, c.getNom(), dataStyle);
                    createCell(row, col++, codeClient(c), dataStyle);
                    createCell(row, col++, c.getAccount() != null ? c.getAccount().getName() : "", dataStyle);
                    createCell(row, col++, c.getVille(), dataStyle);
                    createCell(row, col++, c.getProvince(), dataStyle);
                    createCell(row, col++, c.getPrefectureArrondissement(), dataStyle);
                    createCell(row, col++, c.getPrefecture(), dataStyle);
                    createCell(row, col++, coord(c.getLatitude()), dataStyle);
                    createCell(row, col++, coord(c.getLongitude()), dataStyle);
                    createCell(row, col++, c.getTypeProjet(), dataStyle);
                    createCell(row, col++, c.getSousTypeProjet(), dataStyle);
                    createCell(row, col++, label(NIVEAU_OPPORTUNITE_LABELS, c.getNiveauOpportunite()), dataStyle);
                    createCell(row, col++, label(DECISEUR_LABELS, c.getDeciseur()), dataStyle);
                    createCell(row, col++, c.getConcurrentFerme(), dataStyle);
                    createCell(row, col++, c.getRobinetterieMarque(), dataStyle);
                    createCell(row, col++, c.getNombreImmeubles() != null ? c.getNombreImmeubles().toString() : "", dataStyle);
                    createCell(row, col++, c.getNombreUnites() != null ? c.getNombreUnites().toString() : "", dataStyle);
                    createCell(row, col++, c.getNombreSalleDeBain() != null ? c.getNombreSalleDeBain().toString() : "", dataStyle);
                    createCell(row, col++, c.getSegmentTaille(), dataStyle);
                    createCell(row, col++, label(STADE_LABELS, c.getStadeChantier()), dataStyle);
                    createCell(row, col++, label(STATUT_LABELS, c.getStatutChantier()), dataStyle);
                    createCell(row, col++, c.getPromoteur(), dataStyle);
                    createCell(row, col++, c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "", dataStyle);
                    createCell(row, col++, formatActeurs(c), dataStyle);
                    createCell(row, col++, Boolean.TRUE.equals(c.getTemoin()) ? "Oui" : "Non", dataStyle);
                    createCell(row, col++, Boolean.TRUE.equals(c.getEchantillon()) ? "Oui" : "Non", dataStyle);
                    createCell(row, col++, formatProchaineAction(c), dataStyle);
                    createCell(row, col++, c.getCreatedAt() != null ? DATE_FMT.format(c.getCreatedAt()) : "", dataStyle);
                    createCell(row, col++, trancheText(tranche, "numero"), dataStyle);
                    createCell(row, col++, trancheInt(tranche, "immeubles"), dataStyle);
                    createCell(row, col++, trancheInt(tranche, "unites"), dataStyle);
                    createCell(row, col++, trancheInt(tranche, "sallesDeBain"), dataStyle);
                    createCell(row, col++, label(STADE_LABELS, trancheText(tranche, "stade").isBlank() ? null : trancheText(tranche, "stade")), dataStyle);
                    createCell(row, col++, label(STATUT_LABELS, trancheText(tranche, "statut").isBlank() ? null : trancheText(tranche, "statut")), dataStyle);
                    createCell(row, col++, label(NIVEAU_OPPORTUNITE_LABELS, trancheText(tranche, "niveauOpportunite").isBlank() ? null : trancheText(tranche, "niveauOpportunite")), dataStyle);
                    createCell(row, col++, label(DECISEUR_LABELS, trancheText(tranche, "deciseur").isBlank() ? null : trancheText(tranche, "deciseur")), dataStyle);
                    createCell(row, col++, trancheDate(tranche, "dateLivraisonPrevue"), dataStyle);
                    createCell(row, col++, trancheText(tranche, "concurrent"), dataStyle);
                    createCell(row, col, trancheText(tranche, "robinetterie"), dataStyle);
                }
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    // ── PDF ──────────────────────────────────────────────────────────────────

    private static final float MARGIN = 30f;
    private static final float LINE_H = 14f;
    private static final float PAGE_W = PDRectangle.A4.getHeight(); // paysage
    private static final float PAGE_H = PDRectangle.A4.getWidth();

    private static final String[] PDF_COLS = {
            "Nom du chantier", "Ville", "Latitude", "Longitude", "Type", "Statut", "Opportunité", "Représentant",
            "N° tr.", "Stade tr.", "Statut tr.", "Date livr. prévue", "Concurrent", "Robinetterie", "Créé le"
    };
    private static final float[] PDF_WIDTHS = { 82f, 46f, 46f, 46f, 50f, 50f, 54f, 55f, 30f, 50f, 48f, 50f, 60f, 60f, 45f };

    @Transactional(readOnly = true)
    public byte[] exportToPdf(String search, String stadeChantier, String statutChantier, String typeProjet,
                               String assignedToId, String accountId, Boolean temoin, String promoteur,
                               String segmentTaille, String sousTypeProjet, Instant createdFrom, Instant createdTo) throws IOException {

        List<Chantier> chantiers = chantierService.findAllFiltered(search, stadeChantier, statutChantier, typeProjet,
                assignedToId, accountId, temoin, promoteur, segmentTaille, sousTypeProjet, createdFrom, createdTo);

        try (PDDocument doc = new PDDocument()) {
            PDFont fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            PDPage page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = PAGE_H - MARGIN;

            y = drawText(cs, fontBold, 14, "Liste des chantiers", MARGIN, y);
            y -= 4;
            y = drawText(cs, fontNormal, 8, chantiers.size() + " chantier(s) — généré le " + DATE_FMT.format(Instant.now()), MARGIN, y);
            y -= 6;
            y = drawTableHeader(cs, fontBold, y);

            for (Chantier c : chantiers) {
                List<JsonNode> tranches = parseTranches(c.getTranches());
                List<JsonNode> rows = tranches.isEmpty() ? Collections.singletonList(null) : tranches;
                for (JsonNode tranche : rows) {
                    if (y < MARGIN + LINE_H) {
                        cs.close();
                        page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        y = PAGE_H - MARGIN;
                        y = drawTableHeader(cs, fontBold, y);
                    }
                    String stadeTr = trancheText(tranche, "stade");
                    String statutTr = trancheText(tranche, "statut");
                    String[] values = {
                            truncate(c.getNom(), 27),
                            truncate(c.getVille(), 14),
                            truncate(coord(c.getLatitude()).isBlank() ? "-" : coord(c.getLatitude()), 11),
                            truncate(coord(c.getLongitude()).isBlank() ? "-" : coord(c.getLongitude()), 11),
                            truncate(c.getTypeProjet(), 16),
                            truncate(label(STATUT_LABELS, c.getStatutChantier()), 16),
                            truncate(label(NIVEAU_OPPORTUNITE_LABELS, c.getNiveauOpportunite()), 17),
                            truncate(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "-", 17),
                            truncate(trancheText(tranche, "numero"), 8),
                            truncate(stadeTr.isBlank() ? "-" : label(STADE_LABELS, stadeTr), 15),
                            truncate(statutTr.isBlank() ? "-" : label(STATUT_LABELS, statutTr), 14),
                            trancheDate(tranche, "dateLivraisonPrevue").isBlank() ? "-" : trancheDate(tranche, "dateLivraisonPrevue"),
                            // Repli sur la valeur du chantier : la majorité des chantiers n'ont pas de tranche saisie
                            truncate(trancheText(tranche, "concurrent").isBlank()
                                    ? c.getConcurrentFerme() : trancheText(tranche, "concurrent"), 17),
                            truncate(trancheText(tranche, "robinetterie").isBlank()
                                    ? c.getRobinetterieMarque() : trancheText(tranche, "robinetterie"), 17),
                            c.getCreatedAt() != null ? DATE_FMT.format(c.getCreatedAt()) : "-",
                    };
                    y = drawTableRow(cs, fontNormal, values, y);
                }
            }
            cs.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private float drawTableHeader(PDPageContentStream cs, PDFont font, float y) throws IOException {
        return drawTableHeader(cs, font, y, PDF_COLS, PDF_WIDTHS);
    }

    private float drawTableHeader(PDPageContentStream cs, PDFont font, float y, String[] cols, float[] widths) throws IOException {
        float x = MARGIN;
        for (int i = 0; i < cols.length; i++) {
            cs.beginText();
            cs.setFont(font, 8);
            cs.newLineAtOffset(x, y);
            cs.showText(cols[i]);
            cs.endText();
            x += widths[i];
        }
        y -= 3;
        cs.setLineWidth(0.5f);
        cs.moveTo(MARGIN, y);
        cs.lineTo(PAGE_W - MARGIN, y);
        cs.stroke();
        return y - LINE_H;
    }

    private float drawTableRow(PDPageContentStream cs, PDFont font, String[] values, float y) throws IOException {
        return drawTableRow(cs, font, values, y, PDF_WIDTHS);
    }

    private float drawTableRow(PDPageContentStream cs, PDFont font, String[] values, float y, float[] widths) throws IOException {
        float x = MARGIN;
        for (int i = 0; i < values.length; i++) {
            cs.beginText();
            cs.setFont(font, 7.5f);
            cs.newLineAtOffset(x, y);
            cs.showText(values[i] != null ? values[i] : "-");
            cs.endText();
            x += widths[i];
        }
        return y - LINE_H;
    }

    private float drawText(PDPageContentStream cs, PDFont font, float size, String text, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text != null ? text : "");
        cs.endText();
        return y - (size + 4);
    }

    private String truncate(String s, int max) {
        if (s == null) return "-";
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    // ── Historique des modifications ────────────────────────────────────────

    private static final Map<String, String> HISTORY_ACTION_LABELS = Map.of(
            "CREATION", "Création",
            "MODIFICATION", "Modification"
    );

    private static final String[] HISTORY_HEADERS = {
            "Code Client", "Nom du chantier", "Représentant", "Date et heure", "Action", "Détail"
    };

    private static final String[] HISTORY_PDF_COLS = {
            "Code Client", "Nom du chantier", "Représentant", "Date et heure", "Action", "Détail"
    };
    private static final float[] HISTORY_PDF_WIDTHS = { 65f, 140f, 90f, 75f, 65f, 340f };

    /** Charge, en une seule requête, les chantiers référencés par une liste d'entrées d'historique. */
    private Map<UUID, Chantier> loadChantiersFor(List<ChantierHistory> history) {
        List<UUID> chantierIds = history.stream()
                .map(ChantierHistory::getChantierId)
                .distinct()
                .collect(Collectors.toList());
        return chantierRepository.findAllById(chantierIds).stream()
                .collect(Collectors.toMap(Chantier::getId, c -> c, (a, b) -> a, HashMap::new));
    }

    /**
     * Code client du compte lié. On privilégie le code Sage (réellement renseigné en base)
     * et on retombe sur le code client CRM lorsqu'il est saisi.
     */
    private static String codeClient(Chantier c) {
        if (c == null || c.getAccount() == null) return "";
        String sage = c.getAccount().getSageCode();
        if (sage != null && !sage.isBlank()) return sage;
        String crm = c.getAccount().getCodeClientCrm();
        return crm != null ? crm : "";
    }

    @Transactional(readOnly = true)
    public byte[] exportHistoryToExcel() throws IOException {
        List<ChantierHistory> history = chantierHistoryRepository.findAllByOrderByCreatedAtDesc();
        Map<UUID, Chantier> chantiers = loadChantiersFor(history);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Historique");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HISTORY_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HISTORY_HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 1;
            for (ChantierHistory h : history) {
                Chantier c = chantiers.get(h.getChantierId());
                Row row = sheet.createRow(rowIdx++);
                int col = 0;
                createCell(row, col++, codeClient(c), dataStyle);
                createCell(row, col++, c != null ? c.getNom() : "", dataStyle);
                createCell(row, col++, h.getActorName() != null ? h.getActorName() : "Système", dataStyle);
                createCell(row, col++, h.getCreatedAt() != null ? DATETIME_FMT.format(h.getCreatedAt()) : "", dataStyle);
                createCell(row, col++, label(HISTORY_ACTION_LABELS, h.getAction()), dataStyle);
                createCell(row, col, h.getDetails(), dataStyle);
            }

            for (int i = 0; i < HISTORY_HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportHistoryToPdf() throws IOException {
        List<ChantierHistory> history = chantierHistoryRepository.findAllByOrderByCreatedAtDesc();
        Map<UUID, Chantier> chantiers = loadChantiersFor(history);

        try (PDDocument doc = new PDDocument()) {
            PDFont fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            PDPage page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = PAGE_H - MARGIN;

            y = drawText(cs, fontBold, 14, "Historique des modifications — Chantiers", MARGIN, y);
            y -= 4;
            y = drawText(cs, fontNormal, 8, history.size() + " entrée(s) — généré le " + DATE_FMT.format(Instant.now()), MARGIN, y);
            y -= 6;
            y = drawTableHeader(cs, fontBold, y, HISTORY_PDF_COLS, HISTORY_PDF_WIDTHS);

            for (ChantierHistory h : history) {
                if (y < MARGIN + LINE_H) {
                    cs.close();
                    page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = PAGE_H - MARGIN;
                    y = drawTableHeader(cs, fontBold, y, HISTORY_PDF_COLS, HISTORY_PDF_WIDTHS);
                }
                Chantier c = chantiers.get(h.getChantierId());
                String[] values = {
                        truncate(codeClient(c), 12),
                        truncate(c != null ? c.getNom() : "-", 28),
                        truncate(h.getActorName() != null ? h.getActorName() : "Système", 18),
                        h.getCreatedAt() != null ? DATETIME_FMT.format(h.getCreatedAt()) : "-",
                        truncate(label(HISTORY_ACTION_LABELS, h.getAction()), 14),
                        truncate(h.getDetails(), 90),
                };
                y = drawTableRow(cs, fontNormal, values, y, HISTORY_PDF_WIDTHS);
            }
            cs.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
}
