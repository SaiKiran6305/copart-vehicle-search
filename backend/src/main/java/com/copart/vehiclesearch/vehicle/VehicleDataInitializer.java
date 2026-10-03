package com.copart.vehiclesearch.vehicle;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(VehicleDataInitializer.class);

    /**
     * Loads vehicles.json into the database. If the database already holds exactly the same
     * vehicles it is left alone; if it is empty or holds different data (for example after the
     * seed file was regenerated), the stored vehicles are replaced with the file's contents.
     */
    @Bean
    CommandLineRunner seedVehicles(VehicleRepository repository, ObjectMapper objectMapper) {
        return args -> {
            List<VehicleSeed> seeds;
            try (InputStream input = new ClassPathResource("vehicles.json").getInputStream()) {
                seeds = objectMapper.readValue(input, new TypeReference<>() {});
            }

            if (seeds.isEmpty()) {
                throw new IllegalStateException("The vehicles.json seed dataset is empty.");
            }

            List<String> wanted = seeds.stream().map(VehicleSeed::describe).sorted().toList();
            List<Vehicle> stored = repository.findAll();
            List<String> current = stored.stream().map(VehicleDataInitializer::describe).sorted().toList();
            if (wanted.equals(current)) {
                return;
            }

            if (!stored.isEmpty()) {
                log.info("Seed data changed; replacing {} stored vehicles with {} from vehicles.json",
                        stored.size(), seeds.size());
                repository.deleteAllInBatch();
            }
            repository.saveAll(seeds.stream().map(VehicleSeed::toVehicle).toList());
        };
    }

    private static String describe(Vehicle vehicle) {
        return describe(vehicle.getLotNumber(), vehicle.getYear(), vehicle.getMake(), vehicle.getModel(),
                vehicle.getPrimaryDamage(), vehicle.getCondition(), vehicle.getLocation(), vehicle.getSaleDate(), vehicle.getOdometer(),
                vehicle.getEstimatedValue());
    }

    private static String describe(String lotNumber, Integer year, String make, String model,
                                   String primaryDamage, String condition,
                                   String location, LocalDate saleDate, Integer odometer,
                                   BigDecimal estimatedValue) {
        String value = estimatedValue == null ? "" : estimatedValue.stripTrailingZeros().toPlainString();
        return String.join("|", lotNumber, String.valueOf(year), make, model, String.valueOf(primaryDamage), condition, location,
                String.valueOf(saleDate), String.valueOf(odometer), value);
    }

    private record VehicleSeed(
            String lotNumber,
            Integer year,
            String make,
            String model,
            String primaryDamage,
            String condition,
            String location,
            LocalDate saleDate,
            Integer odometer,
            BigDecimal estimatedValue
    ) {
        private String describe() {
            return VehicleDataInitializer.describe(lotNumber, year, make, model, primaryDamage, condition, location,
                    saleDate, odometer, estimatedValue);
        }

        private Vehicle toVehicle() {
            return new Vehicle(lotNumber, year, make, model, primaryDamage, condition, location, saleDate, odometer,
                    estimatedValue);
        }
    }
}
