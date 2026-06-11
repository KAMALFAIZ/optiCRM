package com.opticrm.api.ai;

import com.opticrm.api.ai.dto.*;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/chantier")
@RequiredArgsConstructor
public class ChantierAiController {

    private final ChantierAiService chantierAiService;

    /** Score de santé du chantier (rule-based, rapide) */
    @PostMapping("/{id}/health")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ChantierHealthResponse>> computeHealth(@PathVariable UUID id) {
        ChantierHealthResponse result = chantierAiService.computeHealthScore(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Analyse IA complète du chantier */
    @PostMapping("/{id}/analyze")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> analyzeChantier(@PathVariable UUID id) {
        String result = chantierAiService.analyzeChantier(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Chat contextuel SSE sur un chantier */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public SseEmitter streamChat(@Valid @RequestBody ChantierChatRequest request) {
        return chantierAiService.streamChantierChat(request);
    }

    /** Extraction d'informations depuis un document */
    @PostMapping("/extract-document")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ChantierExtractResponse>> extractDocument(
            @Valid @RequestBody ChantierDocumentExtractRequest request) {
        ChantierExtractResponse result = chantierAiService.extractFromDocument(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Insights géographiques sur tous les chantiers */
    @GetMapping("/geo-insights")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> getGeoInsights() {
        String result = chantierAiService.generateGeoInsights();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Extraction d'informations depuis une photo de chantier (vision IA) */
    @PostMapping(value = "/extract-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ChantierExtractResponse>> extractFromImage(
            @RequestParam("file") MultipartFile file) {
        ChantierExtractResponse result = chantierAiService.extractFromImage(file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
