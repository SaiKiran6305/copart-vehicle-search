package com.copart.vehiclesearch.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Uses the small files in src/test/resources/static in place of the frontend build.
@SpringBootTest
@AutoConfigureMockMvc
class StaticResourceConfigTest {

    private static final String HASHED_FILE = "/assets/app-test1234.js";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void letsBrowsersKeepHashedFilesForAYear() throws Exception {
        mockMvc.perform(get(HASHED_FILE))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control",
                        allOf(containsString("max-age=31536000"), containsString("public"), containsString("immutable"))));
    }

    @Test
    void sendsTheCompressedCopyTheBrowserAccepts() throws Exception {
        mockMvc.perform(get(HASHED_FILE).header("Accept-Encoding", "gzip, deflate, br"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Encoding", "br"))
                .andExpect(header().string("Vary", containsString("Accept-Encoding")))
                .andExpect(header().string("Content-Type", containsString("javascript")));

        mockMvc.perform(get(HASHED_FILE).header("Accept-Encoding", "gzip"))
                .andExpect(header().string("Content-Encoding", "gzip"));

        mockMvc.perform(get(HASHED_FILE))
                .andExpect(header().doesNotExist("Content-Encoding"))
                .andExpect(content().string(containsString("console.log")));
    }

    @Test
    void asksBrowsersToRecheckIndexHtmlOnEveryVisit() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"));
    }

    @Test
    void letsBrowsersKeepVehiclePhotosForADay() throws Exception {
        mockMvc.perform(get("/vehicles/test-photo.webp"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control",
                        allOf(containsString("max-age=86400"), containsString("public"))));
    }
}
