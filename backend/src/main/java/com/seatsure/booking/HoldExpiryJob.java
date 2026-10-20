package com.seatsure.booking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background worker that scans and releases expired seat holds every 5 seconds.
 */
@Component
public class HoldExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(HoldExpiryJob.class);

    private final BookingService bookingService;

    public HoldExpiryJob(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelayString = "${seatsure.booking.expiry-interval-ms:5000}")
    public void sweepExpiredHolds() {
        try {
            int releasedCount = bookingService.releaseExpiredHolds();
            if (releasedCount > 0) {
                log.info("Expired holds sweep completed: {} seats returned to inventory.", releasedCount);
            }
        } catch (Exception e) {
            log.error("Error occurred while sweeping expired holds: {}", e.getMessage(), e);
        }
    }
}
