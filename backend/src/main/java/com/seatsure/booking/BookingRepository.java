package com.seatsure.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Optional<Booking> findByIdempotencyKeyAndUserId(String idempotencyKey, UUID userId);

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.expiresAt < :now")
    List<Booking> findExpiredBookings(@Param("status") BookingStatus status, @Param("now") Instant now);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"items", "items.eventSeat", "items.eventSeat.venueSeat", "event"})
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.event.id = :eventId AND b.status = :status AND b.expiresAt > :now")
    List<Booking> findActiveHoldsByUserAndEvent(
            @Param("userId") UUID userId,
            @Param("eventId") UUID eventId,
            @Param("status") BookingStatus status,
            @Param("now") Instant now
    );
}
