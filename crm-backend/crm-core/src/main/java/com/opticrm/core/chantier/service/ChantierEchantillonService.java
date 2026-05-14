package com.opticrm.core.chantier.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.core.chantier.dto.ChantierEchantillonDto;
import com.opticrm.core.chantier.dto.CreateEchantillonRequest;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.entity.ChantierEchantillon;
import com.opticrm.core.chantier.entity.ChantierEchantillonLigne;
import com.opticrm.core.chantier.repository.ChantierEchantillonRepository;
import com.opticrm.core.chantier.repository.ChantierRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.EmailService;
import com.opticrm.security.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChantierEchantillonService {

    private final ChantierEchantillonRepository echantillonRepository;
    private final ChantierRepository chantierRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SettingService settingService;

    @Transactional
    public ChantierEchantillonDto create(UUID chantierId, CreateEchantillonRequest request) {
        Chantier chantier = chantierRepository.findById(chantierId)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", chantierId));

        User requester = ContextUtils.getCurrentUserId()
                .flatMap(userRepository::findById)
                .orElse(null);

        ChantierEchantillon echantillon = ChantierEchantillon.builder()
                .chantier(chantier)
                .notes(request.getNotes())
                .statut("ENVOYE")
                .requestedBy(requester)
                .build();

        if (request.getLignes() != null) {
            for (CreateEchantillonRequest.LigneRequest lr : request.getLignes()) {
                ChantierEchantillonLigne ligne = ChantierEchantillonLigne.builder()
                        .echantillon(echantillon)
                        .productId(lr.getProductId() != null ? UUID.fromString(lr.getProductId()) : null)
                        .productCode(lr.getProductCode())
                        .productName(lr.getProductName())
                        .quantite(lr.getQuantite() != null ? lr.getQuantite() : 1)
                        .build();
                echantillon.getLignes().add(ligne);
            }
        }

        echantillon = echantillonRepository.save(echantillon);

        // Envoyer l'email à l'ADV
        String advEmail = settingService.getAdvEmail();
        if (advEmail != null && !advEmail.isBlank()) {
            String subject = String.format("Demande d'échantillons — %s", chantier.getNom());
            String body = buildEmailBody(chantier, requester, echantillon);
            emailService.sendEmail(advEmail, subject, body);
        } else {
            log.warn("Email ADV non configuré (adv.email) — demande d'échantillon non envoyée");
        }

        return mapToDto(echantillon);
    }

    @Transactional(readOnly = true)
    public List<ChantierEchantillonDto> findByChantier(UUID chantierId) {
        if (!chantierRepository.existsById(chantierId)) {
            throw new ResourceNotFoundException("Chantier", chantierId);
        }
        return echantillonRepository.findByChantierIdOrderByCreatedAtDesc(chantierId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private String buildEmailBody(Chantier chantier, User requester, ChantierEchantillon echantillon) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour,\n\n");
        sb.append("Une nouvelle demande d'échantillons a été soumise via OptiCRM.\n\n");
        sb.append("─────────────────────────────────\n");
        sb.append("CHANTIER\n");
        sb.append("─────────────────────────────────\n");
        sb.append("  Nom         : ").append(chantier.getNom()).append("\n");
        if (chantier.getVille() != null) {
            sb.append("  Ville       : ").append(chantier.getVille()).append("\n");
        }
        if (chantier.getTypeProjet() != null) {
            sb.append("  Type projet : ").append(chantier.getTypeProjet()).append("\n");
        }
        sb.append("\n");
        sb.append("─────────────────────────────────\n");
        sb.append("DEMANDEUR\n");
        sb.append("─────────────────────────────────\n");
        sb.append("  Commercial  : ").append(requester != null ? requester.getFullName() : "N/A").append("\n");
        if (requester != null) {
            sb.append("  Email       : ").append(requester.getEmail()).append("\n");
        }
        sb.append("\n");
        sb.append("─────────────────────────────────\n");
        sb.append("PRODUITS DEMANDÉS\n");
        sb.append("─────────────────────────────────\n");
        for (ChantierEchantillonLigne ligne : echantillon.getLignes()) {
            sb.append(String.format("  [%s] %s  — Qté : %d\n",
                    ligne.getProductCode(), ligne.getProductName(), ligne.getQuantite()));
        }
        if (echantillon.getNotes() != null && !echantillon.getNotes().isBlank()) {
            sb.append("\n");
            sb.append("─────────────────────────────────\n");
            sb.append("NOTES\n");
            sb.append("─────────────────────────────────\n");
            sb.append(echantillon.getNotes()).append("\n");
        }
        sb.append("\n\nL'équipe OptiCRM\n");
        return sb.toString();
    }

    private ChantierEchantillonDto mapToDto(ChantierEchantillon e) {
        List<ChantierEchantillonDto.LigneDto> lignes = e.getLignes().stream()
                .map(l -> ChantierEchantillonDto.LigneDto.builder()
                        .id(l.getId().toString())
                        .productId(l.getProductId() != null ? l.getProductId().toString() : null)
                        .productCode(l.getProductCode())
                        .productName(l.getProductName())
                        .quantite(l.getQuantite())
                        .build())
                .collect(Collectors.toList());

        return ChantierEchantillonDto.builder()
                .id(e.getId().toString())
                .notes(e.getNotes())
                .statut(e.getStatut())
                .requestedBy(e.getRequestedBy() != null ? e.getRequestedBy().getFullName() : null)
                .createdAt(e.getCreatedAt())
                .lignes(lignes)
                .build();
    }
}
