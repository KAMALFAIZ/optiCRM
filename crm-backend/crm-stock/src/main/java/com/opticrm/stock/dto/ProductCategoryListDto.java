package com.opticrm.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryListDto {

    private String id;
    private String code;
    private String name;
    private String parentCategoryName;
    private Integer sortOrder;
    private Long productCount;
}
