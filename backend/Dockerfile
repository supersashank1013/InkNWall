FROM maven:3.9.6-eclipse-temurin-17

WORKDIR /app

COPY . .

# Build the project
RUN mvn clean package -DskipTests

# Run the jar (explicit name)
CMD ["sh", "-c", "java -jar target/*.jar"]