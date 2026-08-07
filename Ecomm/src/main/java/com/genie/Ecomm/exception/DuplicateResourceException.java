package com.genie.Ecomm.exception;

/**
 * Thrown when trying to create something that already exists (e.g. an account
 * with an email that's already registered). Mapped to HTTP 409 by GlobalExceptionHandler.
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
