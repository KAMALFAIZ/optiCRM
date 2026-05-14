package com.opticrm.core.chantier.dto;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierPhotoDto {
    private String id;
    private String url;
    private String originalName;
    private String uploadedBy;
    private Instant createdAt;
}
