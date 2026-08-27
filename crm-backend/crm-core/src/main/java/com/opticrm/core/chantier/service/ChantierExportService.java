package com.opticrm.core.chantier.service;

import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.entity.ChantierActeur;
import com.opticrm.core.chantier.repository.ChantierRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Export de la liste des chantiers en Excel et PDF.
 * Les coordonnees GPS (latitude / longitude) figurent dans les deux formats.
 */
@Service
@RequiredArgsConstructor
public class ChantierExportService {

    private final ChantierRepository chantierRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("Africa/Casablanca"));
    private static final DateTimeFormatter LOCAL_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> STADE_LABELS = Map.of(
            "ETUDE_CONCEPTION", "Étude / Conception",
            "AUTORISATION", "Autorisation",
            "GROS_OEUVRE", "Gros œuvre",
            "SECOND_OEUVRE", "Second œuvre",
            "PHASE_EQUIPEMENT", "Phase équipement",
            "LIVRAISON", "Livraison",
            "CLOTURE", "Clôturé"
    );

    private static final Map<String, String> STATUT_LABELS = Map.of(
            "ACTIF", "Actif",
            "PRIORITAIRE", "Prioritaire",
            "GAGNE", "Gagné",
            "PERDU", "Perdu"
    );

    private static final Map<String, String> NIVEAU_OPPORTUNITE_LABELS = Map.of(
            "FERME", "Fermé",
            "PARTIELLEMENT_OUVERT", "Partiellement ouvert",
            "LIBRE", "Libre / influençable"
    );

    private static final Map<String, String> ROLE_ACTEUR_LABELS = Map.of(
            "PROMOTEUR", "Promoteur",
            "ARCHITECTE", "Architecte",
            "BUREAU_ETUDES", "Bureau d'études",
            "ENTREPRISE_GENERALE", "Entreprise générale",
            "INSTALLATEUR_PLOMBIER", "Installateur/Plombier"
    );

    /** Traduit un code en libelle ; tolere null (Map.getOrDefault refuse une cle nulle ici). */
    private static String label(Map<String, String> labels, String code) {
        if (code == null || code.isBlank()) return "";
        return labels.getOrDefault(code, code);
    }

    /** Coordonnee GPS en texte, sans zeros de fin ; vide si absente. */
    private static String coord(BigDecimal v) {
        return v == null ? "" : v.stripTrailingZeros().toPlainString();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /** Concatene les acteurs sous la forme "Role: Nom (Telephone)". */
    private static String formatActeurs(Chantier c) {
        if (c.getActeurs() == null || c.getActeurs().isEmpty()) return "";
        return c.getActeurs().stream()
                .map(ChantierExportService::formatActeur)
                .collect(Collectors.joining(", "));
    }

    private static String formatActeur(ChantierActeur a) {
        String base = label(ROLE_ACTEUR_LABELS, a.getRoleActeur()) + ": " + nullToEmpty(a.getNom());
        return (a.getTelephone() != null && !a.getTelephone().isBlank())
                ? base + " (" + a.getTelephone() + ")"
                : base;
    }

    /**
     * Applique les memes filtres que la liste. Le volume de chantiers tient en memoire,
     * on filtre donc en Java plutot qu'en JPQL avec des parametres optionnels.
     */
    private List<Chantier> loadFiltered(String search, String stadeChantier, String statutChantier,
                                        String typeProjet, String assignedToId, String accountId,
                                        Boolean temoin) {
        String q = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();

        return chantierRepository.findAllForExport().stream()
                .filter(c -> q == null
                        || contains(c.getNom(), q)
                        || contains(c.getVille(), q)
                        || contains(c.getPrefecture(), q))
                .filter(c -> stadeChantier == null || stadeChantier.equals(c.getStadeChantier()))
                .filter(c -> statutChantier == null || statutChantier.equals(c.getStatutChantier()))
                .filter(c -> typeProjet == null || typeProjet.equals(c.getTypeProjet()))
                .filter(c -> temoin == null || temoin.equals(c.getTemoin()))
                .filter(c -> assignedToId == null
                        || (c.getAssignedTo() != null && assignedToId.equals(c.getAssignedTo().getId().toString())))
                .filter(c -> accountId == null
                        || (c.getAccount() != null && accountId.equals(c.getAccount().getId().toString())))
                .collect(Collectors.toList());
    }

    private static boolean contains(String value, String lowercaseNeedle) {
        return value != null && value.toLowerCase().contains(lowercaseNeedle);
    }

    // ── Excel ────────────────────────────────────────────────────────────────

    private static final String[] HEADERS = {
            "Nom du chantier", "Compte", "Ville", "Préfecture / Province",
            "Latitude", "Longitude", "Adresse",
            "Type de projet", "Sous-type", "Nombre d'unités", "Segment taille",
            "Stade", "Statut commercial", "Opportunité", "Concurrent", "Déciseur",
            "Promoteur", "Installateur", "Représentant", "Acteurs", "Témoin",
            "Prochaine action", "Date prochaine action", "Date de création"
    };

    @Transactional(readOnly = true)
    public byte[] exportToExcel(String search, String stadeChantier, String statutChantier,
                                String typeProjet, String assignedToId, String accountId,
                                Boolean temoin) throws IOException {

        List<Chantier> chantiers = loadFiltered(search, stadeChantier, statutChantier,
                typeProjet, assignedToId, accountId, temoin);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Chantiers");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyBorders(headerStyle);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle dataStyle = workbook.createCellStyle();
            applyBorders(dataStyle);

            int rowIdx = 1;
            for (Chantier c : chantiers) {
                Row row = sheet.createRow(rowIdx++);
                int col = 0;
                createCell(row, col++, c.getNom(), dataStyle);
                createCell(row, col++, c.getAccount() != null ? c.getAccount().getName() : "", dataStyle);
                createCell(row, col++, c.getVille(), dataStyle);
                createCell(row, col++, c.getPrefecture(), dataStyle);
                createCell(row, col++, coord(c.getLatitude()), dataStyle);
                createCell(row, col++, coord(c.getLongitude()), dataStyle);
                createCell(row, col++, c.getAdresse(), dataStyle);
                createCell(row, col++, c.getTypeProjet(), dataStyle);
                createCell(row, col++, c.getSousTypeProjet(), dataStyle);
                createCell(row, col++, c.getNombreUnites() != null ? c.getNombreUnites().toString() : "", dataStyle);
                createCell(row, col++, c.getSegmentTaille(), dataStyle);
                createCell(row, col++, label(STADE_LABELS, c.getStadeChantier()), dataStyle);
                createCell(row, col++, label(STATUT_LABELS, c.getStatutChantier()), dataStyle);
                createCell(row, col++, label(NIVEAU_OPPORTUNITE_LABELS, c.getNiveauOpportunite()), dataStyle);
                createCell(row, col++, c.getConcurrentFerme(), dataStyle);
                createCell(row, col++, c.getDeciseur(), dataStyle);
                createCell(row, col++, c.getPromoteur(), dataStyle);
                createCell(row, col++, c.getInstallateur(), dataStyle);
                createCell(row, col++, c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "", dataStyle);
                createCell(row, col++, formatActeurs(c), dataStyle);
                createCell(row, col++, Boolean.TRUE.equals(c.getTemoin()) ? "Oui" : "Non", dataStyle);
                createCell(row, col++, c.getActionSuivante(), dataStyle);
                createCell(row, col++, c.getDateProchaineAction() != null
                        ? c.getDateProchaineAction().format(LOCAL_DATE_FMT) : "", dataStyle);
                createCell(row, col, c.getCreatedAt() != null ? DATE_FMT.format(c.getCreatedAt()) : "", dataStyle);
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static void applyBorders(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
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
            "Nom du chantier", "Ville", "Latitude", "Longitude", "Type",
            "Stade", "Statut", "Opportunité", "Unités", "Représentant", "Créé le"
    };
    // Somme = 770 pt, tient dans les 782 pt utiles d'une A4 paysage (marges 30 pt).
    private static final float[] PDF_WIDTHS = { 120f, 70f, 55f, 55f, 70f, 75f, 65f, 80f, 40f, 85f, 55f };

    @Transactional(readOnly = true)
    public byte[] exportToPdf(String search, String stadeChantier, String statutChantier,
                              String typeProjet, String assignedToId, String accountId,
                              Boolean temoin) throws IOException {

        List<Chantier> chantiers = loadFiltered(search, stadeChantier, statutChantier,
                typeProjet, assignedToId, accountId, temoin);

        try (PDDocument doc = new PDDocument()) {
            PDFont fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            PDPage page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = PAGE_H - MARGIN;

            y = drawText(cs, fontBold, 14, "Liste des chantiers", MARGIN, y);
            y -= 4;
            y = drawText(cs, fontNormal, 8,
                    chantiers.size() + " chantier(s) - généré le " + DATE_FMT.format(Instant.now()), MARGIN, y);
            y -= 6;
            y = drawTableHeader(cs, fontBold, y);

            for (Chantier c : chantiers) {
                if (y < MARGIN + LINE_H) {
                    cs.close();
                    page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = PAGE_H - MARGIN;
                    y = drawTableHeader(cs, fontBold, y);
                }
                String[] values = {
                        truncate(c.getNom(), 32),
                        truncate(c.getVille(), 18),
                        dashIfBlank(coord(c.getLatitude())),
                        dashIfBlank(coord(c.getLongitude())),
                        truncate(c.getTypeProjet(), 18),
                        truncate(label(STADE_LABELS, c.getStadeChantier()), 20),
                        truncate(label(STATUT_LABELS, c.getStatutChantier()), 16),
                        truncate(label(NIVEAU_OPPORTUNITE_LABELS, c.getNiveauOpportunite()), 21),
                        c.getNombreUnites() != null ? c.getNombreUnites().toString() : "-",
                        truncate(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : null, 22),
                        c.getCreatedAt() != null ? DATE_FMT.format(c.getCreatedAt()) : "-",
                };
                y = drawTableRow(cs, fontNormal, values, y);
            }
            cs.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static String dashIfBlank(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    /** Caracteres non-ASCII representables par Helvetica (encodage WinAnsi). */
    private static final String WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

    /**
     * Helvetica/WinAnsi ne couvre pas tout Unicode : showText leve une exception sur un
     * caractere non encodable, ce qui ferait echouer l'export entier. On remplace ces
     * caracteres plutot que de perdre le document.
     */
    private static String pdfSafe(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length());
        for (char ch : s.toCharArray()) {
            if (ch == '\n' || ch == '\r' || ch == '\t') {
                sb.append(' ');
            } else if ((ch >= 32 && ch <= 126) || (ch >= 160 && ch <= 255) || WINANSI_EXTRA.indexOf(ch) >= 0) {
                sb.append(ch);
            } else {
                sb.append('?');
            }
        }
        return sb.toString();
    }

    private float drawTableHeader(PDPageContentStream cs, PDFont font, float y) throws IOException {
        float x = MARGIN;
        for (int i = 0; i < PDF_COLS.length; i++) {
            cs.beginText();
            cs.setFont(font, 8);
            cs.newLineAtOffset(x, y);
            cs.showText(pdfSafe(PDF_COLS[i]));
            cs.endText();
            x += PDF_WIDTHS[i];
        }
        y -= 3;
        cs.setLineWidth(0.5f);
        cs.moveTo(MARGIN, y);
        cs.lineTo(PAGE_W - MARGIN, y);
        cs.stroke();
        return y - LINE_H;
    }

    private float drawTableRow(PDPageContentStream cs, PDFont font, String[] values, float y) throws IOException {
        float x = MARGIN;
        for (int i = 0; i < values.length; i++) {
            cs.beginText();
            cs.setFont(font, 7.5f);
            cs.newLineAtOffset(x, y);
            cs.showText(pdfSafe(values[i] != null ? values[i] : "-"));
            cs.endText();
            x += PDF_WIDTHS[i];
        }
        return y - LINE_H;
    }

    private float drawText(PDPageContentStream cs, PDFont font, float size, String text, float x, float y)
            throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(pdfSafe(text));
        cs.endText();
        return y - (size + 4);
    }

    private String truncate(String s, int max) {
        if (s == null || s.isBlank()) return "-";
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }
}
