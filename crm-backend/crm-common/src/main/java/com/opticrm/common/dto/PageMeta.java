package com.opticrm.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageMeta {

    private int page;
    private int perPage;
    private long total;
    private int totalPages;

    public static PageMeta from(Page<?> page) {
        return PageMeta.builder()
                .page(page.getNumber() + 1) // 1-indexed for API
                .perPage(page.getSize())
                .total(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
