package com.opticrm.api.agent.dto;

public record AgentHeartbeatRequest(
        String agentVersion,
        String osName,
        String sageStatus,    // OK | ERROR
        String sageMessage
) {}
