package com.opticrm.core.quote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteListDto {

    private String id;
    private String quoteNumber;
    private String name;
    private String status;

    private String accountId;
    private String accountName;

    private String contactId;
    private String contactName;

    private String opportunityId;
    private String opportunityName;

    private String chantierId;
    private String chantierNom;

    private String assignedToId;
    private String assignedToName;

    private LocalDate quoteDate;
    private LocalDate validUntil;
    private String currency;

    private BigDecimal subtotal;
    private BigDecimal total;
    private Integer itemCount;

    private Instant createdAt;
}
