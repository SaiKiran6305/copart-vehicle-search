package com.copart.vehiclesearch.vehicle;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSearchServiceTest {

    private final AiSearchService service = new AiSearchService(new ObjectMapper(), "", "test-model");

    private static String ready(String q, String make, String model, String condition,
                                Integer minYear, Integer maxYear, Integer maxPrice) {
        return "{\"status\":\"READY\",\"question\":null,\"filters\":{"
                + "\"q\":" + json(q) + ",\"make\":" + json(make) + ",\"model\":" + json(model)
                + ",\"condition\":" + json(condition) + ",\"minYear\":" + minYear + ",\"maxYear\":" + maxYear
                + ",\"maxPriceInclusive\":" + maxPrice + "}}";
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    @Test
    void matchesModelsRegardlessOfCaseOrPunctuationAndFillsInTheMake() throws Exception {
        AiSearchResponse rav4 = service.interpretOutput(ready(null, null, "rav4", null, null, null, null));
        assertEquals("READY", rav4.status());
        assertEquals("Toyota", rav4.filters().make());
        assertEquals("RAV4", rav4.filters().model());

        AiSearchResponse civic = service.interpretOutput(ready(null, null, "Civic", null, null, null, null));
        assertEquals("Honda", civic.filters().make());
        assertEquals("Civic", civic.filters().model());

        AiSearchResponse f150 = service.interpretOutput(ready(null, "ford", "f150", null, null, null, null));
        assertEquals("Ford", f150.filters().make());
        assertEquals("F-150", f150.filters().model());

        assertEquals("CR-V", service.interpretOutput(ready(null, null, "cr v", null, null, null, null)).filters().model());
        assertEquals("Model Y", service.interpretOutput(ready(null, null, "model y", null, null, null, null)).filters().model());
    }

    @Test
    void acceptsCommonMakeAndConditionWordings() throws Exception {
        AiSearchResponse chevy = service.interpretOutput(ready(null, "Chevy", null, "run and drive", null, null, null));
        assertEquals("Chevrolet", chevy.filters().make());
        assertEquals("Run & Drive", chevy.filters().condition());

        assertEquals("Water/Flood",
                service.interpretOutput(ready(null, null, null, "flood", null, null, null)).filters().condition());
        assertEquals("Minor Dent/Scratches",
                service.interpretOutput(ready(null, null, null, "minor dent / scratches", null, null, null))
                        .filters().condition());
    }

    @Test
    void keepsOtherFiltersAsReturned() throws Exception {
        AiSearchResponse response = service.interpretOutput(ready("Dallas", "Toyota", null, null, 2019, 2023, 20000));
        assertEquals("Dallas", response.filters().q());
        assertEquals("Toyota", response.filters().make());
        assertNull(response.filters().model());
        assertEquals(2019, response.filters().minYear());
        assertEquals(2023, response.filters().maxYear());
        assertEquals(0, new BigDecimal("20000").compareTo(response.filters().maxPriceInclusive()));
    }

    @Test
    void asksInsteadOfFailingWhenTheMakeAndModelDisagree() throws Exception {
        AiSearchResponse response = service.interpretOutput(ready(null, "Toyota", "Civic", null, null, null, null));
        assertEquals("CLARIFICATION", response.status());
        assertTrue(response.question().contains("Honda"));
    }

    @Test
    void asksWhenSomethingIsNotInTheListings() throws Exception {
        assertEquals("CLARIFICATION",
                service.interpretOutput(ready(null, null, "Corvette", null, null, null, null)).status());
        assertEquals("CLARIFICATION",
                service.interpretOutput(ready(null, "Porsche", null, null, null, null, null)).status());
        assertEquals("CLARIFICATION",
                service.interpretOutput(ready(null, null, null, "Burnt", null, null, null)).status());
        assertEquals("CLARIFICATION",
                service.interpretOutput(ready(null, null, null, null, null, null, null)).status());
    }

    @Test
    void passesTheModelsOwnQuestionThrough() throws Exception {
        AiSearchResponse response = service.interpretOutput(
                "{\"status\":\"CLARIFICATION\",\"question\":\"Which price range?\",\"filters\":null}");
        assertEquals("CLARIFICATION", response.status());
        assertEquals("Which price range?", response.question());
    }

    @Test
    void rejectsAnInvalidYearRange() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.interpretOutput(ready(null, "Toyota", null, null, 2024, 2019, null)));
        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
    }
}
