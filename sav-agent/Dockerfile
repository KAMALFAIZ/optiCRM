# =============================================================================
# SAV Agent - Docker image
# =============================================================================
# Build :  docker build -t opticrm/sav-agent:1.0.0 .
# Run   :  docker run -d \
#             -e AGENT_API_KEY=your_key \
#             -e AGENT_CENTRAL_URL=wss://crm.example.com/ws/agent \
#             -e AGENT_NAME=SAV-Agent-Docker \
#             --name sav-agent \
#             opticrm/sav-agent:1.0.0
# =============================================================================

# --- Stage 1: Build ---
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="OptiCRM <support@opticrm.com>"
LABEL description="SAV Agent - OptiCRM Local Agent"
LABEL version="1.0.0"

# Créer un utilisateur non-root
RUN addgroup -S agent && adduser -S agent -G agent

WORKDIR /app

# Créer les répertoires nécessaires
RUN mkdir -p /app/logs /app/config /app/exports /app/imports && \
    chown -R agent:agent /app

# Copier le JAR
COPY --from=build /build/target/sav-agent.jar /app/sav-agent.jar

# Utilisateur non-root
USER agent

# Port health check
EXPOSE 9091

# Variables d'environnement par défaut
ENV JAVA_OPTS="-Xms128m -Xmx512m" \
    AGENT_API_KEY="" \
    AGENT_CENTRAL_URL="wss://crm.example.com/ws/agent" \
    AGENT_NAME="SAV-Agent-Docker" \
    AGENT_MGMT_PORT="9091" \
    LOCAL_DB_ENABLED="false" \
    LOCAL_HTTP_ENABLED="true" \
    LOCAL_HTTP_BASE_URL="http://host.docker.internal:8090" \
    SHELL_ENABLED="false"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:9091/actuator/health || exit 1

# Démarrage
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/sav-agent.jar"]
