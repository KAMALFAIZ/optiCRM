package com.opticrm.api.ai;

import com.opticrm.api.ai.dto.*;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public SseEmitter streamChat(@Valid @RequestBody ChatRequest request) {
        return aiService.streamChat(request);
    }

    @PostMapping("/generate-email")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> generateEmail(@Valid @RequestBody GenerateEmailRequest request) {
        String result = aiService.generateEmail(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/analyze-lead")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> analyzeLead(@Valid @RequestBody AnalyzeLeadRequest request) {
        String result = aiService.analyzeLead(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/analyze-opportunity")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> analyzeOpportunity(@Valid @RequestBody AnalyzeOpportunityRequest request) {
        String result = aiService.analyzeOpportunity(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/analyze-account")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> analyzeAccount(@Valid @RequestBody AnalyzeAccountRequest request) {
        String result = aiService.analyzeAccount(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/generate-sales-insights")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> generateSalesInsights(@Valid @RequestBody GenerateSalesInsightsRequest request) {
        String result = aiService.generateSalesInsights(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/summarize-pipeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> summarizePipeline(@Valid @RequestBody SummarizePipelineRequest request) {
        String result = aiService.summarizePipeline(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/suggest-follow-ups")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> suggestFollowUps(@Valid @RequestBody SuggestFollowUpsRequest request) {
        String result = aiService.suggestFollowUps(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/generate-meeting-summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> generateMeetingSummary(@Valid @RequestBody GenerateMeetingSummaryRequest request) {
        String result = aiService.generateMeetingSummary(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/smart-search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> smartSearch(@Valid @RequestBody SmartSearchRequest request) {
        String result = aiService.smartSearch(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ─── P1 : Nouvelles fonctionnalités IA ─────────────────────────────

    @PostMapping("/account-summary-360")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> accountSummary360(@Valid @RequestBody AccountSummary360Request request) {
        String result = aiService.accountSummary360(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/lead-scoring-ai")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<String>> leadScoringAi(@Valid @RequestBody LeadScoringAiRequest request) {
        String result = aiService.leadScoringAi(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/classify-ticket")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ClassifyTicketResponse>> classifyTicket(@Valid @RequestBody ClassifyTicketRequest request) {
        ClassifyTicketResponse result = aiService.classifyTicket(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/test")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> testConnection() {
        aiService.testConnection();
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
