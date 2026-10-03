package com.copart.vehiclesearch.vehicle;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Set;
import java.util.TreeSet;

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
    public ResponseEntity<VehicleSearchResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String primaryDamage,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal maxPriceInclusive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "saleDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        // Invalid input is answered with HTTP 400 and a problem detail saying what to fix.
        require(page >= 0, "page must be 0 or more.");
        require(size >= 1 && size <= 100, "size must be between 1 and 100.");
        require(minYear == null || maxYear == null || minYear <= maxYear,
                "minYear must be less than or equal to maxYear.");
        require(isNotNegative(minPrice) && isNotNegative(maxPrice) && isNotNegative(maxPriceInclusive),
                "Prices must be 0 or more.");
        require(maxPrice == null || maxPriceInclusive == null,
                "Use either maxPrice or maxPriceInclusive, not both.");
        require(minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) < 0,
                "minPrice must be less than maxPrice.");
        require(minPrice == null || maxPriceInclusive == null || minPrice.compareTo(maxPriceInclusive) <= 0,
                "minPrice must be less than or equal to maxPriceInclusive.");
        require(SORTABLE_FIELDS.contains(sortBy),
                "sortBy must be one of: " + String.join(", ", new TreeSet<>(SORTABLE_FIELDS)) + ".");
        require("asc".equalsIgnoreCase(direction) || "desc".equalsIgnoreCase(direction),
                "direction must be asc or desc.");

        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        // Many vehicles share a year, make or value, so add the id as a tiebreaker.
        // Without it the database may order ties differently per query and a vehicle
        // can appear on two pages or be skipped while paging.
        Sort sort = Sort.by(sortDirection, sortBy).and(Sort.by(Sort.Direction.ASC, "id"));
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(VehicleSearchResponse.from(vehicleService.search(
                q, make, model, primaryDamage, condition, minYear, maxYear, minPrice, maxPrice, maxPriceInclusive, pageable)));
    }

    private static void require(boolean valid, String message) {
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private static boolean isNotNegative(BigDecimal value) {
        return value == null || value.signum() >= 0;
    }
}
