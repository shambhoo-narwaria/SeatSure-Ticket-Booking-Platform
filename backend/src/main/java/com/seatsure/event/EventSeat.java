package com.seatsure.event;

import com.seatsure.venue.VenueSeat;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_seats")
public class EventSeat {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "venue_seat_id", nullable = false)
    private VenueSeat venueSeat;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SeatStatus status = SeatStatus.AVAILABLE;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    @Column(name = "current_booking_id")
    private UUID currentBookingId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public EventSeat() {
    }

    public EventSeat(UUID id, Event event, VenueSeat venueSeat, BigDecimal price,
                     SeatStatus status, Instant holdExpiresAt, UUID currentBookingId) {
        this.id = id;
        this.event = event;
        this.venueSeat = venueSeat;
        this.price = price;
        this.status = status;
        this.holdExpiresAt = holdExpiresAt;
        this.currentBookingId = currentBookingId;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public VenueSeat getVenueSeat() {
        return venueSeat;
    }

    public void setVenueSeat(VenueSeat venueSeat) {
        this.venueSeat = venueSeat;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public SeatStatus getStatus() {
        return status;
    }

    public void setStatus(SeatStatus status) {
        this.status = status;
    }

    public Instant getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(Instant holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }

    public UUID getCurrentBookingId() {
        return currentBookingId;
    }

    public void setCurrentBookingId(UUID currentBookingId) {
        this.currentBookingId = currentBookingId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
