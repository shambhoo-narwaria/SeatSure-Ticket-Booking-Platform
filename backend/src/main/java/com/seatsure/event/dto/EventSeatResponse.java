package com.seatsure.event.dto;

import java.util.UUID;

public record EventSeatResponse(
        UUID id,
        String row,
        int number,
        String tier,
        double price,
        String status,
        Long heldExpiresAt
) {
}
