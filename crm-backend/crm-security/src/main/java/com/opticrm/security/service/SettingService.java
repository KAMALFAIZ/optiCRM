package com.opticrm.security.service;

import com.opticrm.common.exception.BusinessException;
import com.opticrm.security.dto.AiSettingsDto;
import com.opticrm.security.dto.SageAutoSyncConfigDto;
import com.opticrm.security.dto.SageServerConfigDto;
import com.opticrm.security.dto.SmtpSettingsDto;
import com.opticrm.security.entity.AppSetting;
import com.opticrm.security.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Properties;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingService {

    private static final String MASKED = "••••••••";

    private final AppSettingRepository repository;

    // ───── Lecture/Écriture clé-valeur ─────────────────────────────────────

    private String get(String key, String defaultValue) {
        return repository.findById(key)
                .map(AppSetting::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(defaultValue);
    }

    private void set(String key, String value, String category) {
        AppSetting setting = repository.findById(key)
                .orElse(new AppSetting(key, value, category));
        setting.setValue(value);
        repository.save(setting);
    }

    // ───── SMTP ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SmtpSettingsDto getSmtpSettings() {
        boolean passwordSet = repository.findById("smtp.password")
                .map(s -> s.getValue() != null && !s.getValue().isBlank())
                .orElse(false);

        return SmtpSettingsDto.builder()
                .enabled(Boolean.parseBoolean(get("smtp.enabled", "false")))
                .host(get("smtp.host", ""))
                .port(parsePort(get("smtp.port", "587")))
                .username(get("smtp.username", ""))
                .password(passwordSet ? MASKED : "")
                .from(get("smtp.from", "noreply@opticrm.ma"))
                .fromName(get("smtp.from_name", "OptiCRM"))
                .starttls(Boolean.parseBoolean(get("smtp.starttls", "true")))
                .auth(Boolean.parseBoolean(get("smtp.auth", "true")))
                .build();
    }

    @Transactional
    public void saveSmtpSettings(SmtpSettingsDto dto) {
        set("smtp.enabled",   String.valueOf(dto.isEnabled()),   "smtp");
        set("smtp.host",      nullSafe(dto.getHost()),           "smtp");
        set("smtp.port",      String.valueOf(dto.getPort()),     "smtp");
        set("smtp.username",  nullSafe(dto.getUsername()),       "smtp");
        set("smtp.from",      nullSafe(dto.getFrom()),           "smtp");
        set("smtp.from_name", nullSafe(dto.getFromName()),       "smtp");
        set("smtp.starttls",  String.valueOf(dto.isStarttls()),  "smtp");
        set("smtp.auth",      String.valueOf(dto.isAuth()),      "smtp");

        // Ne pas écraser le mot de passe s'il est le masque
        String pwd = dto.getPassword();
        if (pwd != null && !MASKED.equals(pwd)) {
            set("smtp.password", pwd, "smtp");
        }
    }

    public void testSmtpConnection(String testEmail) {
        JavaMailSenderImpl sender = buildMailSender();
        if (sender == null) {
            throw new BusinessException("SMTP_DISABLED", "Le serveur SMTP n'est pas configuré ou activé.");
        }
        try {
            sender.testConnection();
        } catch (Exception e) {
            throw new BusinessException("SMTP_CONNECTION_FAILED",
                    "Impossible de se connecter au serveur SMTP : " + e.getMessage());
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(formatFrom());
            msg.setTo(testEmail);
            msg.setSubject("OptiCRM — Test SMTP");
            msg.setText("La configuration SMTP fonctionne correctement.\n\nCet email a été envoyé depuis OptiCRM.");
            sender.send(msg);
            log.info("Email de test SMTP envoyé à {}", testEmail);
        } catch (Exception e) {
            throw new BusinessException("SMTP_SEND_FAILED",
                    "Connexion établie mais envoi échoué : " + e.getMessage());
        }
    }

    /** Construit un JavaMailSenderImpl à partir des paramètres DB. Retourne null si non activé ou non configuré. */
    public JavaMailSenderImpl buildMailSender() {
        if (!Boolean.parseBoolean(get("smtp.enabled", "false"))) return null;
        String host = get("smtp.host", "");
        if (host.isBlank()) return null;

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(parsePort(get("smtp.port", "587")));
        sender.setUsername(get("smtp.username", ""));
        sender.setPassword(get("smtp.password", ""));
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth",     get("smtp.auth",     "true"));
        props.put("mail.smtp.starttls.enable", get("smtp.starttls", "true"));
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout",           "5000");

        return sender;
    }

    public String getSmtpFrom() {
        return formatFrom();
    }

    public String getFrontendUrl() {
        return get("app.frontend_url", "http://kasoft.selfip.net:50231");
    }

    // ───── AI ────────────────────────────────────────────────────────────────

    private static final String AI_KEY_MASK = "sk-ant-••••••••";

    @Transactional(readOnly = true)
    public AiSettingsDto getAiSettings() {
        boolean keySet = repository.findById("ai.api_key")
                .map(s -> s.getValue() != null && !s.getValue().isBlank())
                .orElse(false);
        return AiSettingsDto.builder()
                .apiKey(keySet ? AI_KEY_MASK : "")
                .model("claude-opus-4-6")
                .keyConfigured(keySet)
                .build();
    }

    @Transactional
    public void saveAiSettings(AiSettingsDto dto) {
        String key = dto.getApiKey();
        if (key != null && !key.isBlank() && !AI_KEY_MASK.equals(key)) {
            set("ai.api_key", key, "ai");
        }
    }

    /** Retourne la clé API Anthropic stockée en base (vide si non configurée). */
    public String getAiApiKey() {
        return get("ai.api_key", "");
    }

    /** Retourne l'email ADV pour les demandes d'échantillons. */
    public String getAdvEmail() {
        return get("adv.email", "");
    }

    // ───── Sage Server ──────────────────────────────────────────────────────

    private static final String SAGE_PWD_MASK = "••••••••";

    @Transactional(readOnly = true)
    public SageServerConfigDto getSageServerConfig() {
        boolean passwordSet = repository.findById("sage.server.password")
                .map(s -> s.getValue() != null && !s.getValue().isBlank())
                .orElse(false);
        return SageServerConfigDto.builder()
                .enabled(Boolean.parseBoolean(get("sage.server.enabled", "false")))
                .host(get("sage.server.host", ""))
                .port(parsePort(get("sage.server.port", "1433")))
                .database(get("sage.server.database", ""))
                .username(get("sage.server.username", ""))
                .password(passwordSet ? SAGE_PWD_MASK : "")
                .dossier(get("sage.server.dossier", ""))
                .customQuery(get("sage.server.custom_query", ""))
                .build();
    }

    @Transactional
    public void saveSageServerConfig(SageServerConfigDto dto) {
        set("sage.server.enabled",  String.valueOf(dto.isEnabled()),  "sage");
        set("sage.server.host",     nullSafe(dto.getHost()),          "sage");
        set("sage.server.port",     String.valueOf(dto.getPort()),    "sage");
        set("sage.server.database", nullSafe(dto.getDatabase()),      "sage");
        set("sage.server.username", nullSafe(dto.getUsername()),      "sage");
        set("sage.server.dossier",       nullSafe(dto.getDossier()),       "sage");
        set("sage.server.custom_query",  nullSafe(dto.getCustomQuery()),   "sage");
        String pwd = dto.getPassword();
        if (pwd != null && !SAGE_PWD_MASK.equals(pwd)) {
            set("sage.server.password", pwd, "sage");
        }
    }

    /** Retourne les informations de connexion Sage avec le vrai mot de passe (non masqué). */
    public SageConnectionInfo getSageConnectionInfo() {
        return new SageConnectionInfo(
                Boolean.parseBoolean(get("sage.server.enabled", "false")),
                get("sage.server.host", ""),
                parsePort(get("sage.server.port", "1433")),
                get("sage.server.database", ""),
                get("sage.server.username", ""),
                get("sage.server.password", ""),
                get("sage.server.dossier", "")
        );
    }

    public record SageConnectionInfo(
            boolean enabled, String host, int port,
            String database, String username, String password, String dossier) {}

    // ───── Sage Auto-Sync ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SageAutoSyncConfigDto getSageAutoSyncConfig() {
        return SageAutoSyncConfigDto.builder()
                .enabled(Boolean.parseBoolean(get("sage.autosync.enabled", "false")))
                .interval(get("sage.autosync.interval", "DAILY"))
                .syncAccounts(Boolean.parseBoolean(get("sage.autosync.accounts", "true")))
                .syncContacts(Boolean.parseBoolean(get("sage.autosync.contacts", "true")))
                .lastRunAt(get("sage.autosync.last_run_at", ""))
                .lastRunStatus(get("sage.autosync.last_run_status", ""))
                .build();
    }

    @Transactional
    public void saveSageAutoSyncConfig(SageAutoSyncConfigDto dto) {
        set("sage.autosync.enabled",  String.valueOf(dto.isEnabled()),      "sage");
        set("sage.autosync.interval", nullSafe(dto.getInterval()),          "sage");
        set("sage.autosync.accounts", String.valueOf(dto.isSyncAccounts()), "sage");
        set("sage.autosync.contacts", String.valueOf(dto.isSyncContacts()), "sage");
    }

    @Transactional
    public void updateAutoSyncRunResult(String status) {
        set("sage.autosync.last_run_at",     java.time.Instant.now().toString(), "sage");
        set("sage.autosync.last_run_status", nullSafe(status),                   "sage");
    }

    public record SageAutoSyncInfo(
            boolean enabled, String interval,
            boolean syncAccounts, boolean syncContacts) {}

    public SageAutoSyncInfo getSageAutoSyncInfo() {
        return new SageAutoSyncInfo(
                Boolean.parseBoolean(get("sage.autosync.enabled", "false")),
                get("sage.autosync.interval", "DAILY"),
                Boolean.parseBoolean(get("sage.autosync.accounts", "true")),
                Boolean.parseBoolean(get("sage.autosync.contacts", "true"))
        );
    }

    // ───── Google Calendar ──────────────────────────────────────────────────

    private static final String GC_SECRET_MASK = "••••••••";

    @Transactional(readOnly = true)
    public java.util.Map<String, String> getGoogleCalendarConfig() {
        boolean secretSet = repository.findById("google.calendar.client_secret")
                .map(s -> s.getValue() != null && !s.getValue().isBlank())
                .orElse(false);

        return java.util.Map.of(
                "clientId",       get("google.calendar.client_id",       ""),
                "clientSecret",   secretSet ? GC_SECRET_MASK : "",
                "redirectUri",    get("google.calendar.redirect_uri",    ""),
                "frontendBaseUrl",get("google.calendar.frontend_base_url",""),
                "secretConfigured", String.valueOf(secretSet),
                "configured",     String.valueOf(!get("google.calendar.client_id","").isBlank())
        );
    }

    @Transactional
    public void saveGoogleCalendarConfig(String clientId, String clientSecret,
                                          String redirectUri, String frontendBaseUrl) {
        if (clientId     != null) set("google.calendar.client_id",        clientId,        "google_calendar");
        if (redirectUri  != null) set("google.calendar.redirect_uri",     redirectUri,     "google_calendar");
        if (frontendBaseUrl != null) set("google.calendar.frontend_base_url", frontendBaseUrl, "google_calendar");
        if (clientSecret != null && !GC_SECRET_MASK.equals(clientSecret) && !clientSecret.isBlank()) {
            set("google.calendar.client_secret", clientSecret, "google_calendar");
        }
    }

    /** Lecture interne (vrai secret, non masqué) pour le service OAuth2. */
    public String getGoogleCalendarValue(String key, String fallback) {
        return get(key, fallback);
    }

    // ───── Helpers ──────────────────────────────────────────────────────────

    private String formatFrom() {
        String name = get("smtp.from_name", "OptiCRM");
        String addr = get("smtp.from", "noreply@opticrm.ma");
        return name.isBlank() ? addr : name + " <" + addr + ">";
    }

    private int parsePort(String value) {
        try { return Integer.parseInt(value); } catch (NumberFormatException e) { return 587; }
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }
}
