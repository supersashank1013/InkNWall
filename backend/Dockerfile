FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .

# Install Maven manually
RUN apk add --no-cache maven

# Build project
RUN mvn clean package -DskipTests

# Run the jar
CMD ["java", "-jar", "target/*.jar"]