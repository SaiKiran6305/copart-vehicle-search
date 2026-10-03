package com.copart.vehiclesearch.vehicle;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class VehicleSearchSpecification {

    private VehicleSearchSpecification() {
    }

    public static Specification<Vehicle> matches(String query, String make, String model,
                                                 String condition, Integer minYear, Integer maxYear,
                                                 BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, unusedQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (hasText(query)) {
                String search = "%" + escapeLike(query.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("lotNumber")), search, '!'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("make")), search, '!'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), search, '!'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), search, '!')));
            }
            if (hasText(make)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("make")), make.trim().toLowerCase(Locale.ROOT)));
            }
            if (hasText(model)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("model")), model.trim().toLowerCase(Locale.ROOT)));
            }
            if (hasText(condition)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("condition")), condition.trim().toLowerCase(Locale.ROOT)));
            }
            if (minYear != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("year"), minYear));
            }
            if (maxYear != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("year"), maxYear));
            }
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("estimatedValue"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("estimatedValue"), maxPrice));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String escapeLike(String value) {
        return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
