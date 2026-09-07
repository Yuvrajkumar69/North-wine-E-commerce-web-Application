package com.genie.Ecomm.service;

import com.genie.Ecomm.exception.ResourceNotFoundException;
import com.genie.Ecomm.model.PasswordResetToken;
import com.genie.Ecomm.model.User;
import com.genie.Ecomm.repo.PasswordResetTokenRepository;
import com.genie.Ecomm.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final long EXPIRATION_MINUTES = 30;
    private static final long RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per email

    private final Map<String, Long> rateLimitMap = new ConcurrentHashMap<>();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public String requestPasswordReset(String email) {
        if (email == null || email.trim().isEmpty()) {
            return "If an account exists for this email, a password reset link has been sent.";
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Rate limiting check to prevent email flooding
        Long lastRequestTime = rateLimitMap.get(normalizedEmail);
        long now = System.currentTimeMillis();
        if (lastRequestTime != null && (now - lastRequestTime) < RATE_LIMIT_COOLDOWN_MS) {
            logger.warn("Password reset request rate-limited for email: {}", normalizedEmail);
            return "If an account exists for this email, a password reset link has been sent.";
        }
        rateLimitMap.put(normalizedEmail, now);

        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            logger.info("Password reset requested for non-existent email: {}", normalizedEmail);
            return "If an account exists for this email, a password reset link has been sent.";
        }

        // Invalidate & delete all previous tokens for this user, then flush immediately to prevent duplicate key errors
        List<PasswordResetToken> oldTokens = tokenRepository.findAllByUser(user);
        if (!oldTokens.isEmpty()) {
            tokenRepository.deleteAll(oldTokens);
            tokenRepository.flush();
        }

        // Generate a secure random token
        String tokenStr = UUID.randomUUID().toString();
        Date expiryDate = new Date(now + (EXPIRATION_MINUTES * 60 * 1000));

        PasswordResetToken resetToken = new PasswordResetToken(tokenStr, user, expiryDate);
        tokenRepository.saveAndFlush(resetToken);

        logger.info("Password reset token generated for user ID {}", user.getId());

        // Trigger Brevo email asynchronously
        emailService.sendPasswordResetEmail(user, tokenStr);

        return "If an account exists for this email, a password reset link has been sent.";
    }

    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();
        if (resetToken.isUsed()) {
            return false;
        }

        return resetToken.getExpiryDate().after(new Date());
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired password reset link."));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("This password reset link has already been used.");
        }

        if (resetToken.getExpiryDate().before(new Date())) {
            throw new IllegalArgumentException("This password reset link has expired.");
        }

        User user = resetToken.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("User associated with this reset link no longer exists.");
        }

        // Securely hash the new password using BCrypt
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        logger.info("Password successfully updated for user ID: {}", user.getId());
    }
}
