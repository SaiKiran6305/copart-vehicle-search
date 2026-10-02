package com.copart.vehiclesearch.vehicle;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
public class VehicleDataInitializer {

    @Bean
    CommandLineRunner seedVehicles(VehicleRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.saveAll(List.of(
                    vehicle("LOT-1001", 2021, "Toyota", "Camry", "Run & Drive", "Dallas, TX", "2026-10-08", 42_180, "18500"),
                    vehicle("LOT-1002", 2019, "Honda", "Civic", "Front End", "Houston, TX", "2026-10-09", 61_240, "14200"),
                    vehicle("LOT-1003", 2022, "Ford", "F-150", "Normal Wear", "Atlanta, GA", "2026-10-10", 28_905, "27900"),
                    vehicle("LOT-1004", 2020, "Tesla", "Model 3", "Mechanical", "Phoenix, AZ", "2026-10-11", 35_410, "22100"),
                    vehicle("LOT-1005", 2018, "Chevrolet", "Equinox", "Rear End", "Chicago, IL", "2026-10-12", 74_003, "10800"),
                    vehicle("LOT-1006", 2023, "Hyundai", "Tucson", "Run & Drive", "Dallas, TX", "2026-10-13", 17_622, "23800"),
                    vehicle("LOT-1007", 2017, "BMW", "3 Series", "Hail", "Denver, CO", "2026-10-14", 82_510, "12900"),
                    vehicle("LOT-1008", 2021, "Nissan", "Rogue", "Side", "Orlando, FL", "2026-10-15", 39_870, "16700"),
                    vehicle("LOT-1009", 2020, "Kia", "Sportage", "Water/Flood", "Jacksonville, FL", "2026-10-16", 46_120, "13100"),
                    vehicle("LOT-1010", 2022, "Jeep", "Wrangler", "Run & Drive", "Dallas, TX", "2026-10-17", 25_890, "31900"),
                    vehicle("LOT-1011", 2016, "Ford", "Mustang", "Minor Dent/Scratches", "Los Angeles, CA", "2026-10-18", 91_300, "15400"),
                    vehicle("LOT-1012", 2019, "Toyota", "RAV4", "Vandalism", "Seattle, WA", "2026-10-19", 54_760, "17600")
            ));
        };
    }

    private Vehicle vehicle(String lotNumber, int year, String make, String model,
                            String condition, String location, String saleDate,
                            int odometer, String estimatedValue) {
        return new Vehicle(lotNumber, year, make, model, condition, location,
                LocalDate.parse(saleDate), odometer, new BigDecimal(estimatedValue));
    }
}
