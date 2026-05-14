package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentInstrumentDTO {

    private UUID id;
    private UUID deliveryLineId;
    private String instrumentType;    // CHEQUE | TRAITE
    private String instrumentNumber;
    private String bankName;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate encashDate;
    private String status;            // PENDING | ENCAISSE | REJETE
    private String rejectionReason;
    private String notes;
}
