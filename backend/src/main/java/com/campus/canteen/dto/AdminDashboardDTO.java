package com.campus.canteen.dto;

import com.campus.canteen.model.Order;
import com.campus.canteen.model.MenuItem;
import java.util.List;

public class AdminDashboardDTO {
    private long totalOrdersToday;
    private long completedOrdersToday;
    private long activeOrdersToday;
    private long cancelledOrdersToday;
    private double revenueToday;
    private List<PopularItemDTO> popularItems;
    private List<Order> recentOrders;

    // Getters and setters
    public long getTotalOrdersToday() { return totalOrdersToday; }
    public void setTotalOrdersToday(long totalOrdersToday) { this.totalOrdersToday = totalOrdersToday; }
    
    public long getCompletedOrdersToday() { return completedOrdersToday; }
    public void setCompletedOrdersToday(long completedOrdersToday) { this.completedOrdersToday = completedOrdersToday; }
    
    public long getActiveOrdersToday() { return activeOrdersToday; }
    public void setActiveOrdersToday(long activeOrdersToday) { this.activeOrdersToday = activeOrdersToday; }
    
    public long getCancelledOrdersToday() { return cancelledOrdersToday; }
    public void setCancelledOrdersToday(long cancelledOrdersToday) { this.cancelledOrdersToday = cancelledOrdersToday; }
    
    public double getRevenueToday() { return revenueToday; }
    public void setRevenueToday(double revenueToday) { this.revenueToday = revenueToday; }
    
    public List<PopularItemDTO> getPopularItems() { return popularItems; }
    public void setPopularItems(List<PopularItemDTO> popularItems) { this.popularItems = popularItems; }
    
    public List<Order> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<Order> recentOrders) { this.recentOrders = recentOrders; }

}
