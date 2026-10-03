package com.copart.vehiclesearch.vehicle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// No OpenAI key is configured here, so allowed calls return 503 without reaching OpenAI.
@SpringBootTest(properties = {
        "openai.api-key=",
        "ai-search.rate-limit.per-client-per-minute=2",
        "ai-search.rate-limit.global-per-hour=100",
        "spring.datasource.url=jdbc:h2:mem:aisearchratelimit"
})
@AutoConfigureMockMvc
class AiSearchRateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    private MockHttpServletRequestBuilder aiSearchFrom(String clientIp) {
        return post("/api/ai-search")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"query\":\"Toyota under $20,000\"}")
                .header("X-Forwarded-For", clientIp);
    }

    @Test
    void returnsTooManyRequestsWithRetryAfterOnceAVisitorReachesTheLimit() throws Exception {
        mockMvc.perform(aiSearchFrom("203.0.113.10")).andExpect(status().isServiceUnavailable());
        mockMvc.perform(aiSearchFrom("203.0.113.10")).andExpect(status().isServiceUnavailable());

        mockMvc.perform(aiSearchFrom("203.0.113.10"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.detail", startsWith("Too many AI searches.")));

        mockMvc.perform(aiSearchFrom("203.0.113.11")).andExpect(status().isServiceUnavailable());
    }
}
