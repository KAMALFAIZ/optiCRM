# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom files first for dependency caching
COPY pom.xml .
COPY crm-common/pom.xml crm-common/
COPY crm-security/pom.xml crm-security/
COPY crm-core/pom.xml crm-core/
COPY crm-stock/pom.xml crm-stock/
COPY crm-finance/pom.xml crm-finance/
COPY crm-communication/pom.xml crm-communication/
COPY crm-reporting/pom.xml crm-reporting/
COPY crm-api/pom.xml crm-api/

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY crm-common/src crm-common/src
COPY crm-security/src crm-security/src
COPY crm-core/src crm-core/src
COPY crm-stock/src crm-stock/src
COPY crm-finance/src crm-finance/src
COPY crm-communication/src crm-communication/src
COPY crm-reporting/src crm-reporting/src
COPY crm-api/src crm-api/src

# Build the application
RUN mvn clean package -DskipTests -pl crm-api -am

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar
COPY --from=build /app/crm-api/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
