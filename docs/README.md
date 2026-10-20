# SeatSure Technical Documentation

Welcome to the technical documentation for **SeatSure**, a high-concurrency ticket booking and seat reservation platform built with **Spring Boot 3**, **PostgreSQL 16**, and **React 18 / TypeScript / Vite**.

---

## Documentation Index

| Document | Description |
| :--- | :--- |
| **[Architecture & System Design](architecture.md)** | High-level modular monolith design, layer separation, data flow, and sequence diagrams. |
| **[Concurrency & Locking Engine](concurrency_and_locking.md)** | Deep-dive into sorted pessimistic row-level locking, deadlock prevention, atomic state verification, and idempotency. |
| **[Database Schema & State Machines](database_schema.md)** | PostgreSQL relational schema, Flyway migrations, ER diagram, indexing strategies, and lifecycle state machines. |
| **[REST API Reference](api_reference.md)** | Full OpenAPI/REST specification covering events, inventory, hold requests, checkout, passes, and error responses. |
| **[Setup & Deployment Guide](setup_and_deployment.md)** | Step-by-step instructions for local Docker setup, database initialization, running tests, and production builds. |
| **[Implementation Roadmap](implementation_roadmap.md)** | Phase-by-phase engineering plan, milestones, requirements, and testing matrices. |

---

## Core System Overview

```
                                 [ Web Client (React + TypeScript) ]
                                                 │
                                                 │ HTTPS / JSON REST
                                                 ▼
                                  [ Spring Boot Modular Monolith ]
                                                 │
               ┌───────────────────┬─────────────┴─────────────┬───────────────────┐
               ▼                   ▼                           ▼                   ▼
        [ Auth Domain ]    [ Event & Venue ]           [ Booking Engine ]   [ Platform Admin ]
               │                   │                           │                   │
               └───────────────────┴─────────────┬─────────────┴───────────────────┘
                                                 │
                                                 ▼ (Sorted SELECT ... FOR UPDATE)
                                      [ PostgreSQL 16 Database ]
                                        (Authoritative State)
```

### Key Engineering Guarantees

1. **Zero Double-Bookings**: Guaranteed at the database level via ordered row-level write locks (`SELECT ... FOR UPDATE`) executed within isolated database transactions.
2. **Deadlock Immunity**: In concurrent multi-seat requests (e.g., User A selects seats [1, 2] while User B selects seats [2, 1]), circular-wait conditions are mathematically impossible because seat IDs are deduplicated and sorted into a global deterministic order prior to lock acquisition.
3. **5-Minute Temporary Hold Window**: Selected seats are reserved for 5 minutes during checkout. If the user completes payment, seats transition to `BOOKED`. If abandoned, seats are returned to `AVAILABLE` either on-the-fly or by a scheduled background worker (`HoldExpiryJob`).
4. **Idempotency Protection**: Client-provided `Idempotency-Key` headers guarantee that network retries or double-submissions return the identical reservation without creating duplicate transactions or double-charging.
5. **Centralized Multi-Pass Experience**: All confirmed tickets appear in **My Bookings** as verified digital admission passes with scannable turnstile QR codes, reference codes, seat breakdown, and one-click re-booking.
