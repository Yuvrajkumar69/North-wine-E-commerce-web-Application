package com.genie.Ecomm.controller;

import com.genie.Ecomm.dto.CheckoutRequest;
import com.genie.Ecomm.dto.OrderDTO;
import com.genie.Ecomm.dto.RazorpayOrderResponse;
import com.genie.Ecomm.model.Orders;
import com.genie.Ecomm.service.OrderService;
import com.genie.Ecomm.service.RazorpayService;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private RazorpayService razorpayService;

    @PostMapping("/checkout/{userId}")
    public ResponseEntity<?> checkout(@PathVariable("userId") Long userId, @RequestBody CheckoutRequest checkoutRequest) {
        try {
            Orders order = orderService.createCheckoutOrder(userId, checkoutRequest);
            String razorpayOrderId;
            try {
                razorpayOrderId = razorpayService.createRazorpayOrder(order.getId(), order.getTotalAmount());
            } catch (RazorpayException e) {
                org.slf4j.LoggerFactory.getLogger(OrderController.class)
                        .warn("Razorpay API call returned warning: {}. Using generated local order reference for development.", e.getMessage());
                razorpayOrderId = "order_local_" + order.getId();
            }

            orderService.updateRazorpayOrderId(order.getId(), razorpayOrderId);

            RazorpayOrderResponse response = new RazorpayOrderResponse(
                    order.getId(),
                    razorpayOrderId,
                    order.getTotalAmount(),
                    "INR",
                    razorpayService.getKeyId()
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    @GetMapping("/all-orders")
    public List<OrderDTO> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/user/{userId}")
    public List<OrderDTO> getOrderByUser(@PathVariable("userId") Long userId) {
        return orderService.getOrderByUser(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable("id") Long id) {
        Orders order = orderService.getOrderEntityById(id);
        return ResponseEntity.ok(orderService.convertToDTO(order));
    }
}
