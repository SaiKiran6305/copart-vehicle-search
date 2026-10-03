package com.copart.vehiclesearch.vehicle;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-search")
@Validated
public class AiSearchController {
    private final AiSearchService service;

    public AiSearchController(AiSearchService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AiSearchResponse> interpret(@Valid @RequestBody AiSearchRequest request) {
        return ResponseEntity.ok(service.interpret(request));
    }

    public record AiSearchRequest(
            @NotBlank @Size(max = 300) String query,
            @Size(max = 300) String clarification) {
    }
}
