package com.opticrm.agent.executor;

import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;

/**
 * Interface commune pour tous les executors de commandes.
 */
public interface CommandExecutor {

    /**
     * Exécute une commande et retourne la réponse.
     *
     * @param command Commande à exécuter
     * @return Réponse avec les données ou l'erreur
     */
    AgentResponse execute(AgentCommand command);
}
