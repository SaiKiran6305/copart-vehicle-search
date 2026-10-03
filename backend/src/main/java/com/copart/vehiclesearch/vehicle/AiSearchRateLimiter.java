package com.copart.vehiclesearch.vehicle;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.function.LongSupplier;

/**
 * Limits how often AI search can be called so the OpenAI key cannot be used to run up costs.
 * Two fixed windows: a per-visitor limit per minute and a global limit per hour across all visitors.
 * Counters live in memory, so they reset on restart and apply per running instance.
 */
@Component
public class AiSearchRateLimiter {
    static final long MINUTE_MS = 60_000L;
    static final long HOUR_MS = 3_600_000L;
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final int perClientPerMinute;
    private final int globalPerHour;
    private final LongSupplier clock;
    private final Map<String, Window> clients = new HashMap<>();
    private long globalWindowStart;
    private int globalCount;

    @Autowired
    public AiSearchRateLimiter(
            @Value("${ai-search.rate-limit.per-client-per-minute:10}") int perClientPerMinute,
            @Value("${ai-search.rate-limit.global-per-hour:200}") int globalPerHour) {
        this(perClientPerMinute, globalPerHour, System::currentTimeMillis);
    }

    AiSearchRateLimiter(int perClientPerMinute, int globalPerHour, LongSupplier clock) {
        if (perClientPerMinute < 1 || globalPerHour < 1) {
            throw new IllegalArgumentException("AI search rate limits must be at least 1");
        }
        this.perClientPerMinute = perClientPerMinute;
        this.globalPerHour = globalPerHour;
        this.clock = clock;
        this.globalWindowStart = clock.getAsLong();
    }

    /**
     * Records one AI search for the visitor if both limits allow it.
     *
     * @return 0 when the search may run, otherwise the number of seconds to wait
     */
    public synchronized long tryAcquire(String clientKey) {
        long now = clock.getAsLong();
        if (now - globalWindowStart >= HOUR_MS) {
            globalWindowStart = now;
            globalCount = 0;
        }

        Window client = clients.get(clientKey);
        if (client == null || now - client.start >= MINUTE_MS) {
            if (client == null && clients.size() >= MAX_TRACKED_CLIENTS) {
                forgetExpiredClients(now);
            }
            client = new Window(now);
            clients.put(clientKey, client);
        }

        if (client.count >= perClientPerMinute) {
            return secondsUntil(client.start + MINUTE_MS, now);
        }
        if (globalCount >= globalPerHour) {
            return secondsUntil(globalWindowStart + HOUR_MS, now);
        }

        client.count++;
        globalCount++;
        return 0;
    }

    /**
     * Identifies the visitor. Railway's edge proxy strips any client-supplied X-Forwarded-For
     * and puts the real client IP first, so the first entry cannot be spoofed there. Behind a
     * proxy that does not do this, the global hourly limit still caps total usage.
     */
    public static String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void forgetExpiredClients(long now) {
        clients.values().removeIf(window -> now - window.start >= MINUTE_MS);
        if (clients.size() >= MAX_TRACKED_CLIENTS) {
            // Too many distinct visitors in one minute: start over rather than grow without bound.
            // The global hourly limit keeps total usage capped meanwhile.
            clients.clear();
        }
    }

    private static long secondsUntil(long resetAt, long now) {
        return Math.max(1, (resetAt - now + 999) / 1000);
    }

    private static final class Window {
        private final long start;
        private int count;

        private Window(long start) {
            this.start = start;
        }
    }
}
