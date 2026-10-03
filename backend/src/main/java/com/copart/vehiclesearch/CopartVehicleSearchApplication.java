package com.copart.vehiclesearch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CopartVehicleSearchApplication {

    public static void main(String[] args) {
        // Close idle outgoing HTTP connections (used for OpenAI) after 30 seconds instead of the JDK's
        // 20 minutes. Networks can silently drop an idle connection, and reusing one makes the next
        // AI search hang until it times out. Must be set before the first HttpClient is created.
        if (System.getProperty("jdk.httpclient.keepalive.timeout") == null) {
            System.setProperty("jdk.httpclient.keepalive.timeout", "30");
        }
        SpringApplication.run(CopartVehicleSearchApplication.class, args);
    }
}
