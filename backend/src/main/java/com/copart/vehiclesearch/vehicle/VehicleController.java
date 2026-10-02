package com.copart.vehiclesearch.vehicle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "year", "make", "model", "saleDate", "estimatedValue", "odometer");

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<Page<VehicleResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "saleDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        if (page < 0 || size < 1 || size > 100) {
            return ResponseEntity.badRequest().build();
        }
        if (minYear != null && maxYear != null && minYear > maxYear) {
            return ResponseEntity.badRequest().build();
        }

        String safeSortBy = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "saleDate";
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, safeSortBy));

        return ResponseEntity.ok(vehicleService.search(
                q, make, model, condition, minYear, maxYear, pageable));
    }
}
