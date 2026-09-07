package com.genie.Ecomm.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class RazorpayService {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayService.class);

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public String createRazorpayOrder(Long orderId, BigDecimal amount) throws RazorpayException {
        if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
            throw new RazorpayException("Razorpay API key or secret is not configured on the server.");
        }

        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject orderRequest = new JSONObject();
        // Razorpay expects amount in paise (1 INR = 100 paise)
        BigDecimal amountInPaise = amount.multiply(new BigDecimal(100)).setScale(0, RoundingMode.HALF_UP);
        try {
            orderRequest.put("amount", amountInPaise.intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_order_" + orderId);
        } catch (org.json.JSONException e) {
            throw new RazorpayException("Failed to construct Razorpay order request JSON: " + e.getMessage());
        }

        com.razorpay.Order order = client.orders.create(orderRequest);
        return order.get("id");
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (keySecret == null || keySecret.trim().isEmpty()) {
            logger.error("Cannot verify payment signature: Razorpay Key Secret is missing.");
            return false;
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            logger.error("Razorpay signature verification failed for Order ID {}: {}", razorpayOrderId, e.getMessage());
            return false;
        }
    }

    public String getKeyId() {
        return keyId;
    }
}
