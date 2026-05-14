package com.opticrm.core.vente.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.vente.dto.CreateVenteSaisieRequest;
import com.opticrm.core.vente.dto.UpdateVenteSaisieRequest;
import com.opticrm.core.vente.dto.VenteSaisieDto;
import com.opticrm.core.vente.entity.VenteSaisie;
import com.opticrm.core.vente.repository.VenteSaisieRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.service.SecurityService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class VenteSaisieService {

    private final VenteSaisieRepository venteSaisieRepository;
    private final AccountRepository accountRepository;
    private final SecurityService securityService;

    // ─── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<VenteSaisieDto> findAll(UUID accountId, LocalDate dateFrom, LocalDate dateTo,
                                        String statut, Pageable pageable) {
        Specification<VenteSaisie> spec = buildSpec(accountId, dateFrom, dateTo, statut);

        // COMMERCIAL ne voit que ses propres ventes saisies
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                final UUID commercialId = uid;
                spec = spec.and((root, query, cb) ->
                        cb.equal(root.get("createdBy").get("id"), commercialId));
            }
        }

        return venteSaisieRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public VenteSaisieDto findById(UUID id) {
        VenteSaisie v = venteSaisieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VenteSaisie", id.toString()));
        return toDto(v);
    }

    @Transactional(readOnly = true)
    public List<VenteSaisieDto> findByAccount(UUID accountId) {
        return venteSaisieRepository.findByAccountId(accountId).stream()
                .map(this::toDto)
                .toList();
    }

    // ─── Création ─────────────────────────────────────────────────────────────

    public VenteSaisieDto create(CreateVenteSaisieRequest request) {
        User currentUser = securityService.getCurrentUser();
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId().toString()));

        VenteSaisie v = VenteSaisie.builder()
                .account(account)
                .createdBy(currentUser)
                .reference(request.getReference())
                .dateVente(request.getDateVente())
                .montantHt(request.getMontantHt())
                .montantTtc(request.getMontantTtc())
                .description(request.getDescription())
                .statut(request.getStatut() != null ? request.getStatut() : "CONFIRME")
                .build();

        return toDto(venteSaisieRepository.save(v));
    }

    // ─── Modification ─────────────────────────────────────────────────────────

    public VenteSaisieDto update(UUID id, UpdateVenteSaisieRequest request) {
        VenteSaisie v = venteSaisieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VenteSaisie", id.toString()));

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId().toString()));
            v.setAccount(account);
        }
        if (request.getReference() != null)  v.setReference(request.getReference());
        if (request.getDateVente()  != null)  v.setDateVente(request.getDateVente());
        if (request.getMontantHt()  != null)  v.setMontantHt(request.getMontantHt());
        if (request.getMontantTtc() != null)  v.setMontantTtc(request.getMontantTtc());
        if (request.getDescription() != null) v.setDescription(request.getDescription());
        if (request.getStatut()     != null)  v.setStatut(request.getStatut());

        return toDto(venteSaisieRepository.save(v));
    }

    // ─── Suppression ──────────────────────────────────────────────────────────

    public void delete(UUID id) {
        if (!venteSaisieRepository.existsById(id)) {
            throw new ResourceNotFoundException("VenteSaisie", id.toString());
        }
        venteSaisieRepository.deleteById(id);
    }

    // ─── Spec + Mapper ────────────────────────────────────────────────────────

    private Specification<VenteSaisie> buildSpec(UUID accountId, LocalDate dateFrom,
                                                  LocalDate dateTo, String statut) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (accountId != null) {
                predicates.add(cb.equal(root.get("account").get("id"), accountId));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateVente"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dateVente"), dateTo));
            }
            if (statut != null && !statut.isBlank()) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private VenteSaisieDto toDto(VenteSaisie v) {
        return VenteSaisieDto.builder()
                .id(v.getId())
                .accountId(v.getAccount() != null ? v.getAccount().getId() : null)
                .accountName(v.getAccount() != null ? v.getAccount().getName() : null)
                .createdById(v.getCreatedBy() != null ? v.getCreatedBy().getId() : null)
                .createdByName(v.getCreatedBy() != null
                        ? v.getCreatedBy().getFirstName() + " " + v.getCreatedBy().getLastName() : null)
                .reference(v.getReference())
                .dateVente(v.getDateVente())
                .montantHt(v.getMontantHt())
                .montantTtc(v.getMontantTtc())
                .description(v.getDescription())
                .statut(v.getStatut())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
