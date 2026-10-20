package com.seatsure.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID eventId,
        String eventTitle,
        String status,
        BigDecimal totalAmount,
        String currency,
        Instant expiresAt,
        Instant createdAt,
        List<BookingSeatDto> seats
) {
}
