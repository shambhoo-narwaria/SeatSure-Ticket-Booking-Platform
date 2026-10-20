package com.seatsure.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seatsure.booking.dto.HoldSeatsRequest;
import com.seatsure.event.EventSeat;
import com.seatsure.event.EventSeatRepository;
import com.seatsure.event.SeatStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BookingHoldIntegrationTest {

    private static final UUID AURORA_EVENT_ID = UUID.fromString("b0000000-0000-0000-0000-000000000001");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EventSeatRepository eventSeatRepository;

    @Autowired
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        // Reset any held seats for aurora event before each test
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        for (EventSeat seat : seats) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHoldExpiresAt(null);
            seat.setCurrentBookingId(null);
            eventSeatRepository.save(seat);
        }
    }

    @Test
    @DisplayName("Customer can atomically hold available seats and receive 201 Created with expiresAt")
    void shouldSuccessfullyHoldAvailableSeats() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seat1 = seats.get(0).getId();
        UUID seat2 = seats.get(1).getId();

        HoldSeatsRequest request = new HoldSeatsRequest(List.of(seat1, seat2));

        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId", notNullValue()))
                .andExpect(jsonPath("$.eventId", is(AURORA_EVENT_ID.toString())))
                .andExpect(jsonPath("$.status", is("HOLDING")))
                .andExpect(jsonPath("$.totalAmount", greaterThan(0.0)))
                .andExpect(jsonPath("$.currency", is("INR")))
                .andExpect(jsonPath("$.expiresAt", notNullValue()))
                .andExpect(jsonPath("$.seatIds", hasSize(2)));

        // Verify database state updated
        EventSeat updatedSeat1 = eventSeatRepository.findById(seat1).orElseThrow();
        assertEquals(SeatStatus.HELD, updatedSeat1.getStatus());
        assertNotNull(updatedSeat1.getHoldExpiresAt());
        assertNotNull(updatedSeat1.getCurrentBookingId());
    }

    @Test
    @DisplayName("Second customer receives 409 Conflict when attempting to hold an already held seat")
    void shouldReturn409WhenSeatIsAlreadyHeld() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID targetSeat = seats.get(5).getId();

        // Customer 1 holds the seat
        HoldSeatsRequest request1 = new HoldSeatsRequest(List.of(targetSeat));
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Customer 2 attempts to hold the same seat
        HoldSeatsRequest request2 = new HoldSeatsRequest(List.of(targetSeat));
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SEAT_UNAVAILABLE")))
                .andExpect(jsonPath("$.title", is("Seat Conflict")));
    }

    @Test
    @DisplayName("Multi-seat hold request fails atomically if any single seat is unavailable")
    void shouldFailAtomicallyWhenOneSeatInSelectionIsUnavailable() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seatA = seats.get(10).getId();
        UUID seatB = seats.get(11).getId();
        UUID seatC = seats.get(12).getId();

        // Pre-hold seatB
        HoldSeatsRequest preHold = new HoldSeatsRequest(List.of(seatB));
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(preHold)))
                .andExpect(status().isCreated());

        // Request seats A, B, and C together
        HoldSeatsRequest multiRequest = new HoldSeatsRequest(List.of(seatA, seatB, seatC));
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(multiRequest)))
                .andExpect(status().isConflict());

        // Verify neither seatA nor seatC were partially claimed
        EventSeat checkA = eventSeatRepository.findById(seatA).orElseThrow();
        EventSeat checkC = eventSeatRepository.findById(seatC).orElseThrow();
        assertEquals(SeatStatus.AVAILABLE, checkA.getStatus());
        assertEquals(SeatStatus.AVAILABLE, checkC.getStatus());
    }

    @Test
    @DisplayName("Idempotency: Replaying with identical key returns original booking; different payload returns 409")
    void shouldHandleIdempotentRequestsCorrectly() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seat1 = seats.get(20).getId();
        UUID seat2 = seats.get(21).getId();
        String idempotencyKey = "idemp-" + UUID.randomUUID();

        HoldSeatsRequest initialRequest = new HoldSeatsRequest(List.of(seat1));

        // Initial request
        String firstResponse = mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String bookingId = objectMapper.readTree(firstResponse).get("bookingId").asText();

        // Replay with identical key and identical seat selection -> Returns original booking
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId", is(bookingId)))
                .andExpect(jsonPath("$.status", is("HOLDING")))
                .andExpect(jsonPath("$.seatIds", hasSize(1)));

        // Replay with identical key but DIFFERENT seats -> 409 Conflict
        HoldSeatsRequest differentRequest = new HoldSeatsRequest(List.of(seat2));
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(differentRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("IDEMPOTENCY_CONFLICT")));
    }

    @Test
    @DisplayName("Concurrency: Simultaneous threads attempting to hold the same seat results in exactly ONE winner")
    void shouldPreventDoubleBookingUnderConcurrentRequests() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID contestedSeat = seats.get(30).getId();

        int numberOfThreads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all threads to fire simultaneously
                    mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                                    .header("X-User-Id", BookingService.DEFAULT_CUSTOMER_ID.toString())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(contestedSeat)))))
                            .andDo(result -> {
                                int statusCode = result.getResponse().getStatus();
                                if (statusCode == 201) {
                                    successCount.incrementAndGet();
                                } else if (statusCode == 409) {
                                    conflictCount.incrementAndGet();
                                }
                            });
                } catch (Exception e) {
                    // Ignored in concurrent test harness
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Fire all threads simultaneously
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS), "Concurrent hold execution timed out");
        executor.shutdown();

        // Exactly one thread wins the seat; all others receive 409 Conflict
        assertEquals(1, successCount.get(), "Exactly one request should successfully hold the seat");
        assertEquals(numberOfThreads - 1, conflictCount.get(), "All competing requests should receive 409 Conflict");
    }

    @Test
    @DisplayName("Hold expiry worker resets expired held seats back to AVAILABLE")
    void shouldReleaseExpiredSeats() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seat = seats.get(40).getId();

        // Hold seat
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(seat)))))
                .andExpect(status().isCreated());

        // Artificially age the hold into the past
        EventSeat heldSeat = eventSeatRepository.findById(seat).orElseThrow();
        heldSeat.setHoldExpiresAt(java.time.Instant.now().minusSeconds(10));
        eventSeatRepository.save(heldSeat);

        // Run expiry sweep
        int released = bookingService.releaseExpiredHolds();
        assertTrue(released >= 1, "At least one expired seat should be released");

        // Verify seat is available again
        EventSeat refreshed = eventSeatRepository.findById(seat).orElseThrow();
        assertEquals(SeatStatus.AVAILABLE, refreshed.getStatus());
        assertNull(refreshed.getHoldExpiresAt());
        assertNull(refreshed.getCurrentBookingId());
    }

    @Test
    @DisplayName("GET /api/v1/bookings/{id} returns booking details with seat metadata")
    void shouldReturnBookingDetails() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seat = seats.get(45).getId();

        String responseStr = mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(seat)))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String bookingId = objectMapper.readTree(responseStr).get("bookingId").asText();

        mockMvc.perform(get("/api/v1/bookings/{id}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(bookingId)))
                .andExpect(jsonPath("$.status", is("HOLDING")))
                .andExpect(jsonPath("$.eventTitle", is("Aurora Live")))
                .andExpect(jsonPath("$.seats", hasSize(1)))
                .andExpect(jsonPath("$.seats[0].seatId", is(seat.toString())));
    }

    @Test
    @DisplayName("DELETE /api/v1/bookings/{id}/hold releases seats back to AVAILABLE")
    void shouldReleaseHoldAndReturnSeatsToAvailable() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seat = seats.get(50).getId();

        String responseStr = mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(seat)))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String bookingId = objectMapper.readTree(responseStr).get("bookingId").asText();

        // Verify held
        EventSeat heldSeat = eventSeatRepository.findById(seat).orElseThrow();
        assertEquals(SeatStatus.HELD, heldSeat.getStatus());

        // Release hold
        mockMvc.perform(delete("/api/v1/bookings/{id}/hold", bookingId))
                .andExpect(status().isNoContent());

        // Verify released
        EventSeat releasedSeat = eventSeatRepository.findById(seat).orElseThrow();
        assertEquals(SeatStatus.AVAILABLE, releasedSeat.getStatus());
        assertNull(releasedSeat.getHoldExpiresAt());
        assertNull(releasedSeat.getCurrentBookingId());
    }

    @Test
    @DisplayName("Same customer can edit hold (keep seat, add new seat, deselect seat) without conflict")
    void sameUserCanEditHoldByAddingAndDeselectingSeats() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID seatA = seats.get(52).getId();
        UUID seatB = seats.get(53).getId();
        UUID seatC = seats.get(54).getId();

        UUID customerId = UUID.fromString("c0000000-0000-0000-0000-000000000001");

        // 1. Customer holds seatA and seatB
        String holdRes1 = mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("X-User-Id", customerId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(seatA, seatB)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seatIds", hasSize(2)))
                .andReturn().getResponse().getContentAsString();

        String holdId = objectMapper.readTree(holdRes1).get("bookingId").asText();

        // 2. Customer edits hold: retains seatA, adds seatC, deselected seatB
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("X-User-Id", customerId.toString())
                        .header("X-Hold-Id", holdId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(seatA, seatC)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seatIds", hasSize(2)));

        // 3. Verify seatA is HELD, seatC is HELD, and deselected seatB is released back to AVAILABLE
        EventSeat updatedA = eventSeatRepository.findById(seatA).orElseThrow();
        EventSeat updatedB = eventSeatRepository.findById(seatB).orElseThrow();
        EventSeat updatedC = eventSeatRepository.findById(seatC).orElseThrow();

        assertEquals(SeatStatus.HELD, updatedA.getStatus(), "Retained seat A must remain HELD");
        assertEquals(SeatStatus.AVAILABLE, updatedB.getStatus(), "Deselected seat B must be restored to AVAILABLE");
        assertEquals(SeatStatus.HELD, updatedC.getStatus(), "Newly selected seat C must now be HELD");
    }

    @Test
    @DisplayName("Second user cannot claim or hold seat held by another user (receives 409 Conflict)")
    void secondUserCannotHoldOrBuySeatHeldByFirstUser() throws Exception {
        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(AURORA_EVENT_ID);
        UUID targetSeat = seats.get(56).getId();

        UUID customer1 = UUID.fromString("c0000000-0000-0000-0000-000000000001");
        UUID customer2 = UUID.fromString("c0000000-0000-0000-0000-000000000002");

        // User 1 holds the seat
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("X-User-Id", customer1.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(targetSeat)))))
                .andExpect(status().isCreated());

        // User 2 attempts to claim the same held seat
        mockMvc.perform(post("/api/v1/events/{id}/holds", AURORA_EVENT_ID)
                        .header("X-User-Id", customer2.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HoldSeatsRequest(List.of(targetSeat)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SEAT_UNAVAILABLE")))
                .andExpect(jsonPath("$.detail", containsString("currently held by another user")));
    }
}
