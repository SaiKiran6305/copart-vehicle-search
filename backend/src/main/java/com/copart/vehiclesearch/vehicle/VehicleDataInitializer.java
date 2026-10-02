package com.copart.vehiclesearch.vehicle;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
public class VehicleDataInitializer {

    @Bean
    CommandLineRunner seedVehicles(VehicleRepository repository, ObjectMapper objectMapper) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            List<VehicleSeed> vehicles;
            try (InputStream input = new ClassPathResource("vehicles.json").getInputStream()) {
                vehicles = objectMapper.readValue(input, new TypeReference<>() {});
            }

            if (vehicles.isEmpty()) {
                throw new IllegalStateException("The vehicles.json seed dataset is empty.");
            }

            repository.saveAll(vehicles.stream()
                    .map(vehicle -> new Vehicle(
                            vehicle.lotNumber(),
                            vehicle.year(),
                            vehicle.make(),
                            vehicle.model(),
                            vehicle.condition(),
                            vehicle.location(),
                            vehicle.saleDate(),
                            vehicle.odometer(),
                            vehicle.estimatedValue()))
                    .toList());
        };
    }

    private record VehicleSeed(
            String lotNumber,
            Integer year,
            String make,
            String model,
            String condition,
            String location,
            LocalDate saleDate,
            Integer odometer,
            BigDecimal estimatedValue
    ) {
    }
}
