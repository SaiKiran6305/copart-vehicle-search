package com.copart.vehiclesearch.vehicle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Page<VehicleResponse> search(String query, String make, String model,
                                        String condition, Integer minYear, Integer maxYear,
                                        Pageable pageable) {
        return vehicleRepository.findAll(
                        VehicleSearchSpecification.matches(query, make, model, condition, minYear, maxYear),
                        pageable)
                .map(VehicleResponse::from);
    }
}
