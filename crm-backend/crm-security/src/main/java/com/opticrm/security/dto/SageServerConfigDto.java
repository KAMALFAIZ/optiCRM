package com.opticrm.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SageServerConfigDto {
    private boolean enabled;
    /** Adresse IP ou nom d'hôte du serveur SQL Server hébergeant Sage 100 */
    private String host;
    /** Port SQL Server (défaut : 1433) */
    private int port;
    /** Nom de la base de données Sage (dossier) */
    private String database;
    /** Identifiant SQL Server */
    private String username;
    /** Mot de passe SQL Server — renvoyé masqué (••••••••) en GET */
    private String password;
    /** Code du dossier Sage (ex: MASCIM) */
    private String dossier;
    /** Requête SQL personnalisée pour l'import de données */
    private String customQuery;
}
