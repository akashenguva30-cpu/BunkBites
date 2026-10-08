package com.campus.canteen.service;

import com.campus.canteen.dto.OrderRequest;
import com.campus.canteen.dto.CartValidationResult;
import com.campus.canteen.exception.PaymentFailedException;
import com.campus.canteen.model.*;
import com.campus.canteen.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TokenRepository tokenRepository;
    @Autowired private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PaymentRepository paymentRepository;

    public CartValidationResult validateAndCalculateCart(List<OrderRequest.OrderItemRequest> itemsReq) {
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemReq : itemsReq) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId()).orElse(null);
            if (menuItem == null || !menuItem.isAvailable()) {
                throw new IllegalArgumentException("Error: Item unavailable or not found");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            
            BigDecimal subtotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            orderItem.setSubtotal(subtotal);
            orderItems.add(orderItem);

            totalAmount = totalAmount.add(subtotal);
        }

        return new CartValidationResult(orderItems, totalAmount);
    }

    @Transactional
    public Order createOrder(OrderRequest request, User student) {
        CartValidationResult validationResult = validateAndCalculateCart(request.getItems());
        
        Order order = new Order();
        order.setStudent(student);
        order.setStatus(OrderStatus.PLACED);

        List<OrderItem> orderItems = validationResult.getOrderItems();
        BigDecimal totalAmount = validationResult.getTotalAmount();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
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
            String message = (com.campus.canteen.model.PaymentMethod.WALLET.equals(paymentMethod) && student.getWalletBalance().compareTo(totalAmount) < 0) 
                ? "Insufficient Campus Wallet balance." 
                : "Your payment could not be completed.";
            throw new PaymentFailedException(message, txnRef);
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
        
        orderRepository.save(order);

        // Create success notification
        Notification notification = new Notification();
        notification.setUser(student);
        notification.setMessage("Payment successful. Your order " + token.getTokenNumber() + " is confirmed.");
        notificationRepository.save(notification);

        return order;
    }

    @Transactional
    public Order createPendingRazorpayOrder(OrderRequest request, User student, String razorpayOrderId) {
        CartValidationResult validationResult = validateAndCalculateCart(request.getItems());
        
        Order order = new Order();
        order.setStudent(student);
        order.setStatus(OrderStatus.PAYMENT_PENDING);

        List<OrderItem> orderItems = validationResult.getOrderItems();
        BigDecimal totalAmount = validationResult.getTotalAmount();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalAmount);
        payment.setMethod(com.campus.canteen.model.PaymentMethod.RAZORPAY);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionReference(razorpayOrderId);
        order.setPayment(payment);
        
        orderRepository.save(order);
        return order;
    }

    @Transactional
    public Order verifyAndPlaceRazorpayOrder(String razorpayOrderId, String razorpayPaymentId, User student) {
        Payment payment = paymentRepository.findByTransactionReference(razorpayOrderId).orElse(null);
        if (payment == null) {
            throw new IllegalArgumentException("Error: Payment not found for Razorpay Order ID");
        }

        Order order = payment.getOrder();
        if (!order.getStudent().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Error: Access denied. Order does not belong to user");
        }

        if (payment.getMethod() != com.campus.canteen.model.PaymentMethod.RAZORPAY) {
            throw new IllegalArgumentException("Error: Payment method is not RAZORPAY");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS && order.getStatus() == OrderStatus.PLACED) {
            // Already verified (Idempotent response)
            return order;
        }

        if (payment.getStatus() != PaymentStatus.PENDING || order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new IllegalArgumentException("Error: Payment or Order is not in a PENDING state");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        order.setStatus(OrderStatus.PLACED);

        // Token Generation
        Token token = new Token();
        token.setOrder(order);
        long count = tokenRepository.count();
        token.setTokenNumber(String.format("A%03d", count + 1));
        order.setToken(token);
        
        orderRepository.save(order);

        // Create success notification
        Notification notification = new Notification();
        notification.setUser(student);
        notification.setMessage("Payment successful. Your order " + token.getTokenNumber() + " is confirmed.");
        notificationRepository.save(notification);

        return order;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, User staff) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) throw new IllegalArgumentException("Error: Order not found");

        OrderStatus oldStatus = order.getStatus();

        // Validate status transition
        boolean valid = false;
        if (oldStatus == OrderStatus.PLACED && (newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.REJECTED)) valid = true;
        if (oldStatus == OrderStatus.ACCEPTED && newStatus == OrderStatus.PREPARING) valid = true;
        if (oldStatus == OrderStatus.PREPARING && newStatus == OrderStatus.READY) valid = true;
        if (oldStatus == OrderStatus.READY && newStatus == OrderStatus.COLLECTED) valid = true;

        if (!valid) {
            throw new IllegalArgumentException("Error: Invalid status transition from " + oldStatus + " to " + newStatus);
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

        return order;
    }

    @Transactional
    public Order cancelOrder(Long orderId, User student) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || !order.getStudent().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Error: Order not found or access denied");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalArgumentException("Error: Only PLACED orders can be cancelled");
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

        return order;
    }
}
