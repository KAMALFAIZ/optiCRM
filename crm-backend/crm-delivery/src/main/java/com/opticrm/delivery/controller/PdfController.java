package com.opticrm.delivery.controller;

import com.opticrm.delivery.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;

    /**
     * GET /pdf/tour/{tourId} — télécharge le bon de livraison PDF de la tournée.
     * En-tête Content-Disposition: attachment → téléchargement direct sur mobile.
     */
    @GetMapping("/tour/{tourId}")
    public ResponseEntity<byte[]> tourReceipt(@PathVariable UUID tourId) throws IOException {
        byte[] pdf = pdfService.generateTourReceipt(tourId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"bon-livraison-" + tourId.toString().substring(0, 8) + ".pdf\"")
            .body(pdf);
    }
}
