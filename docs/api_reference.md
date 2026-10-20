# SeatSure REST API Reference

All endpoints conform to standard REST conventions, accepting and returning JSON over HTTP/HTTPS.

- **Base URL**: `/api/v1`
- **Default Port**: `8080` (Backend API) / `5173` (Frontend Client)

---

## 1. Standard Request Headers

| Header | Type | Description |
| :--- | :--- | :--- |
| `Accept` | `string` | Must be `application/json`. |
| `Content-Type` | `string` | Required for `POST` requests: `application/json`. |
| `X-User-Id` | `UUID` | *(Optional)* Simulated authenticated user UUID. Defaults to seed customer `c0000000-0000-0000-0000-000000000001`. |
| `Idempotency-Key` | `string` | *(Optional)* Unique client request token preventing duplicate booking holds. |
| `X-Hold-Id` | `UUID` | *(Optional)* Active hold UUID when updating an existing seat selection. |

---

## 2. Event & Discovery Endpoints

### 2.1. List Live Events
Retrieves all scheduled events with live venue details and starting ticket prices.

- **Method**: `GET`
- **Path**: `/api/v1/events`
- **Response**: `200 OK`

```json
[
  {
    "id": "b0000000-0000-0000-0000-000000000001",
    "title": "Aurora Live - World Tour",
    "category": "CONCERT",
    "city": "Bengaluru",
    "venueName": "Kanteerava Indoor Stadium",
    "dateTime": "24 Oct 2026, 7:00 PM IST",
    "doorsOpen": "5:30 PM IST",
    "description": "An electrifying live concert experience.",
    "totalSeats": 60,
    "availableSeats": 54,
    "minPrice": 1200.0,
    "status": "ACTIVE",
    "imageUrl": "/images/aurora_live.jpg"
  }
]
```

---

### 2.2. Fetch Live Event Seating Inventory
Retrieves the real-time seating map for a performance, including row labels, seat numbers, tiers, prices, and status (`AVAILABLE`, `HELD`, `BOOKED`).

- **Method**: `GET`
- **Path**: `/api/v1/events/{eventId}/seats`
- **Response**: `200 OK`

```json
[
  {
    "id": "1929fa0a-b8c7-4c21-9dbd-7295ab4e3d54",
    "row": "A",
    "number": 1,
    "tier": "VIP",
    "price": 1920.0,
    "status": "AVAILABLE",
    "heldExpiresAt": null
  },
  {
    "id": "2902951a-3113-4f2b-b6f3-4bcf69146679",
    "row": "A",
    "number": 2,
    "tier": "VIP",
    "price": 1920.0,
    "status": "BOOKED",
    "heldExpiresAt": null
  }
]
```

---

## 3. Booking & Hold Engine Endpoints

### 3.1. Atomically Hold Seats
Acquires sorted pessimistic row write-locks on requested seats, verifies availability, and allocates a 5-minute temporary checkout hold.

- **Method**: `POST`
- **Path**: `/api/v1/events/{eventId}/holds`
- **Headers**:
  - `Idempotency-Key` *(optional)*
  - `X-User-Id` *(optional)*
  - `X-Hold-Id` *(optional)*
- **Request Body**:
```json
{
  "seatIds": [
    "1929fa0a-b8c7-4c21-9dbd-7295ab4e3d54",
    "4c427e6d-3602-484d-bdb2-c48c5f26323a"
  ]
}
```
- **Responses**:
  - `201 Created`: Seats successfully locked and held.
  - `400 Bad Request`: Empty or invalid seat ID payload.
  - `404 Not Found`: Event or seat does not exist.
  - `409 Conflict`: Seat is currently held by another user or already booked.

#### Success Response (`201 Created`):
```json
{
  "bookingId": "8e7ecba4-8d4c-4b51-93c9-ecbdd36cfe69",
  "eventId": "b0000000-0000-0000-0000-000000000001",
  "status": "HOLDING",
  "totalAmount": 3840.0,
  "currency": "INR",
  "expiresAt": "2026-10-21T02:15:00.000Z",
  "seatIds": [
    "1929fa0a-b8c7-4c21-9dbd-7295ab4e3d54",
    "4c427e6d-3602-484d-bdb2-c48c5f26323a"
  ]
}
```

---

### 3.2. Confirm Booking (Checkout Completion)
Transitions an active hold into a permanent booking (`CONFIRMED`) and converts all held seats to `BOOKED` in PostgreSQL.

- **Method**: `POST`
- **Path**: `/api/v1/bookings/{bookingId}/confirm`
- **Responses**:
  - `200 OK`: Booking confirmed; official admission pass issued.
  - `400 Bad Request`: Seat hold has expired or is invalid.
  - `404 Not Found`: Booking ID does not exist.

#### Success Response (`200 OK`):
```json
{
  "id": "8e7ecba4-8d4c-4b51-93c9-ecbdd36cfe69",
  "eventId": "b0000000-0000-0000-0000-000000000001",
  "eventTitle": "Aurora Live - World Tour",
  "status": "CONFIRMED",
  "totalAmount": 3840.0,
  "currency": "INR",
  "expiresAt": null,
  "createdAt": "2026-10-21T02:10:00.000Z",
  "seats": [
    {
      "seatId": "1929fa0a-b8c7-4c21-9dbd-7295ab4e3d54",
      "row": "A",
      "number": 1,
      "tier": "VIP",
      "price": 1920.0
    },
    {
      "seatId": "4c427e6d-3602-484d-bdb2-c48c5f26323a",
      "row": "A",
      "number": 2,
      "tier": "VIP",
      "price": 1920.0
    }
  ]
}
```

---

### 3.3. Release Seat Hold
Cancels an active hold and immediately restores all locked seats to `AVAILABLE` for other users.

- **Method**: `DELETE`
- **Path**: `/api/v1/bookings/{bookingId}/hold`
- **Response**: `204 No Content`

---

## 4. Passes & User Orders Endpoint

### 4.1. Get User Admission Passes & Bookings
Retrieves all orders and passes for a user in reverse chronological order (latest first).

- **Method**: `GET`
- **Path**: `/api/v1/bookings`
- **Query Parameters**:
  - `userId` *(optional)*: Filter by customer UUID.
- **Headers**:
  - `X-User-Id` *(optional)*
- **Response**: `200 OK` (Array of `BookingResponse`)

---

## 5. Standard Error Representation (RFC 7807)

When an error occurs, the server responds with a standardized problem details JSON object:

```json
{
  "title": "Seat Unavailable Conflict",
  "status": 409,
  "detail": "Seat A-6 is currently held by another user or already booked.",
  "code": "SEAT_UNAVAILABLE",
  "timestamp": "2026-10-21T02:10:05.120Z",
  "fieldErrors": null
}
```

### Standard Error Codes
| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `RESOURCE_NOT_FOUND` | `404` | Event, seat, or booking was not found. |
| `SEAT_UNAVAILABLE` | `409` | Contested seat is already held or booked. |
| `IDEMPOTENCY_CONFLICT` | `409` | Idempotency key was re-submitted with mismatched payload. |
| `VALIDATION_FAILED` | `400` | Input constraints failed (e.g., empty seat list). |
| `INTERNAL_ERROR` | `500` | Uncaught server exception. |
