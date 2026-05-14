package com.opticrm.agent.model;

/**
 * Types de commandes reçues du serveur CRM central.
 * Doit être synchronisé avec le enum côté gateway.
 */
public enum AgentCommandType {
    SQL_QUERY,
    SQL_EXECUTE,
    HTTP_REQUEST,
    SHELL_COMMAND,
    FILE_OPERATION,
    PING,
    AGENT_INFO
}
