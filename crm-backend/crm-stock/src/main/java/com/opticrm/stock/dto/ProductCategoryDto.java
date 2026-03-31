package com.opticrm.stock.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductCategoryDto {

    private String id;
    private String code;
    private String name;
    private String description;
    private Integer sortOrder;
    private CategorySummary parentCategory;
    private List<CategorySummary> subCategories;
    private String fullPath;
    private Long productCount;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummary {
        private String id;
        private String code;
        private String name;
    }
}
