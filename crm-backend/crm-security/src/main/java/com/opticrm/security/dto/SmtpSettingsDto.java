package com.opticrm.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmtpSettingsDto {
    private boolean enabled;
    private String host;
    private int port;
    private String username;
    /** Renvoyé masqué (••••••••) en GET. En PUT, ignorer si la valeur est le masque. */
    private String password;
    private String from;
    private String fromName;
    private boolean starttls;
    private boolean auth;
}
