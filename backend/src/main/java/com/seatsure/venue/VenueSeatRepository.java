package com.seatsure.venue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VenueSeatRepository extends JpaRepository<VenueSeat, UUID> {
    List<VenueSeat> findByVenueId(UUID venueId);
}
