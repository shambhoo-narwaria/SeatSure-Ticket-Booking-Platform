-- V3__seed_dev_data.sql
-- Seed venues, physical seats, events, and event inventory for development

-- 1. Seed Demo Venues
INSERT INTO venues (id, name, city, address, created_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Kanteerava Indoor Arena', 'Bengaluru', 'Kasturba Road, Sampangi Rama Nagar, Bengaluru, Karnataka 560001', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000002', 'The Underground Comedy Club', 'Bengaluru', '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000003', 'Nimhans Convention Center', 'Bengaluru', 'Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Physical Venue Seats (Rows A-F, Seats 1-12 = 72 seats per venue)
-- Row A & B: VIP, Row C & D: PREMIUM, Row E & F: STANDARD
INSERT INTO venue_seats (id, venue_id, section, row_label, seat_number, seat_type, created_at)
SELECT 
    gen_random_uuid(),
    v.id,
    'MAIN',
    r.row_label,
    s.seat_number,
    CASE 
        WHEN r.row_label IN ('A', 'B') THEN 'VIP'
        WHEN r.row_label IN ('C', 'D') THEN 'PREMIUM'
        ELSE 'STANDARD'
    END,
    CURRENT_TIMESTAMP
FROM venues v
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS r(row_label)
CROSS JOIN generate_series(1, 12) AS s(seat_number)
ON CONFLICT (venue_id, section, row_label, seat_number) DO NOTHING;

-- 3. Seed Demo Users
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'customer@seatsure.com', '$2a$10$7Z8VfXFfI41D7O56dErgZuvE6iJ.4O5t3jQzLp8L4X9lHq0Xq1Vqa', 'Rahul Sharma', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000002', 'admin@seatsure.com', '$2a$10$7Z8VfXFfI41D7O56dErgZuvE6iJ.4O5t3jQzLp8L4X9lHq0Xq1Vqa', 'Platform Operations Admin', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Events
INSERT INTO events (id, venue_id, title, category, description, doors_open, image_url, starts_at, ends_at, status, created_at)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Aurora Live',
        'MUSIC · BENGALURU',
        'Experience the electrifying soundscapes and hypnotic visuals of Aurora Live on their 2026 World Tour. High-fidelity acoustic production with guaranteed seating reservation.',
        '06:00 PM',
        '/images/aurora_live.jpg',
        '2026-11-14 13:30:00+00',
        '2026-11-14 17:00:00+00',
        'ACTIVE',
        CURRENT_TIMESTAMP
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'Laugh Room',
        'COMEDY · BENGALURU',
        'Bengaluru''s premier standup comedy showcase featuring five of the country''s sharpest comedic minds. Transparent seat selection with clear table view alignments.',
        '05:45 PM',
        '/images/laugh_room.jpg',
        '2026-11-15 13:00:00+00',
        '2026-11-15 15:30:00+00',
        'ACTIVE',
        CURRENT_TIMESTAMP
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'Distributed Systems Summit',
        'TECH · BENGALURU',
        'Deep dive into high-concurrency database locking, consensus protocols, and real-time event streaming architectures with principal engineers.',
        '08:30 AM',
        '/images/aurora_live.jpg',
        '2026-11-20 04:00:00+00',
        '2026-11-20 12:00:00+00',
        'ACTIVE',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Event Seats Inventory
INSERT INTO event_seats (id, event_id, venue_seat_id, price, status, hold_expires_at, current_booking_id, updated_at)
SELECT
    gen_random_uuid(),
    e.id,
    vs.id,
    CASE 
        WHEN e.id = 'b0000000-0000-0000-0000-000000000001' THEN 
            CASE vs.seat_type WHEN 'VIP' THEN 1920.00 WHEN 'PREMIUM' THEN 1500.00 ELSE 1200.00 END
        WHEN e.id = 'b0000000-0000-0000-0000-000000000002' THEN 
            CASE vs.seat_type WHEN 'VIP' THEN 1040.00 WHEN 'PREMIUM' THEN 810.00 ELSE 650.00 END
        ELSE 
            CASE vs.seat_type WHEN 'VIP' THEN 3840.00 WHEN 'PREMIUM' THEN 3000.00 ELSE 2400.00 END
    END,
    'AVAILABLE',
    NULL,
    NULL,
    CURRENT_TIMESTAMP
FROM events e
JOIN venue_seats vs ON vs.venue_id = e.venue_id
ON CONFLICT (event_id, venue_seat_id) DO NOTHING;
