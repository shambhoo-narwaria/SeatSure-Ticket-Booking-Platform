# Setup, Local Development & Deployment Guide

## 1. Prerequisites

Before running SeatSure locally, verify the following tools are installed:

| Tool | Minimum Version | Verification Command |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | Java 21 LTS | `java -version` |
| **Apache Maven** | 3.9+ (or included wrapper) | `.\mvnw -v` or `mvn -v` |
| **Node.js & npm** | Node.js 20+ / npm 10+ | `node -v` && `npm -v` |
| **Docker Desktop** | Docker 24+ / Compose v2 | `docker compose version` |

---

## 2. Quick Start (Local Development)

### Step 1: Start PostgreSQL via Docker Compose
Start the isolated PostgreSQL 16 database instance:
```bash
docker compose up -d postgres
```
*Note: This starts PostgreSQL on port `5432` with database `seatsure`, user `seatsure_app`, and password `seatsure_dev_password`.*

### Step 2: Launch the Spring Boot Backend
From the repository root:
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# Linux / macOS:
./mvnw spring-boot:run
```
- Flyway automatically applies migrations (`V1`, `V2`, `V3`) to set up tables and seed demo events.
- Backend starts on `http://localhost:8080`.
- Health check verification: `curl http://localhost:8080/actuator/health` -> `{"status":"UP"}`.

### Step 3: Launch the React + Vite Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Frontend starts on `http://localhost:5173`.
- Open `http://localhost:5173` in your browser.

---

## 3. Configuration & Environment Variables

SeatSure provides a pre-configured template in [`.env.example`](file:///c:/Users/shambhoo/Desktop/SeatSure/.env.example):

```bash
# Database Configuration
POSTGRES_DB=seatsure
POSTGRES_USER=seatsure_app
POSTGRES_PASSWORD=seatsure_dev_password
DATABASE_URL=jdbc:postgresql://localhost:5432/seatsure

# Server Configuration
SERVER_PORT=8080
FRONTEND_ORIGIN=http://localhost:5173
HOLD_DURATION_SECONDS=300
SPRING_PROFILES_ACTIVE=local
```

### Key Spring Boot Properties ([`application.yml`](file:///c:/Users/shambhoo/Desktop/SeatSure/backend/src/main/resources/application.yml))
- `seatsure.booking.hold-duration-seconds`: Duration for temporary checkout reservation (default: `300` seconds / 5 minutes).
- `seatsure.booking.hold-expiry-sweep-rate-ms`: Interval for the background sweeper worker [`HoldExpiryJob`](file:///c:/Users/shambhoo/Desktop/SeatSure/backend/src/main/java/com/seatsure/booking/HoldExpiryJob.java) (default: `10000` ms / 10 seconds).

---

## 4. Running the Automated Test Suites

### 4.1. Run Backend Unit & Integration Tests
```bash
cd backend
.\mvnw.cmd test
```

### 4.2. Run Real PostgreSQL Concurrency Tests (Testcontainers)
SeatSure includes genuine database concurrency stress tests:
```bash
cd backend
.\mvnw.cmd test -Dtest=BookingHoldIntegrationTest
```
*Note: Docker must be running to allow Testcontainers to spin up a temporary PostgreSQL instance.*

### 4.3. Run Frontend Typecheck & Build Validation
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 5. Production Build & Packaging

### 5.1. Build Backend Executable JAR
```bash
cd backend
.\mvnw.cmd clean package -DskipTests
```
Generates a standalone runnable JAR under `backend/target/seatsure-backend-0.0.1-SNAPSHOT.jar`. Run with:
```bash
java -jar backend/target/seatsure-backend-0.0.1-SNAPSHOT.jar
```

### 5.2. Build Frontend Production Bundle
```bash
cd frontend
npm run build
```
Generates optimized static assets under `frontend/dist/`.
