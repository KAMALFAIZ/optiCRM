package com.opticrm.reporting.service;

import com.opticrm.core.activity.entity.Activity;
import com.opticrm.core.activity.repository.ActivityRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.quote.entity.Quote;
import com.opticrm.core.quote.repository.QuoteRepository;
import com.opticrm.core.visit.entity.Visit;
import com.opticrm.core.visit.repository.VisitRepository;
import com.opticrm.finance.entity.Invoice;
import com.opticrm.finance.entity.Payment;
import com.opticrm.finance.entity.SalesOrder;
import com.opticrm.finance.repository.InvoiceRepository;
import com.opticrm.finance.repository.PaymentRepository;
import com.opticrm.finance.repository.SalesOrderRepository;
import com.opticrm.reporting.dto.AccountTimelineDto;
import com.opticrm.reporting.dto.TimelineEventDto;
import com.opticrm.security.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountTimelineService {

    private final ActivityRepository activityRepository;
    private final VisitRepository visitRepository;
    private final OpportunityRepository opportunityRepository;
    private final QuoteRepository quoteRepository;
    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PaymentRepository paymentRepository;

    public AccountTimelineDto getTimeline(UUID accountId, int limit, Set<String> types) {
        log.debug("Building timeline for account {} with limit {} and types {}", accountId, limit, types);

        List<TimelineEventDto> allEvents = new ArrayList<>();

        // Fetch each entity type if requested (or if no filter specified = all types)
        boolean fetchAll = types == null || types.isEmpty();

        if (fetchAll || types.contains("activity")) {
            allEvents.addAll(buildActivityEvents(accountId));
        }

        if (fetchAll || types.contains("visit")) {
            allEvents.addAll(buildVisitEvents(accountId));
        }

        if (fetchAll || types.contains("opportunity")) {
            allEvents.addAll(buildOpportunityEvents(accountId));
        }

        if (fetchAll || types.contains("quote")) {
            allEvents.addAll(buildQuoteEvents(accountId));
        }

        if (fetchAll || types.contains("invoice")) {
            allEvents.addAll(buildInvoiceEvents(accountId));
        }

        if (fetchAll || types.contains("order")) {
            allEvents.addAll(buildSalesOrderEvents(accountId));
        }

        if (fetchAll || types.contains("payment")) {
            allEvents.addAll(buildPaymentEvents(accountId));
        }

        int totalEvents = allEvents.size();

        // Sort by date descending (most recent first)
        allEvents.sort((a, b) -> {
            Instant dateA = Instant.parse(a.getDate());
            Instant dateB = Instant.parse(b.getDate());
            return dateB.compareTo(dateA);
        });

        // Apply limit
        if (allEvents.size() > limit) {
            allEvents = allEvents.subList(0, limit);
        }

        return AccountTimelineDto.builder()
                .accountId(accountId.toString())
                .events(allEvents)
                .totalEvents(totalEvents)
                .build();
    }

    // ---- Activity ----
    private List<TimelineEventDto> buildActivityEvents(UUID accountId) {
        try {
            List<Activity> activities = activityRepository.findByRelatedToTypeAndRelatedToId("account", accountId);
            return activities.stream().map(a -> TimelineEventDto.builder()
                    .id(a.getId().toString())
                    .type("activity")
                    .title(a.getSubject())
                    .description(a.getDescription())
                    .date(a.getStartDate() != null ? a.getStartDate().toString() : a.getCreatedAt().toString())
                    .status(a.getStatus())
                    .userId(getUserId(a.getAssignedTo()))
                    .userName(getUserName(a.getAssignedTo()))
                    .metadata(Map.of("activityType", Objects.toString(a.getActivityType(), "")))
                    .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching activities for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Visit ----
    private List<TimelineEventDto> buildVisitEvents(UUID accountId) {
        try {
            List<Visit> visits = visitRepository.findByAccountId(accountId);
            return visits.stream().map(v -> {
                Map<String, Object> meta = new HashMap<>();
                if (v.getCity() != null) meta.put("city", v.getCity());
                if (v.getVisitType() != null) meta.put("visitType", v.getVisitType());

                return TimelineEventDto.builder()
                        .id(v.getId().toString())
                        .type("visit")
                        .title(v.getSubject())
                        .description(v.getDescription())
                        .date(v.getVisitDate().toString())
                        .status(v.getStatus())
                        .userId(getUserId(v.getAssignedTo()))
                        .userName(getUserName(v.getAssignedTo()))
                        .metadata(meta.isEmpty() ? null : meta)
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching visits for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Opportunity ----
    private List<TimelineEventDto> buildOpportunityEvents(UUID accountId) {
        try {
            List<Opportunity> opportunities = opportunityRepository.findByAccountId(accountId);
            return opportunities.stream().map(o -> {
                String status = o.getStage() != null ? o.getStage().getName() : null;
                if (Boolean.TRUE.equals(o.getIsWon())) status = "Gagnée";
                else if (Boolean.TRUE.equals(o.getIsClosed())) status = "Perdue";

                String date = o.getCreatedAt() != null ? o.getCreatedAt().toString() :
                        (o.getCloseDate() != null ? toInstantString(o.getCloseDate()) : Instant.now().toString());

                return TimelineEventDto.builder()
                        .id(o.getId().toString())
                        .type("opportunity")
                        .title(o.getName())
                        .description(o.getDescription())
                        .date(date)
                        .status(status)
                        .amount(o.getAmount())
                        .userId(getUserId(o.getAssignedTo()))
                        .userName(getUserName(o.getAssignedTo()))
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching opportunities for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Quote ----
    private List<TimelineEventDto> buildQuoteEvents(UUID accountId) {
        try {
            List<Quote> quotes = quoteRepository.findByAccountId(accountId);
            return quotes.stream().map(q -> TimelineEventDto.builder()
                    .id(q.getId().toString())
                    .type("quote")
                    .title(q.getQuoteNumber())
                    .date(q.getQuoteDate() != null ? toInstantString(q.getQuoteDate()) : q.getCreatedAt().toString())
                    .status(q.getStatus() != null ? q.getStatus().name() : null)
                    .amount(q.getTotal())
                    .userId(getUserId(q.getAssignedTo()))
                    .userName(getUserName(q.getAssignedTo()))
                    .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching quotes for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Invoice ----
    private List<TimelineEventDto> buildInvoiceEvents(UUID accountId) {
        try {
            List<Invoice> invoices = invoiceRepository.findByAccountId(accountId);
            return invoices.stream().map(i -> TimelineEventDto.builder()
                    .id(i.getId().toString())
                    .type("invoice")
                    .title(i.getInvoiceNumber())
                    .date(i.getInvoiceDate() != null ? toInstantString(i.getInvoiceDate()) : i.getCreatedAt().toString())
                    .status(i.getStatus() != null ? i.getStatus().name() : null)
                    .amount(i.getTotal())
                    .userId(getUserId(i.getCreatedBy()))
                    .userName(getUserName(i.getCreatedBy()))
                    .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching invoices for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- SalesOrder ----
    private List<TimelineEventDto> buildSalesOrderEvents(UUID accountId) {
        try {
            List<SalesOrder> orders = salesOrderRepository.findByAccountId(accountId);
            return orders.stream().map(o -> TimelineEventDto.builder()
                    .id(o.getId().toString())
                    .type("order")
                    .title(o.getOrderNumber())
                    .date(o.getOrderDate() != null ? toInstantString(o.getOrderDate()) : o.getCreatedAt().toString())
                    .status(o.getStatus() != null ? o.getStatus().name() : null)
                    .amount(o.getTotal())
                    .userId(getUserId(o.getAssignedTo()))
                    .userName(getUserName(o.getAssignedTo()))
                    .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching sales orders for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Payment ----
    private List<TimelineEventDto> buildPaymentEvents(UUID accountId) {
        try {
            List<Payment> payments = paymentRepository.findByAccountId(accountId);
            return payments.stream().map(p -> {
                Map<String, Object> meta = new HashMap<>();
                if (p.getPaymentMethod() != null) meta.put("paymentMethod", p.getPaymentMethod().name());
                if (p.getReference() != null) meta.put("reference", p.getReference());

                return TimelineEventDto.builder()
                        .id(p.getId().toString())
                        .type("payment")
                        .title(p.getPaymentNumber())
                        .date(p.getPaymentDate() != null ? toInstantString(p.getPaymentDate()) : p.getCreatedAt().toString())
                        .status(p.getStatus() != null ? p.getStatus().name() : null)
                        .amount(p.getAmount())
                        .userId(getUserId(p.getCreatedBy()))
                        .userName(getUserName(p.getCreatedBy()))
                        .metadata(meta.isEmpty() ? null : meta)
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error fetching payments for account {}: {}", accountId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ---- Helpers ----
    private String getUserId(User user) {
        return user != null ? user.getId().toString() : null;
    }

    private String getUserName(User user) {
        if (user == null) return null;
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? null : full;
    }

    private String toInstantString(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant().toString();
    }
}
