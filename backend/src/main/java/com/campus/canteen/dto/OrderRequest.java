package com.campus.canteen.dto;

import com.campus.canteen.model.PaymentMethod;
import java.util.List;

public class OrderRequest {
    private List<OrderItemRequest> items;
    private PaymentMethod paymentMethod;
    private String paymentDetails; // new field for simulated payment

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentDetails() { return paymentDetails; }
    public void setPaymentDetails(String paymentDetails) { this.paymentDetails = paymentDetails; }

    public static class OrderItemRequest {
        private Long menuItemId;
        private int quantity;

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}
