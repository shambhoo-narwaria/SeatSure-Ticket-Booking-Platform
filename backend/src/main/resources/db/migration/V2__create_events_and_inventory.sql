-- V2__create_events_and_inventory.sql
-- Events, bookings, inventory, and payment schemas

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    doors_open VARCHAR(50),
    image_url VARCHAR(500),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    idempotency_key VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_user_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS event_seats (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_seat_id UUID NOT NULL REFERENCES venue_seats(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    hold_expires_at TIMESTAMPTZ,
    current_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_venue_seat UNIQUE (event_id, venue_seat_id)
);

CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_seat_id UUID NOT NULL REFERENCES event_seats(id) ON DELETE RESTRICT,
    unit_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_event_seat UNIQUE (booking_id, event_seat_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(255) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, provider_event_id)
);

-- Workload performance indexes
CREATE INDEX idx_events_status_starts_at ON events(status, starts_at);
CREATE INDEX idx_event_seats_event_status ON event_seats(event_id, status);
CREATE INDEX idx_event_seats_current_booking ON event_seats(current_booking_id);
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_status_expires ON bookings(status, expires_at);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_payments_booking_created ON payments(booking_id, created_at DESC);
