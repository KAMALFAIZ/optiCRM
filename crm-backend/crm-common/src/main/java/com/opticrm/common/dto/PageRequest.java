package com.opticrm.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequest {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int perPage = 20;

    private String sortBy;

    @Builder.Default
    private String sortDirection = "asc";

    public Pageable toPageable() {
        int pageIndex = Math.max(0, page - 1); // Convert to 0-indexed
        int size = Math.min(Math.max(1, perPage), 100); // Limit between 1 and 100

        if (sortBy != null && !sortBy.isBlank()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection)
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            return org.springframework.data.domain.PageRequest.of(pageIndex, size, Sort.by(direction, sortBy));
        }

        return org.springframework.data.domain.PageRequest.of(pageIndex, size);
    }

    public Pageable toPageable(String defaultSortBy, Sort.Direction defaultDirection) {
        int pageIndex = Math.max(0, page - 1);
        int size = Math.min(Math.max(1, perPage), 100);

        String sortField = (sortBy != null && !sortBy.isBlank()) ? sortBy : defaultSortBy;
        Sort.Direction direction = (sortBy != null && !sortBy.isBlank())
                ? ("desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC)
                : defaultDirection;

        return org.springframework.data.domain.PageRequest.of(pageIndex, size, Sort.by(direction, sortField));
    }
}
