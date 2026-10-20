package com.seatsure.common.error;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
        String title,
        int status,
        String detail,
        String code,
        Instant timestamp,
        Map<String, String> fieldErrors
) {
    public static ErrorResponse of(String title, int status, String detail, String code) {
        return new ErrorResponse(title, status, detail, code, Instant.now(), null);
    }

    public static ErrorResponse of(String title, int status, String detail, String code, Map<String, String> fieldErrors) {
        return new ErrorResponse(title, status, detail, code, Instant.now(), fieldErrors);
    }
}
