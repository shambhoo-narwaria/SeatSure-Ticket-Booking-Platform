package com.seatsure.event;

import com.seatsure.event.dto.EventResponse;
import com.seatsure.event.dto.EventSeatResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable @NonNull UUID eventId) {
        EventResponse event = eventService.getEventById(eventId);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/{eventId}/seats")
    public ResponseEntity<List<EventSeatResponse>> getEventSeats(@PathVariable @NonNull UUID eventId) {
        List<EventSeatResponse> seats = eventService.getEventSeats(eventId);
        return ResponseEntity.ok(seats);
    }
}
