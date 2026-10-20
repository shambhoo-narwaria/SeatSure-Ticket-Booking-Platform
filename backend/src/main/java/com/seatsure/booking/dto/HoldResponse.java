package com.seatsure.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record HoldResponse(
        UUID bookingId,
        UUID eventId,
        String status,
        BigDecimal totalAmount,
        String currency,
        Instant expiresAt,
        List<UUID> seatIds
) {
}
