package com.opticrm.core.chantier.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChantierActeurDto {
    private String id;
    private String roleActeur;
    private String nom;
    private String telephone;
}
