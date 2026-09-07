package com.genie.Ecomm.dto;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public class OrderDTO {

    private Long id;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private String razorpayOrderId;
    private Date orderDate;
    private String userName;
    private String email;
    private String shippingName;
    private String shippingEmail;
    private String shippingPhone;
    private String shippingAddress;
    private List<OrderItemDTO> orderItems;

    public OrderDTO() {
    }

    public OrderDTO(Long id, BigDecimal totalAmount, String status, String paymentStatus, String razorpayOrderId, Date orderDate, String userName, String email, String shippingName, String shippingEmail, String shippingPhone, String shippingAddress, List<OrderItemDTO> orderItems) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.razorpayOrderId = razorpayOrderId;
        this.orderDate = orderDate;
        this.userName = userName;
        this.email = email;
        this.shippingName = shippingName;
        this.shippingEmail = shippingEmail;
        this.shippingPhone = shippingPhone;
        this.shippingAddress = shippingAddress;
        this.orderItems = orderItems;
    }

    public OrderDTO(Long id, BigDecimal totalAmount, String status, Date orderDate, String userName, String email, List<OrderItemDTO> orderItems) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderDate = orderDate;
        this.userName = userName;
        this.email = email;
        this.orderItems = orderItems;
    }

    public OrderDTO(Long id, BigDecimal totalAmount, String status, Date orderDate, List<OrderItemDTO> orderItems) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderDate = orderDate;
        this.orderItems = orderItems;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getShippingName() {
        return shippingName;
    }

    public void setShippingName(String shippingName) {
        this.shippingName = shippingName;
    }

    public String getShippingEmail() {
        return shippingEmail;
    }

    public void setShippingEmail(String shippingEmail) {
        this.shippingEmail = shippingEmail;
    }

    public String getShippingPhone() {
        return shippingPhone;
    }

    public void setShippingPhone(String shippingPhone) {
        this.shippingPhone = shippingPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public List<OrderItemDTO> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItemDTO> orderItems) {
        this.orderItems = orderItems;
    }
}
