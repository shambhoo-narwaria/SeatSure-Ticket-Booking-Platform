package com.seatsure.event;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EventControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/events should return list of seeded events with venue details")
    void shouldReturnAllEvents() throws Exception {
        mockMvc.perform(get("/api/v1/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[0].title", notNullValue()))
                .andExpect(jsonPath("$[0].venueName", notNullValue()))
                .andExpect(jsonPath("$[0].city", notNullValue()))
                .andExpect(jsonPath("$[0].totalSeats", greaterThan(0)))
                .andExpect(jsonPath("$[0].minPrice", greaterThan(0.0)));
    }

    @Test
    @DisplayName("GET /api/v1/events/{id} should return single event details")
    void shouldReturnEventById() throws Exception {
        UUID auroraEventId = UUID.fromString("b0000000-0000-0000-0000-000000000001");

        mockMvc.perform(get("/api/v1/events/{id}", auroraEventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(auroraEventId.toString())))
                .andExpect(jsonPath("$.title", is("Aurora Live")))
                .andExpect(jsonPath("$.city", is("Bengaluru")))
                .andExpect(jsonPath("$.venueName", is("Kanteerava Indoor Arena")));
    }

    @Test
    @DisplayName("GET /api/v1/events/{id}/seats should return 72 seats with rows and tiers")
    void shouldReturnEventSeats() throws Exception {
        UUID auroraEventId = UUID.fromString("b0000000-0000-0000-0000-000000000001");

        mockMvc.perform(get("/api/v1/events/{id}/seats", auroraEventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(72)))
                .andExpect(jsonPath("$[0].row", is("A")))
                .andExpect(jsonPath("$[0].number", is(1)))
                .andExpect(jsonPath("$[0].tier", is("VIP")))
                .andExpect(jsonPath("$[0].status", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/events/{id} with unknown ID should return 404 Not Found")
    void shouldReturn404ForUnknownEvent() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/events/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.code", is("RESOURCE_NOT_FOUND")));
    }
}
