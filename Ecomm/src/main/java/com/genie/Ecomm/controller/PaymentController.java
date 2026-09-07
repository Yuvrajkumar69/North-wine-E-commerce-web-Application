package com.genie.Ecomm.controller;

import com.genie.Ecomm.dto.OrderDTO;
import com.genie.Ecomm.dto.PaymentVerificationRequest;
import com.genie.Ecomm.model.Orders;
import com.genie.Ecomm.service.EmailService;
import com.genie.Ecomm.service.OrderService;
import com.genie.Ecomm.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@CrossOrigin("*")
public class PaymentController {

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        boolean isValid = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (isValid) {
            Orders updatedOrder = orderService.updatePaymentStatus(
                    request.getRazorpayOrderId(),
                    "PAID",
                    request.getRazorpayPaymentId()
            );

            // Trigger email confirmation asynchronously / in background
            try {
                emailService.sendOrderConfirmation(updatedOrder);
            } catch (Exception e) {
                // Email failure logged inside EmailService, do not fail payment verification
            }

            OrderDTO orderDTO = orderService.convertToDTO(updatedOrder);
            return ResponseEntity.ok(orderDTO);
        } else {
            orderService.updatePaymentStatus(
                    request.getRazorpayOrderId(),
                    "FAILED",
                    request.getRazorpayPaymentId()
            );

            Map<String, String> response = new HashMap<>();
            response.put("error", "Payment verification failed. Invalid signature.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
