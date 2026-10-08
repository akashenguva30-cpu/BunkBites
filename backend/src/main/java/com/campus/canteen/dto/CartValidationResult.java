package com.campus.canteen.dto;

import com.campus.canteen.model.OrderItem;
import java.math.BigDecimal;
import java.util.List;

public class CartValidationResult {
    private final List<OrderItem> orderItems;
    private final BigDecimal totalAmount;

    public CartValidationResult(List<OrderItem> orderItems, BigDecimal totalAmount) {
        this.orderItems = orderItems;
        this.totalAmount = totalAmount;
    }

    public List<OrderItem> getOrderItems() {
        return orderItems;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
}
