cat << 'EOF'
# ---- Stage 1: Build the Spring Boot app with Maven ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY Ecomm/pom.xml .
COPY Ecomm/src ./src
RUN mvn clean package -DskipTests

# ---- Stage 2: Run it with just a lightweight JRE ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
