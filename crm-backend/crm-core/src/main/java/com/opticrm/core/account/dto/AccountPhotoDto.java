package com.opticrm.core.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPhotoDto {
    private String id;
    private String url;
    private String caption;
    private Integer displayOrder;
    private Instant uploadedAt;
}
