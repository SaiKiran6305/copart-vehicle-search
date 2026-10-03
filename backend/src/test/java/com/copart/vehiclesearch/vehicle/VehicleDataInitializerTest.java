package com.copart.vehiclesearch.vehicle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:seedsync")
class VehicleDataInitializerTest {

    @Autowired
    private VehicleRepository repository;

    @Autowired
    @Qualifier("seedVehicles")
    private CommandLineRunner seedVehicles;

    @Test
    void replacesStoredVehiclesWhenTheSeedFileDiffers() throws Exception {
        repository.deleteAllInBatch();
        repository.save(new Vehicle("LOT-OLD", 2018, "Toyota", "Camry", "Front End", "Run and Drive", "Dallas, TX",
                LocalDate.of(2026, 1, 1), 1000, new BigDecimal("1000")));

        seedVehicles.run();

        assertEquals(1000, repository.count());
        assertTrue(repository.findAll().stream().noneMatch(vehicle -> vehicle.getLotNumber().equals("LOT-OLD")));
    }

    @Test
    void leavesMatchingDataUntouched() throws Exception {
        seedVehicles.run();
        List<Long> idsBefore = repository.findAll().stream().map(Vehicle::getId).sorted().toList();

        seedVehicles.run();

        List<Long> idsAfter = repository.findAll().stream().map(Vehicle::getId).sorted().toList();
        assertEquals(1000, idsAfter.size());
        assertEquals(idsBefore, idsAfter);
    }
}
