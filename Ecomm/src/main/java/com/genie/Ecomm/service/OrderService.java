package com.genie.Ecomm.service;

import com.genie.Ecomm.dto.CheckoutRequest;
import com.genie.Ecomm.dto.OrderDTO;
import com.genie.Ecomm.dto.OrderItemDTO;
import com.genie.Ecomm.exception.ResourceNotFoundException;
import com.genie.Ecomm.model.OrderItem;
import com.genie.Ecomm.model.Orders;
import com.genie.Ecomm.model.Product;
import com.genie.Ecomm.model.User;
import com.genie.Ecomm.repo.OrderRepository;
import com.genie.Ecomm.repo.ProductRepository;
import com.genie.Ecomm.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Orders createCheckoutOrder(Long userId, CheckoutRequest checkoutRequest) {
        Orders order = buildOrder(userId, checkoutRequest);
        return orderRepository.save(order);
    }

    private Orders buildOrder(Long userId, CheckoutRequest checkoutRequest) {
        Map<Long, Integer> productQuantities = checkoutRequest.getProductQuantities();
        if (productQuantities == null || productQuantities.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one product");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Orders order = new Orders();
        order.setUser(user);
        order.setOrderDate(new Date());
        order.setStatus("PENDING");
        order.setPaymentStatus("PENDING");
        order.setShippingName(checkoutRequest.getShippingName() != null ? checkoutRequest.getShippingName() : user.getName());
        order.setShippingEmail(checkoutRequest.getShippingEmail() != null ? checkoutRequest.getShippingEmail() : user.getEmail());
        order.setShippingPhone(checkoutRequest.getShippingPhone() != null ? checkoutRequest.getShippingPhone() : user.getPhone());
        order.setShippingAddress(checkoutRequest.getShippingAddress());

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Long productId = entry.getKey();
            int quantity = entry.getValue();
            if (quantity <= 0) {
                continue;
            }

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

            // Stock check
            if (product.getStock() != null && product.getStock() < quantity) {
                throw new IllegalArgumentException("Insufficient stock for product '" + product.getName() + "'. Available: " + product.getStock() + ", Requested: " + quantity);
            }

            BigDecimal itemPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            calculatedTotal = calculatedTotal.add(itemPrice.multiply(BigDecimal.valueOf(quantity)));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtPurchase(itemPrice);
            orderItems.add(orderItem);
        }

        if (orderItems.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one valid item");
        }

        order.setTotalAmount(calculatedTotal);
        order.setOrderItems(orderItems);
        return order;
    }

    public void updateRazorpayOrderId(Long orderId, String razorpayOrderId) {
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        order.setRazorpayOrderId(razorpayOrderId);
        orderRepository.save(order);
    }

    public Orders updatePaymentStatus(String razorpayOrderId, String paymentStatus, String razorpayPaymentId) {
        Orders order = orderRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with Razorpay Order ID " + razorpayOrderId));

        // Idempotency check: if already PAID, return order directly
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return order;
        }

        order.setPaymentStatus(paymentStatus);
        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            order.setStatus("CONFIRMED");

            // Safely decrement product stock upon confirmed payment
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product product = item.getProduct();
                    if (product != null && product.getStock() != null) {
                        int remainingStock = Math.max(0, product.getStock() - item.getQuantity());
                        product.setStock(remainingStock);
                        productRepository.save(product);
                    }
                }
            }
        } else if ("FAILED".equalsIgnoreCase(paymentStatus)) {
            order.setStatus("FAILED");
        }
        order.setRazorpayPaymentId(razorpayPaymentId);
        return orderRepository.save(order);
    }

    public Orders getOrderEntityById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + id));
    }

    public List<OrderDTO> getAllOrders() {
        List<Orders> orders = orderRepository.findAllOrdersWithUsers();
        return orders.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<OrderDTO> getOrderByUser(Long userId) {
        Optional<User> userOp = userRepository.findById(userId);
        if (userOp.isEmpty()) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        User user = userOp.get();
        List<Orders> ordersList = orderRepository.findByUser(user);
        return ordersList.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public OrderDTO convertToDTO(Orders orders) {
        List<OrderItemDTO> orderItemDTOs = orders.getOrderItems().stream()
                .map(item -> new OrderItemDTO(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getImageUrl(),
                        item.getPriceAtPurchase() != null ? item.getPriceAtPurchase() : item.getProduct().getPrice(),
                        item.getQuantity()))
                .collect(Collectors.toList());

        return new OrderDTO(
                orders.getId(),
                orders.getTotalAmount(),
                orders.getStatus(),
                orders.getPaymentStatus(),
                orders.getRazorpayOrderId(),
                orders.getOrderDate(),
                orders.getUser() != null ? orders.getUser().getName() : "Unknown",
                orders.getUser() != null ? orders.getUser().getEmail() : "Unknown",
                orders.getShippingName(),
                orders.getShippingEmail(),
                orders.getShippingPhone(),
                orders.getShippingAddress(),
                orderItemDTOs
        );
    }
}
