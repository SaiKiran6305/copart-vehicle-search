package com.copart.vehiclesearch.vehicle;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public final class VehicleSearchSpecification {

    private VehicleSearchSpecification() {
    }

    public static Specification<Vehicle> matches(String query, String make, String model,
                                                 String condition, Integer minYear, Integer maxYear) {
        return (root, unusedQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (hasText(query)) {
                String search = "%" + query.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("lotNumber")), search),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("make")), search),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), search),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), search)));
            }
            if (hasText(make)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("make")), make.trim().toLowerCase()));
            }
            if (hasText(model)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("model")), model.trim().toLowerCase()));
            }
            if (hasText(condition)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("condition")), condition.trim().toLowerCase()));
            }
            if (minYear != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("year"), minYear));
            }
            if (maxYear != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("year"), maxYear));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
