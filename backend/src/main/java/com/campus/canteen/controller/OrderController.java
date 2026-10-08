package com.campus.canteen.controller;

import com.campus.canteen.dto.CartValidationResult;
import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.dto.OrderRequest;
import com.campus.canteen.dto.RazorpayOrderResponse;
import com.campus.canteen.dto.RazorpayVerificationRequest;
import com.campus.canteen.exception.PaymentFailedException;
import com.campus.canteen.model.*;
import com.campus.canteen.repository.*;
import com.campus.canteen.service.OrderService;
import com.campus.canteen.service.RazorpayService;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private RazorpayService razorpayService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        try {
            Order order = orderService.createOrder(request, student);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (PaymentFailedException e) {
            Map<String, Object> failedResponse = new HashMap<>();
            failedResponse.put("status", "FAILED");
            failedResponse.put("message", e.getMessage());
            failedResponse.put("transactionReference", e.getTransactionReference());
            return ResponseEntity.badRequest().body(failedResponse);
        }
    }

    @PostMapping("/razorpay/create-order")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody OrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        try {
            CartValidationResult validationResult = orderService.validateAndCalculateCart(request.getItems());
            
            BigDecimal totalAmount = validationResult.getTotalAmount();
            long amountInPaise = totalAmount.multiply(new BigDecimal("100")).longValue();
            String receipt = "CPX_RZP_" + System.currentTimeMillis();
            
            com.razorpay.Order razorpayOrder = razorpayService.createRazorpayOrder(amountInPaise, receipt);
            String razorpayOrderId = razorpayOrder.get("id");
            
            orderService.createPendingRazorpayOrder(request, student, razorpayOrderId);

            RazorpayOrderResponse response = new RazorpayOrderResponse();
            response.setRazorpayOrderId(razorpayOrderId);
            response.setAmount(amountInPaise);
            response.setCurrency("INR");
            response.setKeyId(razorpayService.getKeyId());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (RazorpayException e) {
            Map<String, Object> failedResponse = new HashMap<>();
            failedResponse.put("status", "FAILED");
            failedResponse.put("message", "Could not initialize Razorpay payment.");
            return ResponseEntity.badRequest().body(failedResponse);
        } catch (Throwable e) {
            e.printStackTrace(System.err);
            return ResponseEntity.internalServerError().body(new MessageResponse("Internal error: " + e.toString()));
        }
    }

    @PostMapping("/razorpay/verify")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> verifyRazorpayOrder(@RequestBody RazorpayVerificationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        try {
            boolean isValid = razorpayService.verifySignature(
                request.getRazorpayOrderId(), 
                request.getRazorpayPaymentId(), 
                request.getRazorpaySignature()
            );

            if (!isValid) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid Razorpay signature"));
            }

            Order order = orderService.verifyAndPlaceRazorpayOrder(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                student
            );
            
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Throwable e) {
            e.printStackTrace(System.err);
            return ResponseEntity.internalServerError().body(new MessageResponse("Internal error: " + e.toString()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        return ResponseEntity.ok(orderRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Order not found"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        
        if (user != null && "ROLE_STUDENT".equals(user.getRole().getName())) {
            if (!order.getStudent().getId().equals(user.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Access denied"));
            }
        }
        
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{id}/queue")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getOrderQueue(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Order not found"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        
        if (user == null || !order.getStudent().getId().equals(user.getId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Access denied"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("token", order.getToken() != null ? order.getToken().getTokenNumber() : "N/A");
        response.put("status", order.getStatus().name());

        if (order.getStatus() == OrderStatus.COLLECTED || order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REJECTED) {
            response.put("isReady", false);
            response.put("ordersAhead", 0);
            response.put("currentToken", "N/A");
            return ResponseEntity.ok(response);
        }

        if (order.getStatus() == OrderStatus.READY) {
            response.put("isReady", true);
            response.put("ordersAhead", 0);
            response.put("currentToken", order.getToken() != null ? order.getToken().getTokenNumber() : "N/A");
            return ResponseEntity.ok(response);
        }

        LocalDateTime startOfDay = order.getCreatedAt().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = order.getCreatedAt().toLocalDate().atTime(23, 59, 59, 999999999);
        
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING);
        List<Order> activeOrders = orderRepository.findByStatusInAndCreatedAtBetweenOrderByCreatedAtAsc(activeStatuses, startOfDay, endOfDay);

        int ordersAhead = 0;
        String currentToken = order.getToken() != null ? order.getToken().getTokenNumber() : "N/A";
        
        if (!activeOrders.isEmpty()) {
            currentToken = activeOrders.get(0).getToken() != null ? activeOrders.get(0).getToken().getTokenNumber() : "N/A";
            
            for (Order o : activeOrders) {
                if (o.getId().equals(order.getId())) {
                    break;
                }
                if (o.getCreatedAt().isBefore(order.getCreatedAt()) || o.getCreatedAt().isEqual(order.getCreatedAt())) {
                    ordersAhead++;
                }
            }
        }

        response.put("isReady", false);
        response.put("ordersAhead", ordersAhead);
        response.put("currentToken", currentToken);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody com.campus.canteen.dto.OrderStatusUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User staff = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (staff == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        try {
            Order order = orderService.updateOrderStatus(id, request.getStatus(), staff);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        try {
            Order order = orderService.cancelOrder(id, student);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
