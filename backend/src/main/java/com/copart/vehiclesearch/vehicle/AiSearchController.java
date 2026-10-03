package com.copart.vehiclesearch.vehicle;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
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
    private final AiSearchRateLimiter rateLimiter;

    public AiSearchController(AiSearchService service, AiSearchRateLimiter rateLimiter) {
        this.service = service;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<?> interpret(@Valid @RequestBody AiSearchRequest request,
                                       HttpServletRequest httpRequest) {
        long retryAfterSeconds = rateLimiter.tryAcquire(AiSearchRateLimiter.clientKey(httpRequest));
        if (retryAfterSeconds > 0) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many AI searches. Try again in " + retryAfterSeconds + " seconds.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds))
                    .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                    .body(problem);
        }
        return ResponseEntity.ok(service.interpret(request));
    }

    public record AiSearchRequest(
            @NotBlank @Size(max = 300) String query,
            @Size(max = 300) String clarification) {
    }
}
