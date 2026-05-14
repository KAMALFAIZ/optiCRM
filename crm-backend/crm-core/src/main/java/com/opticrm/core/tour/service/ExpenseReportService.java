package com.opticrm.core.tour.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.common.exception.ValidationException;
import com.opticrm.core.tour.dto.*;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.core.tour.entity.ExpenseReport;
import com.opticrm.core.tour.entity.ExpenseReport.ExpenseReportStatus;
import com.opticrm.core.tour.entity.ExpenseReportLine;
import com.opticrm.core.tour.entity.Tour;
import com.opticrm.core.tour.repository.ExpenseReportRepository;
import com.opticrm.core.tour.repository.TourRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseReportService {

    private final ExpenseReportRepository expenseReportRepository;
    private final TourRepository tourRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<ExpenseReportListDto> findAll(UUID tourId, ExpenseReportStatus status, String search, Pageable pageable) {
        // COMMERCIAL ne voit que ses propres notes de frais
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return expenseReportRepository.findBySubmittedById(currentUserId, pageable)
                        .map(this::toListDto);
            }
        }

        if (search != null && !search.isBlank()) {
            return expenseReportRepository.search(search.trim(), pageable).map(this::toListDto);
        }
        if (tourId != null) {
            return expenseReportRepository.findByTourId(tourId, pageable).map(this::toListDto);
        }
        if (status != null) {
            return expenseReportRepository.findByStatus(status, pageable).map(this::toListDto);
        }
        return expenseReportRepository.findAll(pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public ExpenseReportDto findById(UUID id) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));
        return toDto(report);
    }

    @Transactional(readOnly = true)
    public List<ExpenseReportListDto> findByTourId(UUID tourId) {
        return expenseReportRepository.findByTourId(tourId).stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    public ExpenseReportDto create(CreateExpenseReportRequest request) {
        Tour tour = tourRepository.findById(request.getTourId())
                .orElseThrow(() -> new ResourceNotFoundException("Tournée non trouvée"));

        User currentUser = securityService.getCurrentUser();
        String reportNumber = generateReportNumber();

        ExpenseReport report = ExpenseReport.builder()
                .tour(tour)
                .submittedBy(currentUser)
                .reportNumber(reportNumber)
                .status(ExpenseReportStatus.DRAFT)
                .title(request.getTitle())
                .description(request.getDescription())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .lines(new ArrayList<>())
                .build();

        if (request.getLines() != null && !request.getLines().isEmpty()) {
            AtomicInteger order = new AtomicInteger(0);
            for (ExpenseReportLineRequest lineReq : request.getLines()) {
                ExpenseReportLine line = ExpenseReportLine.builder()
                        .category(lineReq.getCategory())
                        .description(lineReq.getDescription())
                        .amount(lineReq.getAmount())
                        .expenseDate(lineReq.getExpenseDate())
                        .receiptUrl(lineReq.getReceiptUrl())
                        .latitude(lineReq.getLatitude())
                        .longitude(lineReq.getLongitude())
                        .address(lineReq.getAddress())
                        .sortOrder(lineReq.getSortOrder() != null ? lineReq.getSortOrder() : order.getAndIncrement())
                        .build();
                report.addLine(line);
            }
        }

        report.recalculate();
        report = expenseReportRepository.save(report);
        log.info("Created expense report: {} for tour: {}", reportNumber, tour.getName());
        return toDto(report);
    }

    public ExpenseReportDto update(UUID id, UpdateExpenseReportRequest request) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.DRAFT) {
            throw new ValidationException("Seule une note de frais en brouillon peut être modifiée");
        }

        if (request.getTitle() != null) report.setTitle(request.getTitle());
        if (request.getDescription() != null) report.setDescription(request.getDescription());
        if (request.getCurrency() != null) report.setCurrency(request.getCurrency());

        if (request.getLines() != null) {
            report.clearLines();
            AtomicInteger order = new AtomicInteger(0);
            for (ExpenseReportLineRequest lineReq : request.getLines()) {
                ExpenseReportLine line = ExpenseReportLine.builder()
                        .category(lineReq.getCategory())
                        .description(lineReq.getDescription())
                        .amount(lineReq.getAmount())
                        .expenseDate(lineReq.getExpenseDate())
                        .receiptUrl(lineReq.getReceiptUrl())
                        .latitude(lineReq.getLatitude())
                        .longitude(lineReq.getLongitude())
                        .address(lineReq.getAddress())
                        .sortOrder(lineReq.getSortOrder() != null ? lineReq.getSortOrder() : order.getAndIncrement())
                        .build();
                report.addLine(line);
            }
            report.recalculate();
        }

        report = expenseReportRepository.save(report);
        log.info("Updated expense report: {}", id);
        return toDto(report);
    }

    public void delete(UUID id) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.DRAFT) {
            throw new ValidationException("Seule une note de frais en brouillon peut être supprimée");
        }

        expenseReportRepository.delete(report);
        log.info("Deleted expense report: {}", id);
    }

    public ExpenseReportDto submit(UUID id) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.DRAFT) {
            throw new ValidationException("Seule une note de frais en brouillon peut être soumise");
        }

        if (report.getLines().isEmpty()) {
            throw new ValidationException("La note de frais doit contenir au moins une ligne de dépense");
        }

        report.setStatus(ExpenseReportStatus.SUBMITTED);
        report.setSubmittedAt(Instant.now());
        report = expenseReportRepository.save(report);
        log.info("Submitted expense report: {}", report.getReportNumber());
        return toDto(report);
    }

    public ExpenseReportDto approve(UUID id) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.SUBMITTED) {
            throw new ValidationException("Seule une note de frais soumise peut être approuvée");
        }

        User currentUser = securityService.getCurrentUser();
        report.setStatus(ExpenseReportStatus.APPROVED);
        report.setApprovedBy(currentUser);
        report.setApprovedAt(Instant.now());
        report.setRejectionReason(null);
        report = expenseReportRepository.save(report);
        log.info("Approved expense report: {} by {}", report.getReportNumber(), currentUser.getFullName());
        return toDto(report);
    }

    public ExpenseReportDto reject(UUID id, String reason) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.SUBMITTED) {
            throw new ValidationException("Seule une note de frais soumise peut être rejetée");
        }

        User currentUser = securityService.getCurrentUser();
        report.setStatus(ExpenseReportStatus.REJECTED);
        report.setApprovedBy(currentUser);
        report.setRejectionReason(reason);
        report = expenseReportRepository.save(report);
        log.info("Rejected expense report: {} by {}", report.getReportNumber(), currentUser.getFullName());
        return toDto(report);
    }

    public ExpenseReportDto markReimbursed(UUID id) {
        ExpenseReport report = expenseReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note de frais non trouvée"));

        if (report.getStatus() != ExpenseReportStatus.APPROVED) {
            throw new ValidationException("Seule une note de frais approuvée peut être marquée comme remboursée");
        }

        report.setStatus(ExpenseReportStatus.REIMBURSED);
        report.setReimbursedAt(Instant.now());
        report = expenseReportRepository.save(report);
        log.info("Reimbursed expense report: {}", report.getReportNumber());
        return toDto(report);
    }

    private String generateReportNumber() {
        Integer maxNumber = expenseReportRepository.findMaxReportNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("NDF-%05d", nextNumber);
    }

    private ExpenseReportDto toDto(ExpenseReport report) {
        List<ExpenseReportLineDto> lineDtos = report.getLines().stream()
                .map(this::toLineDto)
                .collect(Collectors.toList());

        ExpenseReportDto.ExpenseReportDtoBuilder builder = ExpenseReportDto.builder()
                .id(report.getId())
                .reportNumber(report.getReportNumber())
                .status(report.getStatus().name())
                .title(report.getTitle())
                .description(report.getDescription())
                .totalAmount(report.getTotalAmount())
                .currency(report.getCurrency())
                .submittedAt(report.getSubmittedAt())
                .approvedAt(report.getApprovedAt())
                .reimbursedAt(report.getReimbursedAt())
                .rejectionReason(report.getRejectionReason())
                .lines(lineDtos)
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt());

        if (report.getTour() != null) {
            builder.tour(ExpenseReportDto.TourSummary.builder()
                    .id(report.getTour().getId().toString())
                    .name(report.getTour().getName())
                    .tourDate(report.getTour().getTourDate())
                    .build());
        }

        if (report.getSubmittedBy() != null) {
            builder.submittedBy(ExpenseReportDto.UserSummary.builder()
                    .id(report.getSubmittedBy().getId().toString())
                    .fullName(report.getSubmittedBy().getFullName())
                    .build());
        }

        if (report.getApprovedBy() != null) {
            builder.approvedBy(ExpenseReportDto.UserSummary.builder()
                    .id(report.getApprovedBy().getId().toString())
                    .fullName(report.getApprovedBy().getFullName())
                    .build());
        }

        return builder.build();
    }

    private ExpenseReportListDto toListDto(ExpenseReport report) {
        return ExpenseReportListDto.builder()
                .id(report.getId())
                .reportNumber(report.getReportNumber())
                .status(report.getStatus().name())
                .title(report.getTitle())
                .totalAmount(report.getTotalAmount())
                .currency(report.getCurrency())
                .tourName(report.getTour() != null ? report.getTour().getName() : null)
                .tourId(report.getTour() != null ? report.getTour().getId().toString() : null)
                .submittedByName(report.getSubmittedBy() != null ? report.getSubmittedBy().getFullName() : null)
                .submittedAt(report.getSubmittedAt())
                .createdAt(report.getCreatedAt())
                .lineCount(report.getLines() != null ? report.getLines().size() : 0)
                .build();
    }

    private ExpenseReportLineDto toLineDto(ExpenseReportLine line) {
        return ExpenseReportLineDto.builder()
                .id(line.getId())
                .category(line.getCategory())
                .description(line.getDescription())
                .amount(line.getAmount())
                .expenseDate(line.getExpenseDate())
                .receiptUrl(line.getReceiptUrl())
                .latitude(line.getLatitude())
                .longitude(line.getLongitude())
                .address(line.getAddress())
                .sortOrder(line.getSortOrder())
                .build();
    }
}
