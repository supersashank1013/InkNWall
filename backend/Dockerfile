# Use official Java image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Build the project
RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

# Run the jar
CMD ["java", "-jar", "target/*.jar"]