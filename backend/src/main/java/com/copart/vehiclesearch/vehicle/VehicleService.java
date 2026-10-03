package com.copart.vehiclesearch.vehicle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Page<VehicleResponse> search(String query, String make, String model,
                                        String primaryDamage, String condition,
                                        Integer minYear, Integer maxYear,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal maxPriceInclusive, Pageable pageable) {
        return vehicleRepository.findAll(
                        VehicleSearchSpecification.matches(
                                query, make, model, primaryDamage, condition, minYear, maxYear, minPrice, maxPrice, maxPriceInclusive),
                        pageable)
                .map(VehicleResponse::from);
    }
}
