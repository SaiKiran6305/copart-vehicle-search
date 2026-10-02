package com.copart.vehiclesearch.vehicle;

import org.springframework.data.domain.Page;

import java.util.List;

public record VehicleSearchResponse(
        List<VehicleResponse> content,
        int number,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static VehicleSearchResponse from(Page<VehicleResponse> page) {
        return new VehicleSearchResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }
}
