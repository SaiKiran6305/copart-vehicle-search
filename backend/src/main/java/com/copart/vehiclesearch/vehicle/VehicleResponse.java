package com.copart.vehiclesearch.vehicle;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehicleResponse(
        Long id,
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
    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(), vehicle.getLotNumber(), vehicle.getYear(),
                vehicle.getMake(), vehicle.getModel(), vehicle.getCondition(),
                vehicle.getLocation(), vehicle.getSaleDate(), vehicle.getOdometer(),
                vehicle.getEstimatedValue());
    }
}
