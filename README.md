# SeatSure — Smart Ticket Booking Platform

SeatSure is a portfolio-grade, high-concurrency ticket reservation platform built with **Java 21 / Spring Boot 3**, **PostgreSQL**, and **React + TypeScript + Vite**.

> **Core Engineering Goal:** Guarantee seat reservation correctness under concurrent requests. Two users can request the exact same seat at the same millisecond, but at most one can successfully claim it.

---

## Tech Stack

- **Backend:** Java 21 / 25, Spring Boot 3.3+, Spring Data JPA, Spring Security, Flyway, PostgreSQL Driver
- **Database:** PostgreSQL 16 (Authoritative source of truth for seat locking and state)
- **Frontend:** React 18 / 19, TypeScript, Vite, TailwindCSS / CSS Modules
- **Testing:** JUnit 5, Mockito, Testcontainers (real PostgreSQL for concurrency tests)
- **DevOps:** Docker, Docker Compose, GitHub Actions

---

## Architecture & Core Engineering Highlights

- **Modular Monolith:** Decoupled business capabilities (`auth`, `venue`, `event`, `booking`, `payment`, `admin`) in a single deployable application.
- **Sorted Pessimistic Locking:** Prevents database deadlocks by ordering requested seat IDs before acquiring row-level write locks (`SELECT ... FOR UPDATE`).
- **State Verification Under Lock:** Evaluates seat state and server-side hold expiry atomically inside a short transaction.
- **Idempotency & Deduplication:** Protects hold requests with client idempotency keys and payment webhooks with provider event deduplication.
- **Background Cleanup Worker:** Housekeeping job (`HoldExpiryJob`) releasing expired holds without compromising immediate on-the-fly reclaims.

---

## Repository Structure

```text
seatsure/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── backend/                  # Spring Boot 3 REST API
├── frontend/                 # Vite + React + TypeScript App
├── docs/                     # Architecture & implementation specifications
│   └── SeatSure_Implementation_Roadmap.md
└── learning/                 # System design & interview preparation guides
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Java 21+** (`java -version`)
- **Maven 3.9+** (`mvn -version`)
- **Node.js 20+** & npm (`node -v`, `npm -v`)
- **Docker Desktop** (`docker --version`)

### 2. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 3. Run Backend
```bash
cd backend
mvn spring-boot:run
```
Backend starts on `http://localhost:8080`.

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## Documentation & Roadmap
For the detailed architectural specification, schema design, state machines, and phase-by-phase implementation details, refer to:
- [SeatSure Implementation Roadmap](docs/SeatSure_Implementation_Roadmap.md)
