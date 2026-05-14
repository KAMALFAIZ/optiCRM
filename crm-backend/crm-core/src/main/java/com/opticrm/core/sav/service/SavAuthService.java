package com.opticrm.core.sav.service;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.sav.entity.SavAuthClient;
import com.opticrm.core.sav.repository.SavAuthClientRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavAuthService {

    private final SavAuthClientRepository authClientRepository;
    private final AccountRepository accountRepository;

    @Value("${JWT_SECRET:opticrm-sav-secret-key-must-be-at-least-64-characters-long-kasoft-2026}")
    private String jwtSecret;

    @Transactional
    public Map<String, Object> requestOtp(String telWhatsapp) {
        // Recherche du compte via téléphone
        Account account = accountRepository.findByPhone(telWhatsapp)
                .orElse(null);

        if (account == null) {
            throw new IllegalArgumentException("Numéro WhatsApp non trouvé dans le système. Contactez KASOFT.");
        }

        SavAuthClient auth = authClientRepository.findByTelWhatsapp(telWhatsapp)
                .orElse(SavAuthClient.builder()
                        .account(account)
                        .telWhatsapp(telWhatsapp)
                        .build());

        // Générer OTP 6 chiffres
        String otp = String.format("%06d", new Random().nextInt(999999));
        auth.setOtpCode(otp);
        auth.setOtpExpiration(Instant.now().plus(10, ChronoUnit.MINUTES));
        auth.setOtpUtilise(false);
        authClientRepository.save(auth);

        // Phase 1 : log console (pas d'envoi WhatsApp réel)
        log.info("[SAV-AUTH] OTP pour {} : {} (expires dans 10min)", telWhatsapp, otp);

        return Map.of(
                "message", "Code OTP envoyé sur WhatsApp",
                "accountId", account.getId(),
                "accountName", account.getName()
        );
    }

    @Transactional
    public Map<String, Object> verifyOtp(String telWhatsapp, String otp) {
        SavAuthClient auth = authClientRepository.findByTelWhatsapp(telWhatsapp)
                .orElseThrow(() -> new IllegalArgumentException("Numéro non enregistré"));

        if (Boolean.TRUE.equals(auth.getOtpUtilise())) {
            throw new IllegalArgumentException("Code OTP déjà utilisé");
        }
        if (auth.getOtpExpiration() == null || Instant.now().isAfter(auth.getOtpExpiration())) {
            throw new IllegalArgumentException("Code OTP expiré");
        }
        if (!otp.equals(auth.getOtpCode())) {
            throw new IllegalArgumentException("Code OTP incorrect");
        }

        auth.setOtpUtilise(true);
        auth.setDerniereConnexion(Instant.now());

        // Générer JWT session 8h
        String token = generateSessionToken(auth.getAccount().getId().toString(), telWhatsapp);
        auth.setSessionToken(token);
        auth.setSessionExpiration(Instant.now().plus(8, ChronoUnit.HOURS));
        authClientRepository.save(auth);

        Account account = auth.getAccount();
        return Map.of(
                "access_token", token,
                "expires_in", 28800,
                "client", Map.of(
                        "id", account.getId(),
                        "name", account.getName(),
                        "tel_whatsapp", telWhatsapp
                )
        );
    }

    public SavAuthClient validateToken(String token) {
        return authClientRepository.findBySessionToken(token)
                .filter(a -> a.getSessionExpiration() != null
                        && Instant.now().isBefore(a.getSessionExpiration()))
                .orElseThrow(() -> new IllegalArgumentException("Session expirée ou invalide"));
    }

    private String generateSessionToken(String accountId, String tel) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(accountId)
                .claim("tel", tel)
                .claim("type", "sav_session")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plus(8, ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }
}
