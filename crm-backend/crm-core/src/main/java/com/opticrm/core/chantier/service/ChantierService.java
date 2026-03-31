package com.opticrm.core.chantier.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.chantier.dto.*;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.entity.ChantierActeur;
import com.opticrm.core.chantier.repository.ChantierActeurRepository;
import com.opticrm.core.chantier.repository.ChantierRepository;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.TerritoryRepository;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChantierService {

    private final ChantierRepository chantierRepository;
    private final ChantierActeurRepository acteurRepository;
    private final UserRepository userRepository;
    private final TerritoryRepository territoryRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public ChantierDto getById(UUID id) {
        Chantier chantier = chantierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", id));
        return mapToDto(chantier);
    }

    @Transactional(readOnly = true)
    public Page<ChantierListDto> list(PageRequest pageRequest, String search,
                                      String stadeChantier, String statutChantier,
                                      String typeProjet, String assignedToId, String accountId,
                                      Boolean temoin) {
        Page<Chantier> chantiers;

        if (search != null && !search.isBlank()) {
            chantiers = chantierRepository.search(search.trim(),
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (stadeChantier != null) {
            chantiers = chantierRepository.findByStadeChantier(stadeChantier,
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (statutChantier != null) {
            chantiers = chantierRepository.findByStatutChantier(statutChantier,
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (typeProjet != null) {
            chantiers = chantierRepository.findByTypeProjet(typeProjet,
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (assignedToId != null) {
            chantiers = chantierRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (accountId != null) {
            chantiers = chantierRepository.findByAccountId(UUID.fromString(accountId),
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else if (temoin != null) {
            chantiers = chantierRepository.findByTemoin(temoin,
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        } else {
            chantiers = chantierRepository.findAll(
                    pageRequest.toPageable("nom", Sort.Direction.ASC));
        }

        return chantiers.map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public List<ChantierListDto> findByAccount(UUID accountId) {
        return chantierRepository.findByAccountId(accountId)
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChantierDto create(CreateChantierRequest request) {
        Chantier chantier = Chantier.builder()
                .nom(request.getNom())
                .ville(request.getVille())
                .prefecture(request.getPrefecture())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .adresse(request.getAdresse())
                .typeProjet(request.getTypeProjet())
                .sousTypeProjet(request.getSousTypeProjet())
                .nombreUnites(request.getNombreUnites())
                .stadeChantier(request.getStadeChantier())
                .stadeChangedAt(request.getStadeChantier() != null ? Instant.now() : null)
                .niveauOpportunite(request.getNiveauOpportunite())
                .concurrentFerme("FERME".equals(request.getNiveauOpportunite()) ? request.getConcurrentFerme() : null)
                .deciseur(request.getDeciseur())
                .statutChantier(request.getStatutChantier() != null ? request.getStatutChantier() : "ACTIF")
                .actionSuivante(request.getActionSuivante())
                .dateProchaineAction(request.getDateProchaineAction())
                .temoin(request.getTemoin() != null ? request.getTemoin() : false)
                .installateur(request.getInstallateur())
                .promoteur(request.getPromoteur())
                .build();

        setRelations(chantier, request.getAccountId(), request.getAssignedToId(), request.getTerritoryId());

        chantier = chantierRepository.save(chantier);

        if (request.getActeurs() != null) {
            for (CreateChantierRequest.ActeurRequest ar : request.getActeurs()) {
                ChantierActeur acteur = ChantierActeur.builder()
                        .chantier(chantier)
                        .roleActeur(ar.getRoleActeur())
                        .nom(ar.getNom())
                        .telephone(ar.getTelephone())
                        .build();
                acteurRepository.save(acteur);
            }
        }

        log.info("Chantier créé : {}", chantier.getNom());
        return mapToDto(chantierRepository.findById(chantier.getId()).orElseThrow());
    }

    @Transactional
    public ChantierDto update(UUID id, UpdateChantierRequest request) {
        Chantier chantier = chantierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", id));

        if (request.getNom() != null) chantier.setNom(request.getNom());
        if (request.getVille() != null) chantier.setVille(request.getVille());
        if (request.getPrefecture() != null) chantier.setPrefecture(request.getPrefecture());
        if (request.getLatitude() != null) chantier.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) chantier.setLongitude(request.getLongitude());
        if (request.getAdresse() != null) chantier.setAdresse(request.getAdresse());
        if (request.getTypeProjet() != null) chantier.setTypeProjet(request.getTypeProjet());
        if (request.getSousTypeProjet() != null) chantier.setSousTypeProjet(request.getSousTypeProjet());
        if (request.getNombreUnites() != null) chantier.setNombreUnites(request.getNombreUnites());
        if (request.getNiveauOpportunite() != null) {
            chantier.setNiveauOpportunite(request.getNiveauOpportunite());
            if ("FERME".equals(request.getNiveauOpportunite())) {
                if (request.getConcurrentFerme() != null) chantier.setConcurrentFerme(request.getConcurrentFerme());
            } else {
                chantier.setConcurrentFerme(null);
            }
        } else {
            if (request.getConcurrentFerme() != null) chantier.setConcurrentFerme(request.getConcurrentFerme());
        }
        if (request.getDeciseur() != null) chantier.setDeciseur(request.getDeciseur());
        if (request.getStatutChantier() != null) chantier.setStatutChantier(request.getStatutChantier());
        if (request.getActionSuivante() != null) chantier.setActionSuivante(request.getActionSuivante());
        if (request.getDateProchaineAction() != null) chantier.setDateProchaineAction(request.getDateProchaineAction());
        if (request.getTemoin() != null) chantier.setTemoin(request.getTemoin());
        if (request.getInstallateur() != null) chantier.setInstallateur(request.getInstallateur());
        if (request.getPromoteur() != null) chantier.setPromoteur(request.getPromoteur());

        // Suivi du stade avec timestamp
        if (request.getStadeChantier() != null &&
                !request.getStadeChantier().equals(chantier.getStadeChantier())) {
            chantier.setStadeChantier(request.getStadeChantier());
            chantier.setStadeChangedAt(Instant.now());
        }

        setRelations(chantier, request.getAccountId(), request.getAssignedToId(), request.getTerritoryId());

        chantier = chantierRepository.save(chantier);
        log.info("Chantier mis à jour : {}", id);
        return mapToDto(chantier);
    }

    @Transactional
    public void delete(UUID id) {
        if (!chantierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Chantier", id);
        }
        chantierRepository.deleteById(id);
        log.info("Chantier supprimé : {}", id);
    }

    // Acteurs
    @Transactional
    public ChantierActeurDto addActeur(UUID chantierId, CreateChantierRequest.ActeurRequest request) {
        Chantier chantier = chantierRepository.findById(chantierId)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", chantierId));

        ChantierActeur acteur = ChantierActeur.builder()
                .chantier(chantier)
                .roleActeur(request.getRoleActeur())
                .nom(request.getNom())
                .telephone(request.getTelephone())
                .build();

        acteur = acteurRepository.save(acteur);
        return mapActeurToDto(acteur);
    }

    @Transactional
    public void removeActeur(UUID chantierId, UUID acteurId) {
        acteurRepository.deleteByChantierIdAndId(chantierId, acteurId);
    }

    // Carte interactive : tous les chantiers géolocalisés
    @Transactional(readOnly = true)
    public List<ChantierListDto> findAllWithGps() {
        return chantierRepository.findAllWithGps()
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    // Mapping
    private ChantierDto mapToDto(Chantier c) {
        List<ChantierActeurDto> acteurs = acteurRepository
                .findByChantierIdOrderByRoleActeurAsc(c.getId())
                .stream()
                .map(this::mapActeurToDto)
                .collect(Collectors.toList());

        ChantierDto.ChantierDtoBuilder builder = ChantierDto.builder()
                .id(c.getId().toString())
                .nom(c.getNom())
                .ville(c.getVille())
                .prefecture(c.getPrefecture())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .adresse(c.getAdresse())
                .typeProjet(c.getTypeProjet())
                .sousTypeProjet(c.getSousTypeProjet())
                .nombreUnites(c.getNombreUnites())
                .segmentTaille(c.getSegmentTaille())
                .stadeChantier(c.getStadeChantier())
                .stadeChangedAt(c.getStadeChangedAt())
                .niveauOpportunite(c.getNiveauOpportunite())
                .concurrentFerme(c.getConcurrentFerme())
                .deciseur(c.getDeciseur())
                .statutChantier(c.getStatutChantier())
                .actionSuivante(c.getActionSuivante())
                .dateProchaineAction(c.getDateProchaineAction())
                .temoin(c.getTemoin())
                .installateur(c.getInstallateur())
                .promoteur(c.getPromoteur())
                .acteurs(acteurs)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .healthScore(c.getHealthScore())
                .conversionProbability(c.getConversionProbability())
                .aiSummary(c.getAiSummary())
                .lastAiAnalysisAt(c.getLastAiAnalysisAt());

        if (c.getAccount() != null) {
            builder.account(ChantierDto.AccountSummary.builder()
                    .id(c.getAccount().getId().toString())
                    .name(c.getAccount().getName())
                    .billingCity(c.getAccount().getBillingCity())
                    .build());
        }

        if (c.getAssignedTo() != null) {
            builder.assignedTo(ChantierDto.UserSummary.builder()
                    .id(c.getAssignedTo().getId().toString())
                    .fullName(c.getAssignedTo().getFullName())
                    .email(c.getAssignedTo().getEmail())
                    .build());
        }

        if (c.getTerritory() != null) {
            builder.territory(ChantierDto.TerritorySummary.builder()
                    .id(c.getTerritory().getId().toString())
                    .name(c.getTerritory().getName())
                    .region(c.getTerritory().getRegion())
                    .build());
        }

        return builder.build();
    }

    private ChantierListDto mapToListDto(Chantier c) {
        return ChantierListDto.builder()
                .id(c.getId().toString())
                .nom(c.getNom())
                .ville(c.getVille())
                .prefecture(c.getPrefecture())
                .typeProjet(c.getTypeProjet())
                .sousTypeProjet(c.getSousTypeProjet())
                .nombreUnites(c.getNombreUnites())
                .segmentTaille(c.getSegmentTaille())
                .stadeChantier(c.getStadeChantier())
                .niveauOpportunite(c.getNiveauOpportunite())
                .statutChantier(c.getStatutChantier())
                .accountId(c.getAccount() != null ? c.getAccount().getId().toString() : null)
                .accountName(c.getAccount() != null ? c.getAccount().getName() : null)
                .assignedToName(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : null)
                .dateProchaineAction(c.getDateProchaineAction())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .temoin(c.getTemoin())
                .healthScore(c.getHealthScore())
                .conversionProbability(c.getConversionProbability())
                .build();
    }

    private ChantierActeurDto mapActeurToDto(ChantierActeur a) {
        return ChantierActeurDto.builder()
                .id(a.getId().toString())
                .roleActeur(a.getRoleActeur())
                .nom(a.getNom())
                .telephone(a.getTelephone())
                .build();
    }

    private void setRelations(Chantier chantier, String accountId, String assignedToId, String territoryId) {
        if (accountId != null) {
            Account account = accountRepository.findById(UUID.fromString(accountId))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));
            chantier.setAccount(account);
        }
        if (assignedToId != null) {
            User user = userRepository.findById(UUID.fromString(assignedToId))
                    .orElseThrow(() -> new ResourceNotFoundException("User", assignedToId));
            chantier.setAssignedTo(user);
        }
        if (territoryId != null) {
            Territory territory = territoryRepository.findById(UUID.fromString(territoryId))
                    .orElseThrow(() -> new ResourceNotFoundException("Territory", territoryId));
            chantier.setTerritory(territory);
        }
    }
}
