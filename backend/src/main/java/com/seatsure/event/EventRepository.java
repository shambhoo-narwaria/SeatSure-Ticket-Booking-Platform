package com.seatsure.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query("SELECT e FROM Event e JOIN FETCH e.venue WHERE e.status = :status ORDER BY e.startsAt ASC")
    List<Event> findByStatusWithVenue(EventStatus status);

    @Query("SELECT e FROM Event e JOIN FETCH e.venue ORDER BY e.startsAt ASC")
    List<Event> findAllWithVenue();
}
