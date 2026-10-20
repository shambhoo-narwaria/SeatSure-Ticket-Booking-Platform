package com.seatsure.event;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventSeatRepository extends JpaRepository<EventSeat, UUID> {

    @Query("SELECT es FROM EventSeat es JOIN FETCH es.venueSeat vs WHERE es.event.id = :eventId ORDER BY vs.rowLabel ASC, vs.seatNumber ASC")
    List<EventSeat> findByEventIdWithVenueSeat(UUID eventId);

    long countByEventId(UUID eventId);

    long countByEventIdAndStatus(UUID eventId, SeatStatus status);

    @Query("SELECT COALESCE(MIN(es.price), 0.00) FROM EventSeat es WHERE es.event.id = :eventId")
    BigDecimal findMinPriceByEventId(UUID eventId);

    /**
     * Acquires a pessimistic write lock (SELECT ... FOR UPDATE) on the requested seats for an event.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT es FROM EventSeat es WHERE es.id IN :seatIds AND es.event.id = :eventId")
    List<EventSeat> findAndLockSeatsForEvent(@Param("seatIds") List<UUID> seatIds, @Param("eventId") UUID eventId);

    @Query("SELECT es FROM EventSeat es WHERE es.status = :status AND es.holdExpiresAt < :now")
    List<EventSeat> findExpiredHeldSeats(@Param("status") SeatStatus status, @Param("now") Instant now);

    List<EventSeat> findByCurrentBookingId(UUID currentBookingId);
}
