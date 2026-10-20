package com.seatsure.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record HoldSeatsRequest(
        @NotEmpty(message = "seatIds must not be empty")
        List<UUID> seatIds
) {
}
