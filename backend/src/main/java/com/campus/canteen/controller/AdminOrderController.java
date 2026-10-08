package com.campus.canteen.controller;

import com.campus.canteen.dto.AdminOrderDTO;
import com.campus.canteen.model.Order;
import com.campus.canteen.model.OrderStatus;
import com.campus.canteen.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
            
        OrderStatus orderStatus = null;
        if (status != null && !status.isEmpty() && !status.equals("ALL")) {
            try {
                orderStatus = OrderStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Invalid status string
            }
        }
        
        String safeSearch = (search != null && !search.trim().isEmpty()) ? "%" + search.trim() + "%" : "";
        
        List<Order> orders = orderRepository.findForAdmin(orderStatus, safeSearch);
        
        List<AdminOrderDTO> dtos = orders.stream().map(o -> {
            AdminOrderDTO dto = new AdminOrderDTO();
            dto.setId(o.getId());
            dto.setStudentUsername(o.getStudent().getUsername());
            dto.setTotalAmount(o.getTotalAmount());
            dto.setStatus(o.getStatus().name());
            dto.setTokenNumber(o.getToken() != null ? o.getToken().getTokenNumber() : null);
            dto.setPaymentMethod(o.getPayment() != null ? o.getPayment().getMethod().name() : null);
            dto.setPaymentStatus(o.getPayment() != null ? o.getPayment().getStatus().name() : null);
            dto.setCreatedAt(o.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }
}
