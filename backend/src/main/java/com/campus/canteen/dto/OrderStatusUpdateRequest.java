package com.campus.canteen.dto;

import com.campus.canteen.model.OrderStatus;

public class OrderStatusUpdateRequest {
    private OrderStatus status;

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}
