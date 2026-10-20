package com.seatsure.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that logs every user action / HTTP request entering the SeatSure backend,
 * printing endpoint, method, client IP, HTTP status, and duration into the log file.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserActivityLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(UserActivityLoggingFilter.class);

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        long startTime = System.currentTimeMillis();
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        String clientIp = request.getRemoteAddr();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            log.info("[USER_ACTION] {} {}{} -> Status: {} (took {} ms) [IP: {}]",
                    method, uri, query, status, duration, clientIp);
        }
    }
}
