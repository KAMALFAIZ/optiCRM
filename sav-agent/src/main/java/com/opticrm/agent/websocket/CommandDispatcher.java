package com.opticrm.agent.websocket;

import com.opticrm.agent.executor.*;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentCommandType;
import com.opticrm.agent.model.AgentResponse;
import com.opticrm.agent.security.CommandSecurityFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Dispatche les commandes reçues vers l'executor approprié.
 *
 * Pipeline :
 * 1. Filtre de sécurité (whitelist)
 * 2. Routage selon le type de commande
 * 3. Exécution et collecte du résultat
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CommandDispatcher {

    private final CommandSecurityFilter securityFilter;
    private final SqlQueryExecutor sqlQueryExecutor;
    private final HttpRequestExecutor httpRequestExecutor;
    private final ShellCommandExecutor shellCommandExecutor;
    private final FileOperationExecutor fileOperationExecutor;
    private final PingExecutor pingExecutor;
    private final AgentInfoExecutor agentInfoExecutor;

    /**
     * Dispatche une commande vers l'executor approprié.
     *
     * @param command Commande reçue du serveur central
     * @return Réponse à renvoyer au serveur
     */
    public AgentResponse dispatch(AgentCommand command) {
        String commandId = command.getCommandId();
        AgentCommandType type = command.getType();

        log.info("Dispatching command: id={}, type={}", commandId, type);

        long startTime = System.currentTimeMillis();

        try {
            // 1. Filtre de sécurité
            String rejectionReason = securityFilter.validate(command);
            if (rejectionReason != null) {
                log.warn("Command REJECTED: id={}, reason={}", commandId, rejectionReason);
                return AgentResponse.rejected(commandId, rejectionReason);
            }

            // 2. Routage vers l'executor
            AgentResponse response = switch (type) {
                case SQL_QUERY, SQL_EXECUTE -> sqlQueryExecutor.execute(command);
                case HTTP_REQUEST           -> httpRequestExecutor.execute(command);
                case SHELL_COMMAND          -> shellCommandExecutor.execute(command);
                case FILE_OPERATION         -> fileOperationExecutor.execute(command);
                case PING                   -> pingExecutor.execute(command);
                case AGENT_INFO             -> agentInfoExecutor.execute(command);
            };

            long duration = System.currentTimeMillis() - startTime;
            response.setExecutionTimeMs(duration);

            log.info("Command completed: id={}, type={}, status={}, duration={}ms",
                    commandId, type, response.getStatus(), duration);

            return response;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Command FAILED: id={}, type={}, error={}", commandId, type, e.getMessage(), e);

            AgentResponse errorResponse = AgentResponse.failed(
                    commandId,
                    "EXECUTION_ERROR",
                    e.getMessage()
            );
            errorResponse.setExecutionTimeMs(duration);
            return errorResponse;
        }
    }

    /**
     * Retourne la liste des types de commandes supportées par cet agent.
     */
    public List<String> getSupportedCommands() {
        return Arrays.stream(AgentCommandType.values())
                .map(Enum::name)
                .collect(Collectors.toList());
    }
}
