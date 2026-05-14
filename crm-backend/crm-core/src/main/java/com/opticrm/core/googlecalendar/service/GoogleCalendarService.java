package com.opticrm.core.googlecalendar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.opticrm.core.googlecalendar.config.GoogleCalendarProperties;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarConfigDto;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarEventDto;
import com.opticrm.core.googlecalendar.dto.GoogleCalendarStatusDto;
import com.opticrm.core.googlecalendar.entity.GoogleCalendarCredential;
import com.opticrm.core.googlecalendar.repository.GoogleCalendarCredentialRepository;
import com.opticrm.security.service.SettingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class GoogleCalendarService {

    private static final String AUTH_ENDPOINT   = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT  = "https://oauth2.googleapis.com/token";
    private static final String REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
    private static final String USERINFO_URL    = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String CALENDAR_API    = "https://www.googleapis.com/calendar/v3";
    private static final String STATE_PREFIX    = "gc_oauth_state:";

    private final GoogleCalendarProperties             props;
    private final GoogleCalendarCredentialRepository   credRepo;
    private final StringRedisTemplate                  redis;
    private final RestTemplate                         restTemplate;
    private final SettingService                       settingService;

    public GoogleCalendarService(
            GoogleCalendarProperties props,
            GoogleCalendarCredentialRepository credRepo,
            StringRedisTemplate redis,
            @Qualifier("googleCalendarRestTemplate") RestTemplate restTemplate,
            SettingService settingService) {
        this.props          = props;
        this.credRepo       = credRepo;
        this.redis          = redis;
        this.restTemplate   = restTemplate;
        this.settingService = settingService;
    }

    // ─── Config helpers (DB prioritaire sur application.yml) ─────────────────

    private String cfgClientId() {
        String db = settingService.getGoogleCalendarValue("google.calendar.client_id", "");
        return db.isBlank() ? props.getClientId() : db;
    }

    private String cfgClientSecret() {
        String db = settingService.getGoogleCalendarValue("google.calendar.client_secret", "");
        return db.isBlank() ? props.getClientSecret() : db;
    }

    private String cfgRedirectUri() {
        String db = settingService.getGoogleCalendarValue("google.calendar.redirect_uri", "");
        return db.isBlank() ? props.getRedirectUri() : db;
    }

    public String getFrontendBaseUrl() {
        String db = settingService.getGoogleCalendarValue("google.calendar.frontend_base_url", "");
        return db.isBlank() ? props.getFrontendBaseUrl() : db;
    }

    public GoogleCalendarConfigDto getConfig() {
        Map<String, String> raw = settingService.getGoogleCalendarConfig();
        return GoogleCalendarConfigDto.builder()
                .clientId(raw.getOrDefault("clientId", ""))
                .clientSecret(raw.getOrDefault("clientSecret", ""))   // masqué
                .redirectUri(raw.getOrDefault("redirectUri",
                        props.getRedirectUri()))
                .frontendBaseUrl(raw.getOrDefault("frontendBaseUrl",
                        props.getFrontendBaseUrl()))
                .secretConfigured(Boolean.parseBoolean(raw.getOrDefault("secretConfigured", "false")))
                .configured(Boolean.parseBoolean(raw.getOrDefault("configured", "false")))
                .build();
    }

    @Transactional
    public GoogleCalendarConfigDto saveConfig(GoogleCalendarConfigDto dto) {
        settingService.saveGoogleCalendarConfig(
                dto.getClientId(), dto.getClientSecret(),
                dto.getRedirectUri(), dto.getFrontendBaseUrl());
        return getConfig();
    }

    // ─── OAuth2 ──────────────────────────────────────────────────────────────

    public boolean isConfigured() {
        return !cfgClientId().isBlank() && !cfgClientSecret().isBlank();
    }

    public String buildAuthorizationUrl(UUID userId) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google Calendar n'est pas configuré. Renseignez le Client ID et le Client Secret dans Paramètres → Intégrations.");
        }
        String state = UUID.randomUUID().toString();
        redis.opsForValue().set(STATE_PREFIX + state, userId.toString(), 10, TimeUnit.MINUTES);

        return UriComponentsBuilder.fromUriString(AUTH_ENDPOINT)
                .queryParam("client_id",     cfgClientId())
                .queryParam("redirect_uri",  cfgRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope",
                        "https://www.googleapis.com/auth/calendar.events " +
                        "https://www.googleapis.com/auth/userinfo.email openid")
                .queryParam("access_type",   "offline")
                .queryParam("prompt",        "consent")
                .queryParam("state",         state)
                .build().toUriString();
    }

    @Transactional
    public void handleOAuthCallback(String code, String state) {
        String userIdStr = redis.opsForValue().get(STATE_PREFIX + state);
        if (userIdStr == null) {
            throw new IllegalArgumentException("State OAuth2 invalide ou expiré");
        }
        redis.delete(STATE_PREFIX + state);
        UUID userId = UUID.fromString(userIdStr);

        // Exchange authorization code for tokens
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code",          code);
        body.add("client_id",     cfgClientId());
        body.add("client_secret", cfgClientSecret());
        body.add("redirect_uri",  cfgRedirectUri());
        body.add("grant_type",    "authorization_code");

        ResponseEntity<JsonNode> resp = restTemplate.exchange(
                TOKEN_ENDPOINT, HttpMethod.POST,
                new HttpEntity<>(body, headers), JsonNode.class);

        JsonNode tokens = resp.getBody();
        if (tokens == null || tokens.has("error")) {
            String err = tokens != null ? tokens.path("error_description").asText("unknown") : "null response";
            throw new RuntimeException("Échec de l'échange de code Google: " + err);
        }

        String accessToken  = tokens.get("access_token").asText();
        String refreshToken = tokens.has("refresh_token") ? tokens.get("refresh_token").asText() : null;
        long   expiresIn    = tokens.has("expires_in")    ? tokens.get("expires_in").asLong() : 3600L;
        long   tokenExpiry  = Instant.now().plusSeconds(expiresIn).toEpochMilli();
        String googleEmail  = fetchGoogleEmail(accessToken);

        GoogleCalendarCredential cred = credRepo.findByUserId(userId)
                .orElse(new GoogleCalendarCredential());
        cred.setUserId(userId);
        cred.setAccessToken(accessToken);
        if (refreshToken != null) cred.setRefreshToken(refreshToken);
        cred.setTokenExpiry(tokenExpiry);
        cred.setGoogleEmail(googleEmail);
        cred.setSyncEnabled(true);
        credRepo.save(cred);

        log.info("Google Calendar connecté pour userId={} ({})", userId, googleEmail);
    }

    // ─── Status / Disconnect ─────────────────────────────────────────────────

    public GoogleCalendarStatusDto getStatus(UUID userId) {
        return credRepo.findByUserId(userId)
                .map(c -> new GoogleCalendarStatusDto(
                        true, c.getGoogleEmail(), c.getCalendarId(),
                        Boolean.TRUE.equals(c.getSyncEnabled())))
                .orElse(new GoogleCalendarStatusDto(false, null, null, false));
    }

    @Transactional
    public void disconnect(UUID userId) {
        credRepo.findByUserId(userId).ifPresent(cred -> {
            try {
                restTemplate.getForObject(REVOKE_ENDPOINT + "?token=" + cred.getAccessToken(), String.class);
            } catch (Exception e) {
                log.warn("Révocation token Google échouée (ignorée): {}", e.getMessage());
            }
            credRepo.deleteByUserId(userId);
        });
    }

    // ─── Calendar Events ─────────────────────────────────────────────────────

    public List<GoogleCalendarEventDto> getEvents(UUID userId, Instant from, Instant to) {
        GoogleCalendarCredential cred = credRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Google Calendar non connecté"));

        String token      = ensureFreshToken(cred);
        String calendarId = calendarId(cred);

        String url = UriComponentsBuilder
                .fromUriString(CALENDAR_API + "/calendars/{cal}/events")
                .queryParam("timeMin",      from.toString())
                .queryParam("timeMax",      to.toString())
                .queryParam("singleEvents", "true")
                .queryParam("orderBy",      "startTime")
                .queryParam("maxResults",   "200")
                .buildAndExpand(calendarId)
                .toUriString();

        ResponseEntity<JsonNode> resp = restTemplate.exchange(
                url, HttpMethod.GET, bearerEntity(token), JsonNode.class);

        List<GoogleCalendarEventDto> events = new ArrayList<>();
        if (resp.getBody() != null && resp.getBody().has("items")) {
            for (JsonNode item : resp.getBody().get("items")) {
                events.add(toDto(item));
            }
        }
        return events;
    }

    // ─── Push activity to Google Calendar ────────────────────────────────────

    public String createEvent(UUID userId, String title, String description,
                              String location, Instant start, Instant end) {
        GoogleCalendarCredential cred = credRepo.findByUserId(userId).orElse(null);
        if (cred == null || !Boolean.TRUE.equals(cred.getSyncEnabled())) return null;

        String token      = ensureFreshToken(cred);
        String calendarId = calendarId(cred);

        HttpHeaders headers = jsonBearer(token);
        ResponseEntity<JsonNode> resp = restTemplate.exchange(
                CALENDAR_API + "/calendars/" + calendarId + "/events",
                HttpMethod.POST,
                new HttpEntity<>(eventPayload(title, description, location, start, end), headers),
                JsonNode.class);

        return resp.getBody() != null ? resp.getBody().path("id").asText(null) : null;
    }

    public void updateEvent(UUID userId, String googleEventId, String title,
                            String description, String location, Instant start, Instant end) {
        GoogleCalendarCredential cred = credRepo.findByUserId(userId).orElse(null);
        if (cred == null || !Boolean.TRUE.equals(cred.getSyncEnabled())) return;

        String token      = ensureFreshToken(cred);
        String calendarId = calendarId(cred);

        restTemplate.exchange(
                CALENDAR_API + "/calendars/" + calendarId + "/events/" + googleEventId,
                HttpMethod.PUT,
                new HttpEntity<>(eventPayload(title, description, location, start, end), jsonBearer(token)),
                JsonNode.class);
    }

    public void deleteEvent(UUID userId, String googleEventId) {
        GoogleCalendarCredential cred = credRepo.findByUserId(userId).orElse(null);
        if (cred == null || googleEventId == null) return;

        String token      = ensureFreshToken(cred);
        String calendarId = calendarId(cred);
        try {
            restTemplate.exchange(
                    CALENDAR_API + "/calendars/" + calendarId + "/events/" + googleEventId,
                    HttpMethod.DELETE, bearerEntity(token), Void.class);
        } catch (Exception e) {
            log.warn("Suppression événement Google Calendar {} échouée: {}", googleEventId, e.getMessage());
        }
    }

    // ─── Token refresh ───────────────────────────────────────────────────────

    private String ensureFreshToken(GoogleCalendarCredential cred) {
        if (cred.getTokenExpiry() != null &&
                Instant.now().plusSeconds(60).isBefore(Instant.ofEpochMilli(cred.getTokenExpiry()))) {
            return cred.getAccessToken();
        }
        return refreshToken(cred);
    }

    @Transactional
    private String refreshToken(GoogleCalendarCredential cred) {
        if (cred.getRefreshToken() == null) {
            throw new IllegalStateException("Aucun refresh token disponible — reconnectez Google Calendar");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("refresh_token", cred.getRefreshToken());
        body.add("client_id",     cfgClientId());
        body.add("client_secret", cfgClientSecret());
        body.add("grant_type",    "refresh_token");

        ResponseEntity<JsonNode> resp = restTemplate.exchange(
                TOKEN_ENDPOINT, HttpMethod.POST,
                new HttpEntity<>(body, headers), JsonNode.class);

        JsonNode tokens = resp.getBody();
        if (tokens == null || tokens.has("error")) {
            throw new RuntimeException("Échec du renouvellement du token Google");
        }

        String newToken  = tokens.get("access_token").asText();
        long   expiresIn = tokens.has("expires_in") ? tokens.get("expires_in").asLong() : 3600L;
        cred.setAccessToken(newToken);
        cred.setTokenExpiry(Instant.now().plusSeconds(expiresIn).toEpochMilli());
        credRepo.save(cred);
        return newToken;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String fetchGoogleEmail(String accessToken) {
        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    USERINFO_URL, HttpMethod.GET, bearerEntity(accessToken), JsonNode.class);
            return resp.getBody() != null ? resp.getBody().path("email").asText(null) : null;
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'email Google: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> eventPayload(String title, String description,
                                              String location, Instant start, Instant end) {
        Map<String, Object> event = new HashMap<>();
        event.put("summary", title);
        if (description != null) event.put("description", description);
        if (location    != null) event.put("location",    location);

        Map<String, String> startMap = new HashMap<>();
        startMap.put("dateTime", start.toString());
        startMap.put("timeZone", "Africa/Casablanca");
        event.put("start", startMap);

        Map<String, String> endMap = new HashMap<>();
        endMap.put("dateTime", (end != null ? end : start.plusSeconds(3600)).toString());
        endMap.put("timeZone", "Africa/Casablanca");
        event.put("end", endMap);

        return event;
    }

    private GoogleCalendarEventDto toDto(JsonNode item) {
        GoogleCalendarEventDto dto = new GoogleCalendarEventDto();
        dto.setId(item.path("id").asText());
        dto.setTitle(item.path("summary").asText("Sans titre"));
        dto.setDescription(item.path("description").asText(null));
        dto.setLocation(item.path("location").asText(null));
        dto.setHtmlLink(item.path("htmlLink").asText(null));
        dto.setSource("google");

        JsonNode start = item.path("start");
        dto.setStart(start.has("dateTime") ? start.get("dateTime").asText() : start.path("date").asText());

        JsonNode end = item.path("end");
        dto.setEnd(end.has("dateTime") ? end.get("dateTime").asText() : end.path("date").asText());

        return dto;
    }

    private HttpEntity<Void> bearerEntity(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return new HttpEntity<>(h);
    }

    private HttpHeaders jsonBearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    private String calendarId(GoogleCalendarCredential cred) {
        return cred.getCalendarId() != null ? cred.getCalendarId() : "primary";
    }
}
