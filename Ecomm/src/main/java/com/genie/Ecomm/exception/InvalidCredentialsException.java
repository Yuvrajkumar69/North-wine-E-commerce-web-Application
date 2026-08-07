package com.genie.Ecomm.exception;

/**
 * Thrown on failed login attempts. Mapped to HTTP 401 by GlobalExceptionHandler.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
