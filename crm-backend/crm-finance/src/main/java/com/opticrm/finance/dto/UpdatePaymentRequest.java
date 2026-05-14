package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Payment;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentRequest {

    @NotNull(message = "Le compte est obligatoire")
    private UUID accountId;

    @NotNull(message = "La date de paiement est obligatoire")
    private LocalDate paymentDate;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
    private BigDecimal amount;

    @Size(max = 3, message = "La devise ne doit pas dépasser 3 caractères")
    private String currency;

    @NotNull(message = "La méthode de paiement est obligatoire")
    private Payment.PaymentMethod paymentMethod;

    @Size(max = 100, message = "La référence ne doit pas dépasser 100 caractères")
    private String reference;

    @Size(max = 100, message = "Le compte bancaire ne doit pas dépasser 100 caractères")
    private String bankAccount;

    private Payment.PaymentStatus status;

    private String notes;
}
