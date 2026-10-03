package com.copart.vehiclesearch.vehicle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(300))
                .andExpect(jsonPath("$.totalPages").value(30))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void searchesTextCaseInsensitively() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("q", "tOyOtA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(30))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1001"));
    }

    @Test
    void filtersByMakeAndCondition() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("make", "Toyota")
                        .param("condition", "Run & Drive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1001"));
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
                .andExpect(jsonPath("$.totalElements").value(86))
                .andExpect(jsonPath("$.content[0].year").value(2020))
                .andExpect(jsonPath("$.content[43].year").value(2021));
    }

    @Test
    void filtersByEstimatedValueRange() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("minPrice", "10000")
                        .param("maxPrice", "20000")
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(86))
                .andExpect(jsonPath("$.content[0].estimatedValue").value(11258));
    }

    @Test
    void rejectsInvalidEstimatedValueRange() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("minPrice", "-1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vehicles")
                        .param("minPrice", "20000")
                        .param("maxPrice", "10000"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sortsByAllowedFields() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("sortBy", "year")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].year").value(2024));
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
