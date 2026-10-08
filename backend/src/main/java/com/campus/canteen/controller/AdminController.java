package com.campus.canteen.controller;

import com.campus.canteen.dto.AdminDashboardDTO;
import com.campus.canteen.dto.PopularItemDTO;
import com.campus.canteen.model.OrderStatus;
import com.campus.canteen.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardDTO> getDashboardStats() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        AdminDashboardDTO dashboard = new AdminDashboardDTO();

        long totalOrders = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        dashboard.setTotalOrdersToday(totalOrders);

        long completedOrders = orderRepository.countByStatusInAndCreatedAtBetween(
                Arrays.asList(OrderStatus.COLLECTED), startOfDay, endOfDay);
        dashboard.setCompletedOrdersToday(completedOrders);

        long activeOrders = orderRepository.countByStatusInAndCreatedAtBetween(
                Arrays.asList(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY),
                startOfDay, endOfDay);
        dashboard.setActiveOrdersToday(activeOrders);

        long cancelledOrders = orderRepository.countByStatusInAndCreatedAtBetween(
                Arrays.asList(OrderStatus.REJECTED, OrderStatus.CANCELLED), startOfDay, endOfDay);
        dashboard.setCancelledOrdersToday(cancelledOrders);

        double revenue = orderRepository.sumTotalAmountByStatusInAndCreatedAtBetween(
                Arrays.asList(OrderStatus.PLACED, OrderStatus.COLLECTED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY),
                startOfDay, endOfDay);
        dashboard.setRevenueToday(revenue);

        List<PopularItemDTO> popularItems = orderRepository.findPopularItems(startOfDay, endOfDay);
        // Limit to top 5
        if (popularItems.size() > 5) {
            popularItems = popularItems.subList(0, 5);
        }
        dashboard.setPopularItems(popularItems);

        dashboard.setRecentOrders(orderRepository.findTop10ByOrderByCreatedAtDesc());

        return ResponseEntity.ok(dashboard);
    }
}
