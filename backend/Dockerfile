# --- Etapa 1: build ---
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copiamos primero el wrapper y el pom para cachear las dependencias
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

# Ahora copiamos el resto del codigo y compilamos
COPY src ./src
RUN ./mvnw -B clean package -DskipTests

# --- Etapa 2: runtime ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S mercado && adduser -S mercado -G mercado
COPY --from=build /app/target/*.jar app.jar
RUN chown mercado:mercado app.jar
USER mercado

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=docker
ENV TZ=America/Argentina/Buenos_Aires

ENTRYPOINT ["java", "-Duser.timezone=America/Argentina/Buenos_Aires", "-jar", "app.jar"]
