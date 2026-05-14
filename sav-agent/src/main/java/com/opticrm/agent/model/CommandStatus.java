package com.opticrm.agent.model;

/**
 * Statuts de réponse d'une commande exécutée.
 * Doit être synchronisé avec le enum côté gateway.
 */
public enum CommandStatus {
    PENDING,
    SENT,
    SUCCESS,
    FAILED,
    TIMEOUT,
    REJECTED
}
