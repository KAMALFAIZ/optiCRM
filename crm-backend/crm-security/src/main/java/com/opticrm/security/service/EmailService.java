package com.opticrm.security.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final SettingService settingService;

    // ───── Bienvenue ─────────────────────────────────────────────────────────

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName, String plainPassword) {
        JavaMailSenderImpl sender = settingService.buildMailSender();
        String loginUrl = settingService.getFrontendUrl() + "/login";

        if (sender == null) {
            log.info("=== [DEV] EMAIL DE BIENVENUE ===");
            log.info("Destinataire : {}", toEmail);
            log.info("Prénom       : {}", firstName);
            log.info("Mot de passe : {}", plainPassword);
            log.info("Lien connexion : {}", loginUrl);
            log.info("(Activez le SMTP dans Paramètres pour envoyer de vrais emails)");
            log.info("================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(settingService.getSmtpFrom());
            message.setTo(toEmail);
            message.setSubject("OptiCRM — Bienvenue ! Vos identifiants de connexion");
            message.setText(buildWelcomeText(firstName, toEmail, plainPassword, loginUrl));
            sender.send(message);
            log.info("Email de bienvenue envoyé à {}", toEmail);
        } catch (Exception e) {
            log.error("Échec de l'envoi du mail de bienvenue à {} : {}", toEmail, e.getMessage());
        }
    }

    private String buildWelcomeText(String firstName, String email, String password, String loginUrl) {
        return """
                Bonjour %s,

                Votre compte OptiCRM a été créé avec succès.

                Voici vos identifiants de connexion :

                  Email          : %s
                  Mot de passe   : %s

                Connectez-vous ici : %s

                Pour la sécurité de votre compte, nous vous recommandons de changer
                votre mot de passe dès votre première connexion.

                Si vous avez des questions, contactez votre administrateur.

                L'équipe OptiCRM
                """.formatted(firstName, email, password, loginUrl);
    }

    // ───── Réinitialisation de mot de passe ──────────────────────────────────

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        JavaMailSenderImpl sender = settingService.buildMailSender();
        String resetLink = settingService.getFrontendUrl() + "/reset-password?token=" + token;

        if (sender == null) {
            log.info("=== [DEV] EMAIL DE RÉINITIALISATION ===");
            log.info("Destinataire : {}", toEmail);
            log.info("Lien : {}", resetLink);
            log.info("(Activez le SMTP dans Paramètres pour envoyer de vrais emails)");
            log.info("=======================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(settingService.getSmtpFrom());
            message.setTo(toEmail);
            message.setSubject("OptiCRM — Réinitialisation de votre mot de passe");
            message.setText(buildResetEmailText(resetLink));
            sender.send(message);
            log.info("Email de réinitialisation envoyé à {}", toEmail);
        } catch (Exception e) {
            log.error("Échec de l'envoi à {} : {}", toEmail, e.getMessage());
        }
    }

    // ───── Email générique ────────────────────────────────────────────────────

    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        JavaMailSenderImpl sender = settingService.buildMailSender();

        if (sender == null) {
            log.info("=== [DEV] EMAIL: {} ===", subject);
            log.info("Destinataire : {}", toEmail);
            log.info("{}", body);
            log.info("(Activez le SMTP dans Paramètres pour envoyer de vrais emails)");
            log.info("========================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(settingService.getSmtpFrom());
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
            log.info("Email envoyé à {} : {}", toEmail, subject);
        } catch (Exception e) {
            log.error("Échec envoi email à {} : {}", toEmail, e.getMessage());
        }
    }

    private String buildResetEmailText(String resetLink) {
        return """
                Bonjour,

                Vous avez demandé la réinitialisation de votre mot de passe OptiCRM.

                Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :

                %s

                Ce lien est valable pendant 1 heure.

                Si vous n'avez pas effectué cette demande, ignorez cet email.

                L'équipe OptiCRM
                """.formatted(resetLink);
    }
}
