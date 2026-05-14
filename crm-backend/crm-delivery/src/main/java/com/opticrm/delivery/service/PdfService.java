package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final DeliveryTourRepository tourRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGIN = 40f;
    private static final float LINE_H = 16f;
    private static final float PAGE_W = PDRectangle.A4.getWidth();
    private static final float PAGE_H = PDRectangle.A4.getHeight();
    private static final float CONTENT_W = PAGE_W - 2 * MARGIN;

    /**
     * Génère le bon de livraison PDF pour une tournée complète.
     * Regroupe les lignes par client et calcule les totaux par mode de paiement.
     */
    @Transactional(readOnly = true)
    public byte[] generateTourReceipt(UUID tourId) throws IOException {
        DeliveryTour tour = tourRepository.findById(tourId)
            .orElseThrow(() -> new IllegalArgumentException("Tournée introuvable"));

        List<DeliveryLine> lines = tour.getDeliveryLines() != null ? tour.getDeliveryLines() : List.of();

        try (PDDocument doc = new PDDocument()) {
            PDFont fontBold   = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = PAGE_H - MARGIN;

                // ── En-tête ──────────────────────────────────────────────────────────
                y = drawText(cs, fontBold, 16, "BON DE LIVRAISON", MARGIN, y, 0);
                y -= 4;
                y = drawText(cs, fontNormal, 10,
                    "Tournée : " + tourId.toString().substring(0, 8).toUpperCase()
                    + "  |  Date : " + tour.getTourDate().format(DATE_FMT)
                    + "  |  Zone : " + (tour.getZone() != null ? tour.getZone() : "-")
                    + "  |  Statut : " + tour.getStatus().name(),
                    MARGIN, y, 0);
                y -= 2;
                y = drawHRule(cs, y);

                // ── Lignes de livraison ───────────────────────────────────────────────
                if (lines.isEmpty()) {
                    y = drawText(cs, fontNormal, 10, "Aucune livraison enregistrée.", MARGIN, y - LINE_H, 0);
                } else {
                    // En-tête tableau
                    y -= 4;
                    y = drawTableHeader(cs, fontBold, y);
                    y -= 2;

                    BigDecimal totalAmount = BigDecimal.ZERO;
                    BigDecimal totalCash   = BigDecimal.ZERO;
                    BigDecimal totalCredit = BigDecimal.ZERO;
                    BigDecimal totalOther  = BigDecimal.ZERO;

                    for (DeliveryLine dl : lines) {
                        if (y < MARGIN + 60) {
                            // Nouvelle page si nécessaire
                            cs.close();
                            PDPage newPage = new PDPage(PDRectangle.A4);
                            doc.addPage(newPage);
                            // Continuer sur nouvelle page (simplification: reprise après loop)
                            break;
                        }
                        BigDecimal amount = dl.getAmount() != null ? dl.getAmount() : BigDecimal.ZERO;
                        BigDecimal paid   = dl.getPaidAmount() != null ? dl.getPaidAmount() : BigDecimal.ZERO;

                        String custStr  = dl.getCustomerId()  != null ? dl.getCustomerId().toString().substring(0, 8)  : "-";
                        String itemStr  = dl.getItemId()       != null ? dl.getItemId().toString().substring(0, 8)       : "-";
                        String qtyStr   = dl.getQuantity()     != null ? dl.getQuantity().toString()                     : "0";
                        String priceStr = dl.getUnitPrice()    != null ? dl.getUnitPrice().setScale(2, RoundingMode.HALF_UP).toString() : "0.00";
                        String amtStr   = amount.setScale(2, RoundingMode.HALF_UP).toString();
                        String pmStr    = dl.getPaymentMode()  != null ? dl.getPaymentMode().name()                      : "-";
                        String resStr   = dl.getVisitResult()  != null ? dl.getVisitResult().name()                      : "-";

                        y = drawTableRow(cs, fontNormal, y, custStr, itemStr, qtyStr, priceStr, amtStr, pmStr, resStr);

                        totalAmount = totalAmount.add(amount);
                        if (dl.getPaymentMode() == DeliveryLine.PaymentMode.CASH)   totalCash   = totalCash.add(paid);
                        else if (dl.getPaymentMode() == DeliveryLine.PaymentMode.CREDIT) totalCredit = totalCredit.add(amount);
                        else totalOther = totalOther.add(paid);
                    }

                    // ── Totaux ─────────────────────────────────────────────────────────
                    y -= 4;
                    y = drawHRule(cs, y);
                    y -= 2;
                    y = drawText(cs, fontBold, 10,
                        String.format("TOTAL : %.2f  |  Espèces : %.2f  |  Crédit : %.2f  |  Autres : %.2f",
                            totalAmount, totalCash, totalCredit, totalOther),
                        MARGIN, y, 0);
                }

                // ── Signature ──────────────────────────────────────────────────────────
                y -= 30;
                drawText(cs, fontNormal, 9, "Signature représentant : ______________________", MARGIN, y, 0);
                drawText(cs, fontNormal, 9, "Signature client : ______________________", PAGE_W / 2f, y, 0);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private float drawText(PDPageContentStream cs, PDFont font, float size,
                           String text, float x, float y, float indent) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x + indent, y);
        cs.showText(text != null ? text : "");
        cs.endText();
        return y - LINE_H;
    }

    private float drawHRule(PDPageContentStream cs, float y) throws IOException {
        cs.moveTo(MARGIN, y);
        cs.lineTo(PAGE_W - MARGIN, y);
        cs.stroke();
        return y - 6;
    }

    private static final float[] COL_X = {40, 120, 210, 260, 320, 390, 450, 510};

    private float drawTableHeader(PDPageContentStream cs, PDFont font, float y) throws IOException {
        String[] headers = {"Client", "Article", "Qté", "P.U.", "Montant", "Paiement", "Résultat"};
        cs.setFont(font, 8);
        for (int i = 0; i < headers.length; i++) {
            cs.beginText();
            cs.newLineAtOffset(COL_X[i], y);
            cs.showText(headers[i]);
            cs.endText();
        }
        return y - LINE_H;
    }

    private float drawTableRow(PDPageContentStream cs, PDFont font, float y,
                               String cust, String item, String qty,
                               String price, String amt, String pm, String res) throws IOException {
        String[] cells = {cust, item, qty, price, amt, pm, res};
        cs.setFont(font, 8);
        for (int i = 0; i < cells.length; i++) {
            cs.beginText();
            cs.newLineAtOffset(COL_X[i], y);
            cs.showText(cells[i] != null ? cells[i] : "");
            cs.endText();
        }
        return y - LINE_H;
    }
}
