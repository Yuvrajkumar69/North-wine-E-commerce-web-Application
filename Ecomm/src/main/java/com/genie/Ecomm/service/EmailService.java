package com.genie.Ecomm.service;

import com.genie.Ecomm.model.OrderItem;
import com.genie.Ecomm.model.Orders;
import com.genie.Ecomm.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.sender.email:singhpunam5091@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:North & Vine}")
    private String senderName;

    @Value("${app.frontend.url:http://localhost:5500}")
    private String frontendUrl;

    @Value("${store.location:Durga City Center, Haldwani, Uttarakhand, India}")
    private String storeLocation;

    @Value("${store.phone:7500554902}")
    private String storePhone;

    @Value("${store.email:singhpunam5091@gmail.com}")
    private String storeEmail;

    @Async
    public void sendOrderConfirmation(Orders order) {
        String recipientEmail = order.getShippingEmail() != null ? order.getShippingEmail() :
                (order.getUser() != null ? order.getUser().getEmail() : null);
        String recipientName = order.getShippingName() != null ? order.getShippingName() :
                (order.getUser() != null ? order.getUser().getName() : "Valued Customer");

        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            logger.warn("No recipient email found for order #{}. Email not sent.", order.getId());
            return;
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("your_")) {
            logger.warn("Brevo API key is not configured (BREVO_API_KEY). Order confirmation email skipped for order #{}", order.getId());
            return;
        }

        try {
            String url = "https://api.brevo.com/v3/smtp/email";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("accept", "application/json");
            headers.set("api-key", apiKey);

            Map<String, Object> body = new HashMap<>();

            Map<String, String> senderMap = new HashMap<>();
            senderMap.put("name", senderName);
            senderMap.put("email", senderEmail);
            body.put("sender", senderMap);

            List<Map<String, String>> toList = new ArrayList<>();
            Map<String, String> toMap = new HashMap<>();
            toMap.put("email", recipientEmail);
            toMap.put("name", recipientName);
            toList.add(toMap);
            body.put("to", toList);

            body.put("subject", "Order Confirmation #" + order.getId() + " — North & Vine");
            body.put("htmlContent", buildOrderEmailContent(order, recipientName));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            logger.info("Order confirmation email request accepted by Brevo for order #{}", order.getId());
        } catch (Exception e) {
            logger.error("Brevo transactional email failed for order #{}: {}", order.getId(), e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetUrl = frontendUrl + "/reset-password.html?token=" + resetToken;

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("your_")) {
            logger.warn("Brevo API key is not configured (BREVO_API_KEY). Password reset email skipped for recipient.");
            return;
        }

        try {
            String url = "https://api.brevo.com/v3/smtp/email";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("accept", "application/json");
            headers.set("api-key", apiKey);

            Map<String, Object> body = new HashMap<>();

            Map<String, String> senderMap = new HashMap<>();
            senderMap.put("name", senderName);
            senderMap.put("email", senderEmail);
            body.put("sender", senderMap);

            List<Map<String, String>> toList = new ArrayList<>();
            Map<String, String> toMap = new HashMap<>();
            toMap.put("email", user.getEmail());
            toMap.put("name", user.getName() != null && !user.getName().trim().isEmpty() ? user.getName() : "Valued Customer");
            toList.add(toMap);
            body.put("to", toList);

            body.put("subject", "Reset your North & Vine password");
            body.put("htmlContent", buildPasswordResetEmailContent(user, resetUrl));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            logger.info("Password reset email request accepted by Brevo");
        } catch (org.springframework.web.client.HttpStatusCodeException se) {
            logger.error("Brevo transactional email rejected with status {}: {}", se.getStatusCode(), se.getResponseBodyAsString());
        } catch (Exception e) {
            logger.error("Brevo transactional email failed for password reset: {}", e.getMessage());
        }
    }

    private String buildOrderEmailContent(Orders order, String recipientName) {
        StringBuilder itemsHtml = new StringBuilder();
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                String productName = item.getProduct() != null ? item.getProduct().getName() : "Item";
                String price = item.getPriceAtPurchase() != null ? "₹" + item.getPriceAtPurchase() : "";
                itemsHtml.append("<tr>")
                        .append("<td style='padding: 10px; border-bottom: 1px solid #eee;'>").append(productName).append("</td>")
                        .append("<td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>").append(item.getQuantity()).append("</td>")
                        .append("<td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>").append(price).append("</td>")
                        .append("</tr>");
            }
        }

        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #201F1B; background-color: #FAF8F3; border: 1px solid #E4DDCC; border-radius: 6px;'>"
                + "<div style='text-align: center; padding-bottom: 20px; border-bottom: 2px solid #16231C;'>"
                + "<h1 style='color: #16231C; font-size: 26px; margin: 0; font-style: italic;'>NORTH & VINE</h1>"
                + "<p style='color: #A9762F; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px;'>Boutique Department Store</p>"
                + "</div>"
                + "<div style='padding: 20px 0;'>"
                + "<h2 style='color: #201F1B; font-size: 20px;'>Thank you for your order, " + recipientName + "!</h2>"
                + "<p style='color: #5B5A52;'>Your order <strong>#" + order.getId() + "</strong> has been confirmed and payment was verified successfully.</p>"
                + "<p style='color: #5B5A52; font-size: 13px;'>Status: <strong style='color: #56705F;'>" + order.getStatus() + "</strong> | Payment: <strong style='color: #56705F;'>" + order.getPaymentStatus() + "</strong></p>"
                + "<div style='background: #FFFFFF; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #E4DDCC;'>"
                + "<table style='width: 100%; border-collapse: collapse;'>"
                + "<thead><tr style='background: #F1ECE0; color: #16231C;'>"
                + "<th style='padding: 8px; text-align: left;'>Product</th>"
                + "<th style='padding: 8px; text-align: center;'>Qty</th>"
                + "<th style='padding: 8px; text-align: right;'>Price</th>"
                + "</tr></thead>"
                + "<tbody>" + itemsHtml.toString() + "</tbody>"
                + "</table>"
                + "<div style='text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #16231C;'>"
                + "Total Amount: ₹" + (order.getTotalAmount() != null ? order.getTotalAmount() : "0.00")
                + "</div>"
                + "</div>"
                + "</div>"
                + "<div style='text-align: center; font-size: 12px; color: #5B5A52; border-top: 1px solid #E4DDCC; padding-top: 15px;'>"
                + "<p style='margin: 0;'>" + storeLocation + " | Phone: " + storePhone + " | Email: " + storeEmail + "</p>"
                + "<p style='margin-top: 5px;'>&copy; " + java.time.Year.now().getValue() + " North & Vine. All rights reserved.</p>"
                + "</div>"
                + "</div>";
    }

    private String buildPasswordResetEmailContent(User user, String resetUrl) {
        String userName = user.getName() != null && !user.getName().trim().isEmpty() ? user.getName() : "Valued Customer";

        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #201F1B; background-color: #FAF8F3; border: 1px solid #E4DDCC; border-radius: 6px;'>"
                + "<div style='text-align: center; padding-bottom: 20px; border-bottom: 2px solid #16231C;'>"
                + "<h1 style='color: #16231C; font-size: 26px; margin: 0; font-style: italic;'>NORTH & VINE</h1>"
                + "<p style='color: #A9762F; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px;'>Boutique Department Store</p>"
                + "</div>"
                + "<div style='padding: 24px 0;'>"
                + "<h2 style='color: #201F1B; font-size: 20px;'>Hello, " + userName + "</h2>"
                + "<p style='color: #5B5A52; line-height: 1.6;'>We received a request to reset the password for your North & Vine account. Click the button below to create a new password:</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + resetUrl + "' style='background-color: #581825; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 1px;'>Reset Password</a>"
                + "</div>"
                + "<p style='color: #8C7B70; font-size: 13px; background: #FFFFFF; padding: 12px; border-radius: 4px; border: 1px solid #E4DDCC;'>"
                + "<strong>Security Note:</strong> This password reset link will expire in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure."
                + "</p>"
                + "<p style='color: #5B5A52; font-size: 12px; word-break: break-all;'>If the button doesn't work, copy and paste this link into your browser:<br/><a href='" + resetUrl + "' style='color: #581825;'>" + resetUrl + "</a></p>"
                + "</div>"
                + "<div style='text-align: center; font-size: 12px; color: #5B5A52; border-top: 1px solid #E4DDCC; padding-top: 15px;'>"
                + "<p style='margin: 0;'>" + storeLocation + "</p>"
                + "<p style='margin: 4px 0;'>" + storeEmail + " | Phone: " + storePhone + "</p>"
                + "<p style='margin-top: 5px;'>&copy; " + java.time.Year.now().getValue() + " North & Vine. All rights reserved.</p>"
                + "</div>"
                + "</div>";
    }
}
