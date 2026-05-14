package com.opticrm.core.googlecalendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleCalendarConfigDto {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String frontendBaseUrl;
    /** true si un client secret est déjà enregistré (ne jamais renvoyer la valeur réelle) */
    private boolean secretConfigured;
    /** true si le client_id est renseigné */
    private boolean configured;
}
