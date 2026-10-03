package com.copart.vehiclesearch.vehicle;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSearchServiceTest {

    private final AiSearchService service = new AiSearchService(new ObjectMapper(), "", "test-model");

    private static String ready(String q, String make, String model, String primaryDamage, String condition,
                                Integer minYear, Integer maxYear, Integer maxPrice) {
        return "{\"status\":\"READY\",\"question\":null,\"filters\":{"
                + "\"q\":" + json(q) + ",\"make\":" + json(make) + ",\"model\":" + json(model)
                + ",\"primaryDamage\":" + json(primaryDamage) + ",\"condition\":" + json(condition)
                + ",\"minYear\":" + minYear + ",\"maxYear\":" + maxYear
                + ",\"maxPriceInclusive\":" + maxPrice + "}}";
    }

    private static String model(String make, String model) {
        return ready(null, make, model, null, null, null, null, null);
    }

    private static String damageAndCondition(String damage, String condition) {
        return ready(null, null, null, damage, condition, null, null, null);
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    @Test
    void matchesModelsRegardlessOfCaseOrPunctuationAndFillsInTheMake() throws Exception {
        AiSearchResponse rav4 = service.interpretOutput(model(null, "rav4"));
        assertEquals("READY", rav4.status());
        assertEquals("Toyota", rav4.filters().make());
        assertEquals("RAV4", rav4.filters().model());

        AiSearchResponse civic = service.interpretOutput(model(null, "Civic"));
        assertEquals("Honda", civic.filters().make());
        assertEquals("Civic", civic.filters().model());

        AiSearchResponse f150 = service.interpretOutput(model("ford", "f150"));
        assertEquals("Ford", f150.filters().make());
        assertEquals("F-150", f150.filters().model());

        assertEquals("CR-V", service.interpretOutput(model(null, "cr v")).filters().model());
        assertEquals("Model Y", service.interpretOutput(model(null, "model y")).filters().model());
    }

    @Test
    void keepsPrimaryDamageAndConditionSeparate() throws Exception {
        AiSearchResponse response = service.interpretOutput(damageAndCondition("flood", "runs and drives"));
        assertEquals("Water/Flood", response.filters().primaryDamage());
        assertEquals("Run and Drive", response.filters().condition());

        assertEquals("Minor Dent/Scratches",
                service.interpretOutput(damageAndCondition("minor dent / scratches", null)).filters().primaryDamage());
        assertEquals("Engine Start Program",
                service.interpretOutput(damageAndCondition(null, "engine starts")).filters().condition());
        assertEquals("Enhanced Vehicles",
                service.interpretOutput(damageAndCondition(null, "enhanced")).filters().condition());
    }

    @Test
    void movesADamageTypeReturnedAsConditionToPrimaryDamage() throws Exception {
        AiSearchResponse response = service.interpretOutput(damageAndCondition(null, "Hail"));
        assertEquals("READY", response.status());
        assertEquals("Hail", response.filters().primaryDamage());
        assertNull(response.filters().condition());
    }

    @Test
    void acceptsCommonMakeWordings() throws Exception {
        AiSearchResponse chevy = service.interpretOutput(model("Chevy", null));
        assertEquals("Chevrolet", chevy.filters().make());
    }

    @Test
    void keepsOtherFiltersAsReturned() throws Exception {
        AiSearchResponse response = service.interpretOutput(
                ready("Dallas", "Toyota", null, null, null, 2019, 2023, 20000));
        assertEquals("Dallas", response.filters().q());
        assertEquals("Toyota", response.filters().make());
        assertNull(response.filters().model());
        assertEquals(2019, response.filters().minYear());
        assertEquals(2023, response.filters().maxYear());
        assertEquals(0, new BigDecimal("20000").compareTo(response.filters().maxPriceInclusive()));
    }

    @Test
    void asksInsteadOfFailingWhenTheMakeAndModelDisagree() throws Exception {
        AiSearchResponse response = service.interpretOutput(model("Toyota", "Civic"));
        assertEquals("CLARIFICATION", response.status());
        assertTrue(response.question().contains("Honda"));
    }

    @Test
    void asksWhenSomethingIsNotInTheListings() throws Exception {
        assertEquals("CLARIFICATION", service.interpretOutput(model(null, "Corvette")).status());
        assertEquals("CLARIFICATION", service.interpretOutput(model("Porsche", null)).status());
        assertEquals("CLARIFICATION", service.interpretOutput(damageAndCondition("Burnt", null)).status());
        assertEquals("CLARIFICATION", service.interpretOutput(damageAndCondition(null, "Pristine")).status());
        assertEquals("CLARIFICATION", service.interpretOutput(damageAndCondition(null, null)).status());
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
                () -> service.interpretOutput(ready(null, "Toyota", null, null, null, 2024, 2019, null)));
        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
    }

    @Test
    void instructionsListEveryMakeModelAndCityInTheSeedData() throws Exception {
        // The model can only correct "Toyta" or "Dalls" to values it has been told about.
        JsonNode vehicles;
        try (InputStream seed = getClass().getResourceAsStream("/vehicles.json")) {
            vehicles = new ObjectMapper().readTree(seed);
        }
        for (JsonNode vehicle : vehicles) {
            String city = vehicle.path("location").asText().split(",")[0].trim();
            for (String value : List.of(vehicle.path("make").asText(), vehicle.path("model").asText(), city)) {
                assertTrue(AiSearchService.INSTRUCTIONS.contains(value), value + " is missing from the AI instructions");
            }
        }
    }
}
