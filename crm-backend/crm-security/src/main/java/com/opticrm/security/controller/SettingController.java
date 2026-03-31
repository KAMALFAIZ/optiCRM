package com.opticrm.security.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.dto.AiSettingsDto;
import com.opticrm.security.dto.SageServerConfigDto;
import com.opticrm.security.dto.SmtpSettingsDto;
import com.opticrm.security.service.SettingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class SettingController {

    private final SettingService settingService;

    @GetMapping("/smtp")
    public ResponseEntity<ApiResponse<SmtpSettingsDto>> getSmtpSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getSmtpSettings()));
    }

    @PutMapping("/smtp")
    public ResponseEntity<ApiResponse<SmtpSettingsDto>> saveSmtpSettings(
            @RequestBody SmtpSettingsDto dto
    ) {
        settingService.saveSmtpSettings(dto);
        return ResponseEntity.ok(ApiResponse.success(settingService.getSmtpSettings()));
    }

    @PostMapping("/smtp/test")
    public ResponseEntity<ApiResponse<Void>> testSmtp(
            @Valid @RequestBody SmtpTestRequest request
    ) {
        settingService.testSmtpConnection(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Data
    static class SmtpTestRequest {
        @NotBlank
        @Email
        private String email;
    }

    // ───── Sage Server ────────────────────────────────────────────────────────

    @GetMapping("/sage")
    public ResponseEntity<ApiResponse<SageServerConfigDto>> getSageConfig() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getSageServerConfig()));
    }

    @PutMapping("/sage")
    public ResponseEntity<ApiResponse<SageServerConfigDto>> saveSageConfig(
            @RequestBody SageServerConfigDto dto
    ) {
        settingService.saveSageServerConfig(dto);
        return ResponseEntity.ok(ApiResponse.success(settingService.getSageServerConfig()));
    }

    // ───── AI ─────────────────────────────────────────────────────────────────

    @GetMapping("/ai")
    public ResponseEntity<ApiResponse<AiSettingsDto>> getAiSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getAiSettings()));
    }

    @PutMapping("/ai")
    public ResponseEntity<ApiResponse<AiSettingsDto>> saveAiSettings(
            @RequestBody AiSettingsDto dto
    ) {
        settingService.saveAiSettings(dto);
        return ResponseEntity.ok(ApiResponse.success(settingService.getAiSettings()));
    }
}
