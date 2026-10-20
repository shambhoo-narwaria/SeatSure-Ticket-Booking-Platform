package com.seatsure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SeatSureApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatSureApplication.class, args);
    }
}
