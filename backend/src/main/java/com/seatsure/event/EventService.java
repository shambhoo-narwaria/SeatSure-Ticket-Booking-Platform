package com.seatsure.event;

import com.seatsure.common.error.ResourceNotFoundException;
import com.seatsure.event.dto.EventResponse;
import com.seatsure.event.dto.EventSeatResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class EventService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("EEE, d MMM · h:mm a", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kolkata"));

    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;

    public EventService(EventRepository eventRepository, EventSeatRepository eventSeatRepository) {
        this.eventRepository = eventRepository;
        this.eventSeatRepository = eventSeatRepository;
    }

    public List<EventResponse> getAllEvents() {
        List<Event> events = eventRepository.findAllWithVenue();
        return events.stream()
                .map(this::toEventResponse)
                .toList();
    }

    public EventResponse getEventById(@NonNull UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        return toEventResponse(event);
    }

    public List<EventSeatResponse> getEventSeats(@NonNull UUID eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with ID: " + eventId);
        }

        List<EventSeat> seats = eventSeatRepository.findByEventIdWithVenueSeat(eventId);
        return seats.stream()
                .map(this::toEventSeatResponse)
                .toList();
    }

    private EventResponse toEventResponse(Event event) {
        long totalSeats = eventSeatRepository.countByEventId(event.getId());
        long availableSeats = eventSeatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.AVAILABLE);
        BigDecimal minPrice = eventSeatRepository.findMinPriceByEventId(event.getId());

        String formattedDateTime = DATE_TIME_FORMATTER.format(event.getStartsAt());

        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getCategory(),
                event.getVenue().getCity(),
                event.getVenue().getName(),
                formattedDateTime,
                event.getDoorsOpen() != null ? event.getDoorsOpen() : "",
                event.getDescription() != null ? event.getDescription() : "",
                totalSeats,
                availableSeats,
                minPrice != null ? minPrice.doubleValue() : 0.0,
                event.getStatus().name(),
                event.getImageUrl() != null ? event.getImageUrl() : "",
                event.getStartsAt(),
                event.getEndsAt()
        );
    }

    private EventSeatResponse toEventSeatResponse(EventSeat seat) {
        Long heldExpiresAtMillis = seat.getHoldExpiresAt() != null
                ? seat.getHoldExpiresAt().toEpochMilli()
                : null;

        return new EventSeatResponse(
                seat.getId(),
                seat.getVenueSeat().getRowLabel(),
                seat.getVenueSeat().getSeatNumber(),
                seat.getVenueSeat().getSeatType(),
                seat.getPrice().doubleValue(),
                seat.getStatus().name(),
                heldExpiresAtMillis
        );
    }
}
