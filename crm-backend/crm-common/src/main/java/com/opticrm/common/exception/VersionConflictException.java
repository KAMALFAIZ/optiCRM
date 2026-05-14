package com.opticrm.common.exception;

import lombok.Getter;

/**
 * Levée lorsqu'une modification échoue à cause d'un conflit de version (optimistic locking).
 * Transporte les données serveur actuelles pour permettre la résolution côté client.
 */
@Getter
public class VersionConflictException extends RuntimeException {

    private final String entityType;
    private final Object entityId;
    private final Object serverData;

    public VersionConflictException(String entityType, Object entityId, Object serverData) {
        super(String.format("Conflit de version sur %s/%s — la ressource a été modifiée par un autre utilisateur", entityType, entityId));
        this.entityType = entityType;
        this.entityId = entityId;
        this.serverData = serverData;
    }
}
