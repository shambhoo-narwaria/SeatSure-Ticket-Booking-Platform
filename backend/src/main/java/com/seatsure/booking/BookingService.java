package com.seatsure.booking;

import com.seatsure.booking.dto.BookingResponse;
import com.seatsure.booking.dto.BookingSeatDto;
import com.seatsure.booking.dto.HoldResponse;
import com.seatsure.common.error.IdempotencyConflictException;
import com.seatsure.common.error.ResourceNotFoundException;
import com.seatsure.common.error.SeatUnavailableException;
import com.seatsure.event.Event;
import com.seatsure.event.EventRepository;
import com.seatsure.event.EventSeat;
import com.seatsure.event.EventSeatRepository;
import com.seatsure.event.SeatStatus;
import com.seatsure.user.User;
import com.seatsure.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    // Fallback seed customer ID for unauthenticated or development requests
    public static final UUID DEFAULT_CUSTOMER_ID = UUID.fromString("c0000000-0000-0000-0000-000000000001");

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final UserRepository userRepository;
    private final long holdDurationSeconds;

    public BookingService(
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            EventSeatRepository eventSeatRepository,
            UserRepository userRepository,
            @Value("${seatsure.booking.hold-duration-seconds:300}") long holdDurationSeconds
    ) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.userRepository = userRepository;
        this.holdDurationSeconds = holdDurationSeconds;
    }

    /**
     * Atomically holds requested seats for an event under a pessimistic row-level lock.
     * Prevents race conditions and guarantees that at most one customer can claim a seat.
     */
    @Transactional
    public HoldResponse holdSeats(
            @NonNull UUID eventId,
            @NonNull List<UUID> requestedSeatIds,
            UUID userId,
            String idempotencyKey
    ) {
        return holdSeats(eventId, requestedSeatIds, userId, idempotencyKey, null);
    }

    @Transactional
    public HoldResponse holdSeats(
            @NonNull UUID eventId,
            @NonNull List<UUID> requestedSeatIds,
            UUID userId,
            String idempotencyKey,
            UUID holdId
    ) {
        if (requestedSeatIds.isEmpty()) {
            throw new IllegalArgumentException("Requested seat IDs must not be empty.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        UUID resolvedUserId = userId != null ? userId : DEFAULT_CUSTOMER_ID;
        User user = userRepository.findById(resolvedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + resolvedUserId));

        // Deduplicate and sort seat IDs in a stable order to prevent circular-wait deadlocks
        List<UUID> sortedSeatIds = requestedSeatIds.stream().distinct().sorted().toList();

        // Check for idempotent request replay
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Booking> existingBookingOpt = bookingRepository.findByIdempotencyKeyAndUserId(idempotencyKey, user.getId());
            if (existingBookingOpt.isPresent()) {
                Booking existing = existingBookingOpt.get();
                List<UUID> existingSeatIds = existing.getItems().stream()
                        .map(i -> i.getEventSeat().getId())
                        .sorted()
                        .toList();

                if (existingSeatIds.equals(sortedSeatIds)) {
                    log.info("Idempotent request matched existing booking {}", existing.getId());
                    return toHoldResponse(existing, sortedSeatIds);
                } else {
                    throw new IdempotencyConflictException("Idempotency key reused with different seat selection payload.");
                }
            }
        }

        // Acquire pessimistic write lock (SELECT ... FOR UPDATE) on the ordered inventory rows
        List<EventSeat> lockedSeats = eventSeatRepository.findAndLockSeatsForEvent(sortedSeatIds, eventId);
        if (lockedSeats.size() != sortedSeatIds.size()) {
            throw new ResourceNotFoundException("One or more selected seats do not exist for event: " + eventId);
        }

        Instant now = Instant.now();

        // Verify every seat is claimable (AVAILABLE, expired hold, or part of the existing active hold being edited)
        for (EventSeat seat : lockedSeats) {
            boolean isAvailable = seat.getStatus() == SeatStatus.AVAILABLE;
            boolean isExpiredHold = seat.getStatus() == SeatStatus.HELD &&
                    seat.getHoldExpiresAt() != null &&
                    seat.getHoldExpiresAt().isBefore(now);

            boolean isPartOfCurrentHold = holdId != null &&
                    seat.getStatus() == SeatStatus.HELD &&
                    holdId.equals(seat.getCurrentBookingId());

            if (!isAvailable && !isExpiredHold && !isPartOfCurrentHold) {
                log.warn("Hold conflict: Seat {} (row {} num {}) is unavailable (status: {}, expires: {})",
                        seat.getId(), seat.getVenueSeat().getRowLabel(), seat.getVenueSeat().getSeatNumber(),
                        seat.getStatus(), seat.getHoldExpiresAt());
                throw new SeatUnavailableException(
                        "Seat " + seat.getVenueSeat().getRowLabel() + "-" + seat.getVenueSeat().getSeatNumber() + " is currently held by another user or already booked."
                );
            }
        }

        // If editing an existing hold, release any seats from that hold that were deselected
        if (holdId != null) {
            Optional<Booking> priorBookingOpt = bookingRepository.findById(holdId);
            if (priorBookingOpt.isPresent()) {
                Booking priorBooking = priorBookingOpt.get();
                if (priorBooking.getStatus() == BookingStatus.HOLDING) {
                    for (BookingItem item : priorBooking.getItems()) {
                        EventSeat priorSeat = item.getEventSeat();
                        if (!sortedSeatIds.contains(priorSeat.getId())) {
                            priorSeat.setStatus(SeatStatus.AVAILABLE);
                            priorSeat.setHoldExpiresAt(null);
                            priorSeat.setCurrentBookingId(null);
                            eventSeatRepository.save(priorSeat);
                            log.info("[HOLD_EDIT] Released deselected seat {} (row {} num {}) back to available inventory",
                                    priorSeat.getId(), priorSeat.getVenueSeat().getRowLabel(), priorSeat.getVenueSeat().getSeatNumber());
                        }
                    }
                    priorBooking.setStatus(BookingStatus.CANCELLED);
                    priorBooking.setExpiresAt(null);
                    bookingRepository.save(priorBooking);
                }
            }
        }

        // Compute total amount server-side from locked inventory snapshots
        BigDecimal totalAmount = lockedSeats.stream()
                .map(EventSeat::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Instant expiresAt = now.plusSeconds(holdDurationSeconds);

        Booking booking = new Booking(
                UUID.randomUUID(),
                user,
                event,
                BookingStatus.HOLDING,
                totalAmount,
                "INR",
                idempotencyKey,
                expiresAt
        );

        for (EventSeat seat : lockedSeats) {
            seat.setStatus(SeatStatus.HELD);
            seat.setHoldExpiresAt(expiresAt);
            seat.setCurrentBookingId(booking.getId());
            booking.addItem(new BookingItem(UUID.randomUUID(), booking, seat, seat.getPrice()));
        }

        booking = bookingRepository.save(booking);
        log.info("[BOOKING_HOLD] Created hold booking {} for event {} with {} seats. Expires at {}",
                booking.getId(), event.getTitle(), lockedSeats.size(), expiresAt);

        return toHoldResponse(booking, sortedSeatIds);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(@NonNull UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));
        return toBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUserId(UUID userId) {
        UUID resolvedUserId = userId != null ? userId : DEFAULT_CUSTOMER_ID;
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(resolvedUserId).stream()
                .map(this::toBookingResponse)
                .toList();
    }

    /**
     * Confirms an active seat hold, transitioning the booking to CONFIRMED
     * and locked event seats to BOOKED permanently in PostgreSQL.
     */
    @Transactional
    public BookingResponse confirmBooking(@NonNull UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Booking {} already confirmed, returning current state", bookingId);
            return toBookingResponse(booking);
        }

        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new IllegalStateException("Booking status is " + booking.getStatus() + ", cannot confirm.");
        }

        Instant now = Instant.now();
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(now)) {
            throw new IllegalStateException("Seat hold has expired. Please select seats again.");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setExpiresAt(null);

        for (BookingItem item : booking.getItems()) {
            EventSeat seat = item.getEventSeat();
            seat.setStatus(SeatStatus.BOOKED);
            seat.setHoldExpiresAt(null);
            eventSeatRepository.save(seat);
        }

        booking = bookingRepository.save(booking);
        log.info("[BOOKING_CONFIRMED] Booking {} confirmed with {} seats for event '{}'",
                booking.getId(), booking.getItems().size(), booking.getEvent().getTitle());

        return toBookingResponse(booking);
    }

    /**
     * Releases an active seat hold, returning the seats back to AVAILABLE
     * and marking the associated booking as CANCELLED.
     */
    @Transactional
    public void releaseHold(@NonNull UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return;
        }

        if (booking.getStatus() == BookingStatus.HOLDING) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setExpiresAt(null);

            for (BookingItem item : booking.getItems()) {
                EventSeat seat = item.getEventSeat();
                if (seat.getStatus() == SeatStatus.HELD && bookingId.equals(seat.getCurrentBookingId())) {
                    seat.setStatus(SeatStatus.AVAILABLE);
                    seat.setHoldExpiresAt(null);
                    seat.setCurrentBookingId(null);
                    eventSeatRepository.save(seat);
                }
            }

            bookingRepository.save(booking);
            log.info("[HOLD_RELEASED] Released hold for booking {} and restored {} seats to AVAILABLE",
                    bookingId, booking.getItems().size());
        }
    }

    /**
     * Finds and releases seats whose hold timestamp has passed, updating associated bookings to EXPIRED.
     */
    @Transactional
    public int releaseExpiredHolds() {
        Instant now = Instant.now();
        List<EventSeat> expiredSeats = eventSeatRepository.findExpiredHeldSeats(SeatStatus.HELD, now);

        if (expiredSeats.isEmpty()) {
            return 0;
        }

        for (EventSeat seat : expiredSeats) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHoldExpiresAt(null);
            seat.setCurrentBookingId(null);
        }

        List<Booking> expiredBookings = bookingRepository.findExpiredBookings(BookingStatus.HOLDING, now);
        for (Booking booking : expiredBookings) {
            booking.setStatus(BookingStatus.EXPIRED);
        }

        log.info("[HOLD_EXPIRY_WORKER] Released {} expired seats and expired {} bookings at {}",
                expiredSeats.size(), expiredBookings.size(), now);
        return expiredSeats.size();
    }

    private BookingResponse toBookingResponse(Booking booking) {
        List<BookingSeatDto> seatDtos = booking.getItems().stream()
                .map(item -> new BookingSeatDto(
                        item.getEventSeat().getId(),
                        item.getEventSeat().getVenueSeat().getRowLabel(),
                        item.getEventSeat().getVenueSeat().getSeatNumber(),
                        item.getEventSeat().getVenueSeat().getSeatType(),
                        item.getUnitPrice()
                ))
                .toList();

        return new BookingResponse(
                booking.getId(),
                booking.getEvent().getId(),
                booking.getEvent().getTitle(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getCurrency(),
                booking.getExpiresAt(),
                booking.getCreatedAt(),
                seatDtos
        );
    }

    private HoldResponse toHoldResponse(Booking booking, List<UUID> seatIds) {
        return new HoldResponse(
                booking.getId(),
                booking.getEvent().getId(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getCurrency(),
                booking.getExpiresAt(),
                seatIds
        );
    }
}
