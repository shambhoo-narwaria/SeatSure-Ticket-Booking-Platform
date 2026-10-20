package com.seatsure.booking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingSeatDto(
        UUID seatId,
        String row,
        int number,
        String tier,
        BigDecimal price
) {
}
