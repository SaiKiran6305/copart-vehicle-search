package com.copart.vehiclesearch.vehicle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsHealthStatus() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void returnsDefaultPaginatedVehicles() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(12))
                .andExpect(jsonPath("$.totalElements").value(300))
                .andExpect(jsonPath("$.totalPages").value(25))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void matchesEveryWordOfAKeywordSearchAcrossFields() throws Exception {
        // Make + city, and year + model: each word may match a different field.
        mockMvc.perform(get("/api/vehicles").param("q", "toyota dallas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].make", everyItem(is("Toyota"))))
                .andExpect(jsonPath("$.content[*].location", everyItem(is("Dallas, TX"))));

        mockMvc.perform(get("/api/vehicles").param("q", "2018 camry"))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[*].year", everyItem(is(2018))))
                .andExpect(jsonPath("$.content[*].model", everyItem(is("Camry"))));

        // Filler words are ignored.
        mockMvc.perform(get("/api/vehicles").param("q", "Toyota in Dallas"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void doesNotMatchShortNumbersAgainstLotNumbers() throws Exception {
        // The "3" in "model 3" must not pull in every lot number containing a 3.
        mockMvc.perform(get("/api/vehicles").param("q", "model 3").param("size", "100"))
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.content[*].model", everyItem(is("Model 3"))));

        mockMvc.perform(get("/api/vehicles").param("q", "LOT-1123"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1123"));
    }

    @Test
    void searchesTextCaseInsensitively() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("q", "tOyOtA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(30))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1004"));
    }

    @Test
    void filtersByMakeAndCondition() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("make", "Toyota")
                        .param("condition", "Run and Drive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1065"));
    }

    @Test
    void filtersByPrimaryDamageSeparatelyFromCondition() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("primaryDamage", "water/FLOOD")
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(23))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1019"))
                .andExpect(jsonPath("$.content[0].primaryDamage").value("Water/Flood"));

        mockMvc.perform(get("/api/vehicles")
                        .param("primaryDamage", "Water/Flood")
                        .param("condition", "Stationary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(17))
                .andExpect(jsonPath("$.content[0].condition").value("Stationary"));
    }

    @Test
    void filtersByYearRange() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("minYear", "2020")
                        .param("maxYear", "2021")
                        .param("sortBy", "year")
                        .param("direction", "asc")
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(59))
                .andExpect(jsonPath("$.content[0].year").value(2020))
                .andExpect(jsonPath("$.content[29].year").value(2020))
                .andExpect(jsonPath("$.content[30].year").value(2021));
    }

    @Test
    void filtersByEstimatedValueRange() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("minPrice", "10000")
                        .param("maxPrice", "20000")
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(129))
                .andExpect(jsonPath("$.content[0].estimatedValue").value(10900));
    }

    @Test
    void filtersByInclusiveMaximumEstimatedValue() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("maxPriceInclusive", "10000")
                        .param("size", "100"))
                .andExpect(status().isOk())
                // LOT-1010 and LOT-1092 are valued at exactly $10,000: 121 lots are below it, 123 at or below.
                .andExpect(jsonPath("$.totalElements").value(123));
        mockMvc.perform(get("/api/vehicles").param("maxPrice", "10000"))
                .andExpect(jsonPath("$.totalElements").value(121));
    }

    @Test
    void rejectsInvalidEstimatedValueRange() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("minPrice", "-1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vehicles")
                        .param("minPrice", "20000")
                        .param("maxPrice", "10000"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/vehicles")
                        .param("minPrice", "20001")
                        .param("maxPriceInclusive", "20000"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/vehicles")
                        .param("maxPrice", "20000")
                        .param("maxPriceInclusive", "20000"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sortsByAllowedFields() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("sortBy", "year")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].year").value(2025));
    }

    @Test
    void rejectsInvalidPageAndSize() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("page", "-1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vehicles").param("size", "0"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vehicles").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidYearRange() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("minYear", "2022")
                        .param("maxYear", "2019"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void explainsInvalidRequestsInTheResponseBody() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("sortBy", "price"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail", containsString("sortBy must be one of")));

        mockMvc.perform(get("/api/vehicles").param("minYear", "2022").param("maxYear", "2019"))
                .andExpect(jsonPath("$.detail").value("minYear must be less than or equal to maxYear."));

        mockMvc.perform(get("/api/vehicles").param("size", "500"))
                .andExpect(jsonPath("$.detail").value("size must be between 1 and 100."));

        // Values of the wrong type get a problem detail too.
        mockMvc.perform(get("/api/vehicles").param("minYear", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail", containsString("minYear")));
    }

    @Test
    void rejectsUnsupportedSortParameters() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("sortBy", "id"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vehicles").param("direction", "sideways"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsAnEmptyPageWhenNoVehiclesMatch() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("make", "NotAMake"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }
}
