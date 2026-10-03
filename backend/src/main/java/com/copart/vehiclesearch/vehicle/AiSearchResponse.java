package com.copart.vehiclesearch.vehicle;

import java.math.BigDecimal;

public record AiSearchResponse(String status, String question, Filters filters) {
    public record Filters(String q, String make, String model, String primaryDamage, String condition,
                          Integer minYear, Integer maxYear, BigDecimal maxPriceInclusive) {
    }

    public static AiSearchResponse ready(Filters filters) {
        return new AiSearchResponse("READY", null, filters);
    }

    public static AiSearchResponse clarification(String question) {
        return new AiSearchResponse("CLARIFICATION", question, null);
    }
}
