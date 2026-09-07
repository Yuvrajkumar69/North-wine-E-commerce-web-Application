package com.genie.Ecomm.dto;

import java.util.Map;

public class CheckoutRequest {

    private Map<Long, Integer> productQuantities;
    private String shippingName;
    private String shippingEmail;
    private String shippingPhone;
    private String shippingAddress;

    public CheckoutRequest() {
    }

    public CheckoutRequest(Map<Long, Integer> productQuantities, String shippingName, String shippingEmail, String shippingPhone, String shippingAddress) {
        this.productQuantities = productQuantities;
        this.shippingName = shippingName;
        this.shippingEmail = shippingEmail;
        this.shippingPhone = shippingPhone;
        this.shippingAddress = shippingAddress;
    }

    public Map<Long, Integer> getProductQuantities() {
        return productQuantities;
    }

    public void setProductQuantities(Map<Long, Integer> productQuantities) {
        this.productQuantities = productQuantities;
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
}
