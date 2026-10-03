package com.copart.vehiclesearch.controller;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Returns API errors as RFC 9457 problem details, for example
 * {@code {"status":400,"detail":"size must be between 1 and 100."}}.
 * Covers ResponseStatusException and Spring MVC's own errors, such as a parameter of the wrong type.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
}
