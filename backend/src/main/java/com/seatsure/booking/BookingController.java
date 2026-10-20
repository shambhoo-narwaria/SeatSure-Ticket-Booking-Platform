package com.seatsure.booking;

import com.seatsure.booking.dto.BookingResponse;
import com.seatsure.booking.dto.HoldResponse;
import com.seatsure.booking.dto.HoldSeatsRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/events/{eventId}/holds")
    public ResponseEntity<HoldResponse> holdSeats(
            @PathVariable @NonNull UUID eventId,
            @Valid @RequestBody HoldSeatsRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-Hold-Id", required = false) UUID holdId
    ) {
        HoldResponse response = bookingService.holdSeats(
                eventId,
                request.seatIds(),
                userId,
                idempotencyKey,
                holdId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getBookings(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestParam(value = "userId", required = false) UUID queryUserId
    ) {
        UUID effectiveUserId = userId != null ? userId : queryUserId;
        List<BookingResponse> bookings = bookingService.getBookingsByUserId(effectiveUserId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable @NonNull UUID bookingId) {
        BookingResponse response = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable @NonNull UUID bookingId) {
        BookingResponse response = bookingService.confirmBooking(bookingId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bookings/{bookingId}/hold")
    public ResponseEntity<Void> releaseHold(@PathVariable @NonNull UUID bookingId) {
        bookingService.releaseHold(bookingId);
        return ResponseEntity.noContent().build();
    }
}
