package com.genie.Ecomm.exception;

/**
 * Thrown when a requested entity (user, product, order, ...) doesn't exist.
 * Mapped to HTTP 404 by GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
