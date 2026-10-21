# Multi-stage Dockerfile for GridDispatch Backend (Java 21)
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

COPY pom.xml /workspace/pom.xml
COPY apps/agentguard/backend/pom.xml /workspace/apps/agentguard/backend/pom.xml
COPY apps/griddispatch/backend/pom.xml /workspace/apps/griddispatch/backend/pom.xml
RUN mvn dependency:go-offline -B -pl apps/griddispatch/backend -am || true

COPY apps/griddispatch/backend/src /workspace/apps/griddispatch/backend/src
RUN mvn clean package -DskipTests -pl apps/griddispatch/backend -am

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /workspace/apps/griddispatch/backend/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=docker
EXPOSE 8082

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
