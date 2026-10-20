package com.seatsure.event.dto;

import java.time.Instant;
import java.util.UUID;

public record EventResponse(
        UUID id,
        String title,
        String category,
        String city,
        String venueName,
        String dateTime,
        String doorsOpen,
        String description,
        long totalSeats,
        long availableSeats,
        double minPrice,
        String status,
        String imageUrl,
        Instant startsAt,
        Instant endsAt
) {
}
