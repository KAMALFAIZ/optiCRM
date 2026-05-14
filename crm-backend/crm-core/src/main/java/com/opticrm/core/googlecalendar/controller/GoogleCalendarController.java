package com.opticrm.core.googlecalendar.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarConfigDto;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarEventDto;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarStatusDto;
import com.opticrm.core.googlecalendar.service.GoogleCalendarService;
import com.opticrm.security.config.ContextUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/google-calendar")
@RequiredArgsConstructor
public class GoogleCalendarController {

    private final GoogleCalendarService googleCalendarService;

    // ─── Configuration (ADMIN) ───────────────────────────────────────────────

    /** Lire la configuration Google OAuth2 (Client ID, URI de redirection…) */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoogleCalendarConfigDto>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(googleCalendarService.getConfig()));
    }

    /** Sauvegarder la configuration Google OAuth2 */
    @PutMapping("/config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoogleCalendarConfigDto>> saveConfig(
            @Valid @RequestBody GoogleCalendarConfigDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.success(googleCalendarService.saveConfig(dto)));
    }

    // ─── OAuth2 ──────────────────────────────────────────────────────────────

    /** Étape 1 : Frontend demande l'URL Google OAuth2 */
    @GetMapping("/auth-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAuthUrl() {
        UUID userId = currentUserId();
        String url = googleCalendarService.buildAuthorizationUrl(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    /**
     * Étape 2 : Google redirige ici après consentement.
     * Endpoint public — pas de JWT dans la requête Google.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error
    ) {
        String frontendBase = googleCalendarService.getFrontendBaseUrl();

        if (error != null || code == null) {
            return redirect(frontendBase + "/settings?tab=integrations&google_calendar=error&reason="
                    + (error != null ? error : "missing_code"));
        }
        try {
            googleCalendarService.handleOAuthCallback(code, state);
            return redirect(frontendBase + "/settings?tab=integrations&google_calendar=success");
        } catch (Exception e) {
            return redirect(frontendBase + "/settings?tab=integrations&google_calendar=error");
        }
    }

    /** Statut de la connexion pour l'utilisateur courant */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<GoogleCalendarStatusDto>> getStatus() {
        GoogleCalendarStatusDto status = googleCalendarService.getStatus(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /** Déconnecter Google Calendar */
    @DeleteMapping("/disconnect")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> disconnect() {
        googleCalendarService.disconnect(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Récupère les événements Google Calendar sur une plage de dates */
    @GetMapping("/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<GoogleCalendarEventDto>>> getEvents(
            @RequestParam Instant from,
            @RequestParam Instant to
    ) {
        List<GoogleCalendarEventDto> events = googleCalendarService.getEvents(currentUserId(), from, to);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private UUID currentUserId() {
        return ContextUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Utilisateur non authentifié"));
    }

    private ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(302).location(URI.create(url)).build();
    }
}
