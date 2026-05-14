package com.opticrm.finance.service;

import com.opticrm.finance.dto.AgedBalanceDto;
import com.opticrm.finance.repository.InvoiceRepository;
import com.opticrm.security.config.ContextUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgedBalanceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public List<AgedBalanceDto> getAgedBalance(String commercialId) {
        // COMMERCIAL voit uniquement ses propres données
        if (ContextUtils.hasRole("COMMERCIAL")) {
            java.util.UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) commercialId = uid.toString();
        }
        // Utilise 'ALL' comme sentinelle pour "aucun filtre"
        // (les paramètres null dans les requêtes natives JPA peuvent poser des problèmes)
        String param = (commercialId != null && !commercialId.isBlank()) ? commercialId : "ALL";
        List<Object[]> rows = invoiceRepository.findAgedBalance(param);
        return rows.stream()
                .map(row -> new AgedBalanceDto(
                        row[0] != null ? row[0].toString() : null,  // accountId
                        row[1] != null ? row[1].toString() : null,  // accountName
                        row[2] != null ? row[2].toString() : null,  // commercialId
                        row[3] != null ? row[3].toString() : null,  // commercialName
                        toBigDecimal(row[4]),   // nonEchu
                        toBigDecimal(row[5]),   // echu1a30
                        toBigDecimal(row[6]),   // echu31a60
                        toBigDecimal(row[7]),   // echu61a90
                        toBigDecimal(row[8]),   // echu91plus
                        toBigDecimal(row[9]),   // totalDue
                        row[10] != null ? ((Number) row[10]).longValue() : 0L  // invoiceCount
                ))
                .toList();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }
}
