package com.copart.vehiclesearch.vehicle;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class VehicleSearchSpecification {

    // Keyword search splits the text into words; every word must match some field.
    private static final int MAX_SEARCH_WORDS = 8;
    private static final Pattern WORD_SEPARATORS = Pattern.compile("[\\s,]+");
    private static final Pattern DIGITS = Pattern.compile("\\d+");
    private static final Pattern YEAR = Pattern.compile("\\d{4}");
    private static final Set<String> IGNORED_WORDS = Set.of("in", "near", "at", "the", "a", "an", "and", "of", "for", "with");

    private VehicleSearchSpecification() {
    }

    /** The search text as lower-case words, without filler words like "in" or "near". */
    static List<String> searchWords(String query) {
        if (!hasText(query)) return List.of();
        return Arrays.stream(WORD_SEPARATORS.split(query.trim().toLowerCase(Locale.ROOT)))
                .filter(word -> !word.isEmpty() && !IGNORED_WORDS.contains(word))
                .distinct()
                .limit(MAX_SEARCH_WORDS)
                .toList();
    }

    public static Specification<Vehicle> matches(String query, String make, String model,
                                                 String primaryDamage, String condition,
                                                 Integer minYear, Integer maxYear,
                                                 BigDecimal minPrice, BigDecimal maxPrice,
                                                 BigDecimal maxPriceInclusive) {
        return (root, unusedQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // "toyota dallas" or "2018 camry": each word must match the make, model, location,
            // lot number, or (for a four-digit number) the year.
            for (String word : searchWords(query)) {
                String pattern = "%" + escapeLike(word) + "%";
                List<Predicate> anyField = new ArrayList<>(List.of(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("make")), pattern, '!'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), pattern, '!'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), pattern, '!')));
                boolean shortNumber = DIGITS.matcher(word).matches() && word.length() < 4;
                if (!shortNumber) {
                    // A short number like the "3" in "model 3" would match most lot numbers, so skip them.
                    anyField.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("lotNumber")), pattern, '!'));
                }
                if (YEAR.matcher(word).matches()) {
                    anyField.add(criteriaBuilder.equal(root.get("year"), Integer.parseInt(word)));
                }
                predicates.add(criteriaBuilder.or(anyField.toArray(Predicate[]::new)));
            }
            if (hasText(make)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("make")), make.trim().toLowerCase(Locale.ROOT)));
            }
            if (hasText(model)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("model")), model.trim().toLowerCase(Locale.ROOT)));
            }
            if (hasText(primaryDamage)) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("primaryDamage")),
                        primaryDamage.trim().toLowerCase(Locale.ROOT)));
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
            if (maxPriceInclusive != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("estimatedValue"), maxPriceInclusive));
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
