package com.opticrm.stock.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseRequest {

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 20, message = "Le code ne doit pas dépasser 20 caractères")
    private String code;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    private String name;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String addressStreet;

    @Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
    private String addressCity;

    @Size(max = 20, message = "Le code postal ne doit pas dépasser 20 caractères")
    private String addressPostalCode;

    @Size(max = 100, message = "Le pays ne doit pas dépasser 100 caractères")
    private String addressCountry;

    private Boolean isDefault;
    private Boolean isActive;
}
