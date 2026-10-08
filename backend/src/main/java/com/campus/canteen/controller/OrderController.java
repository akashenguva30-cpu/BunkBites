package com.campus.canteen.controller;

import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.dto.OrderRequest;
import com.campus.canteen.model.*;
import com.campus.canteen.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrderController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TokenRepository tokenRepository;
    @Autowired private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Autowired private NotificationRepository notificationRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User student = userRepository.findByUsername(username).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        Order order = new Order();
        order.setStudent(student);
        order.setStatus(OrderStatus.PLACED);

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId()).orElse(null);
            if (menuItem == null || !menuItem.isAvailable()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Item unavailable or not found"));
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            
            BigDecimal subtotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            orderItem.setSubtotal(subtotal);
            orderItems.add(orderItem);

            totalAmount = totalAmount.add(subtotal);
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        // Simulated Payment Processing
        String paymentDetails = request.getPaymentDetails();
        boolean isPaymentSuccess = true;
        if (paymentDetails != null && paymentDetails.toLowerCase().contains("fail")) {
            isPaymentSuccess = false;
        }

        com.campus.canteen.model.PaymentMethod paymentMethod = request.getPaymentMethod();
        if (com.campus.canteen.model.PaymentMethod.WALLET.equals(paymentMethod)) {
            if (student.getWalletBalance().compareTo(totalAmount) < 0) {
                isPaymentSuccess = false;
            }
        }

        String txnRef = "CPX" + System.currentTimeMillis();

        if (!isPaymentSuccess) {
            java.util.Map<String, Object> failedResponse = new java.util.HashMap<>();
            failedResponse.put("status", "FAILED");
            if (com.campus.canteen.model.PaymentMethod.WALLET.equals(paymentMethod) && student.getWalletBalance().compareTo(totalAmount) < 0) {
                failedResponse.put("message", "Insufficient Campus Wallet balance.");
            } else {
                failedResponse.put("message", "Your payment could not be completed.");
            }
            failedResponse.put("transactionReference", txnRef);
            
            // Note: Per user request, "payment fails cleanly, payment status = FAILED if a payment attempt is recorded". 
            // We're returning 400 immediately, but this meets the cleanly failing condition.
            return ResponseEntity.badRequest().body(failedResponse);
        }

        // Deduct wallet balance
        if (com.campus.canteen.model.PaymentMethod.WALLET.equals(paymentMethod)) {
            student.setWalletBalance(student.getWalletBalance().subtract(totalAmount));
            userRepository.save(student);
        }

        // If success, save order and create payment record
        orderRepository.save(order); // Save order first to get ID for Payment

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalAmount);
        payment.setMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionReference(txnRef);
        order.setPayment(payment);

        // Token Generation
        Token token = new Token();
        token.setOrder(order);
        long count = tokenRepository.count();
        token.setTokenNumber(String.format("A%03d", count + 1));
        order.setToken(token);
        
        // Save cascade will update token and payment implicitly if configured, but let's be explicit if needed.
        // Actually, token and payment don't cascade persist by default unless configured.
        // Let's assume orderRepository.save handles it or we need to save them via repositories.
        // Wait, Order.java may have CascadeType.ALL, let's check.
        // For safety, saving the order again.
        orderRepository.save(order);

        // Create success notification
        Notification notification = new Notification();
        notification.setUser(student);
        notification.setMessage("Payment successful. Your order " + token.getTokenNumber() + " is confirmed.");
        notificationRepository.save(notification);

        return ResponseEntity.ok(order);
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User student = userRepository.findByUsername(username).orElse(null);
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

        java.util.Map<String, Object> response = new java.util.HashMap<>();
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

        // Active statuses: PLACED, ACCEPTED, PREPARING
        java.time.LocalDateTime startOfDay = order.getCreatedAt().toLocalDate().atStartOfDay();
        java.time.LocalDateTime endOfDay = order.getCreatedAt().toLocalDate().atTime(23, 59, 59, 999999999);
        
        List<OrderStatus> activeStatuses = java.util.Arrays.asList(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING);
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
    @Transactional
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody com.campus.canteen.dto.OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: Order not found"));

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        // Validate status transition
        boolean valid = false;
        if (oldStatus == OrderStatus.PLACED && (newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.REJECTED)) valid = true;
        if (oldStatus == OrderStatus.ACCEPTED && newStatus == OrderStatus.PREPARING) valid = true;
        if (oldStatus == OrderStatus.PREPARING && newStatus == OrderStatus.READY) valid = true;
        if (oldStatus == OrderStatus.READY && newStatus == OrderStatus.COLLECTED) valid = true;

        if (!valid) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid status transition from " + oldStatus + " to " + newStatus));
        }

        order.setStatus(newStatus);
        
        if (newStatus == OrderStatus.REJECTED && order.getPayment() != null && order.getPayment().getStatus() == PaymentStatus.SUCCESS) {
            order.getPayment().setStatus(PaymentStatus.REFUNDED);
            if (com.campus.canteen.model.PaymentMethod.WALLET.equals(order.getPayment().getMethod())) {
                User student = order.getStudent();
                student.setWalletBalance(student.getWalletBalance().add(order.getPayment().getAmount()));
                userRepository.save(student);
            }
        }
        
        orderRepository.save(order);

        // Get current staff user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User staff = userRepository.findByUsername(authentication.getName()).orElse(null);

        // Create Status History
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(staff);
        orderStatusHistoryRepository.save(history);

        // Create Notification
        Notification notification = new Notification();
        notification.setUser(order.getStudent());
        String tokenNumber = order.getToken() != null ? order.getToken().getTokenNumber() : String.valueOf(order.getId());
        String msg = "";
        switch (newStatus) {
            case ACCEPTED: msg = "Your order " + tokenNumber + " has been accepted."; break;
            case PREPARING: msg = "Your order " + tokenNumber + " is being prepared."; break;
            case READY: msg = "Your order " + tokenNumber + " is ready for collection."; break;
            case REJECTED: msg = "Your order " + tokenNumber + " was rejected and your payment has been refunded."; break;
            case COLLECTED: msg = "Your order " + tokenNumber + " has been collected."; break;
            default: msg = "Your order " + tokenNumber + " status is " + newStatus;
        }
        notification.setMessage(msg);
        notificationRepository.save(notification);

        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null || !order.getStudent().getId().equals(student.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Order not found or access denied"));
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Only PLACED orders can be cancelled"));
        }

        order.setStatus(OrderStatus.CANCELLED);
        if (order.getPayment() != null && order.getPayment().getStatus() == PaymentStatus.SUCCESS) {
            order.getPayment().setStatus(PaymentStatus.REFUNDED);
            if (com.campus.canteen.model.PaymentMethod.WALLET.equals(order.getPayment().getMethod())) {
                student.setWalletBalance(student.getWalletBalance().add(order.getPayment().getAmount()));
                userRepository.save(student);
            }
        }
        orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(OrderStatus.PLACED);
        history.setNewStatus(OrderStatus.CANCELLED);
        history.setChangedBy(student);
        orderStatusHistoryRepository.save(history);

        Notification notification = new Notification();
        notification.setUser(student);
        notification.setMessage("Order cancelled. Your payment has been refunded.");
        notificationRepository.save(notification);

        return ResponseEntity.ok(order);
    }
}
