package com.copart.vehiclesearch.vehicle;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiSearchRateLimiterTest {

    private long now = 1_000_000L;

    private AiSearchRateLimiter limiter(int perClientPerMinute, int globalPerHour) {
        return new AiSearchRateLimiter(perClientPerMinute, globalPerHour, () -> now);
    }

    @Test
    void allowsUpToThePerVisitorLimitThenReportsTheWait() {
        AiSearchRateLimiter limiter = limiter(3, 100);

        for (int i = 0; i < 3; i++) {
            assertEquals(0, limiter.tryAcquire("203.0.113.1"));
        }
        assertEquals(60, limiter.tryAcquire("203.0.113.1"));

        now += 15_000;
        assertEquals(45, limiter.tryAcquire("203.0.113.1"));
    }

    @Test
    void allowsTheVisitorAgainAfterTheMinute() {
        AiSearchRateLimiter limiter = limiter(1, 100);

        assertEquals(0, limiter.tryAcquire("203.0.113.1"));
        assertEquals(60, limiter.tryAcquire("203.0.113.1"));

        now += AiSearchRateLimiter.MINUTE_MS;
        assertEquals(0, limiter.tryAcquire("203.0.113.1"));
    }

    @Test
    void countsVisitorsSeparately() {
        AiSearchRateLimiter limiter = limiter(1, 100);

        assertEquals(0, limiter.tryAcquire("203.0.113.1"));
        assertEquals(0, limiter.tryAcquire("203.0.113.2"));
        assertEquals(60, limiter.tryAcquire("203.0.113.1"));
    }

    @Test
    void appliesTheHourlyLimitAcrossAllVisitors() {
        AiSearchRateLimiter limiter = limiter(10, 2);

        assertEquals(0, limiter.tryAcquire("203.0.113.1"));
        assertEquals(0, limiter.tryAcquire("203.0.113.2"));
        assertEquals(3600, limiter.tryAcquire("203.0.113.3"));

        now += AiSearchRateLimiter.HOUR_MS;
        assertEquals(0, limiter.tryAcquire("203.0.113.3"));
    }

    @Test
    void rejectedCallsDoNotUseUpTheHourlyLimit() {
        AiSearchRateLimiter limiter = limiter(1, 2);

        assertEquals(0, limiter.tryAcquire("203.0.113.1"));
        assertEquals(60, limiter.tryAcquire("203.0.113.1"));
        assertEquals(0, limiter.tryAcquire("203.0.113.2"));
        assertEquals(3600, limiter.tryAcquire("203.0.113.3"));
    }

    @Test
    void rejectsLimitsBelowOne() {
        assertThrows(IllegalArgumentException.class, () -> limiter(0, 100));
        assertThrows(IllegalArgumentException.class, () -> limiter(10, 0));
    }

    @Test
    void identifiesTheVisitorByTheFirstForwardedAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        assertEquals("10.0.0.1", AiSearchRateLimiter.clientKey(request));

        request.addHeader("X-Real-IP", "198.51.100.7");
        assertEquals("198.51.100.7", AiSearchRateLimiter.clientKey(request));

        request.addHeader("X-Forwarded-For", "203.0.113.5, 10.1.1.1");
        assertEquals("203.0.113.5", AiSearchRateLimiter.clientKey(request));
    }
}
