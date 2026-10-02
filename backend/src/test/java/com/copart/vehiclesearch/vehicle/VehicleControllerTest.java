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
    void returnsPagedVehicles() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    void appliesTextSearchAndFilters() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .param("q", "toyota")
                        .param("minYear", "2020")
                        .param("condition", "Run & Drive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].lotNumber").value("LOT-1001"));
    }

    @Test
    void rejectsInvalidPageSize() throws Exception {
        mockMvc.perform(get("/api/vehicles").param("size", "101"))
                .andExpect(status().isBadRequest());
    }
}
