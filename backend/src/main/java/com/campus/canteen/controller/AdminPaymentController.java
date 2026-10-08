package com.campus.canteen.controller;

import com.campus.canteen.dto.AdminPaymentDTO;
import com.campus.canteen.model.Payment;
import com.campus.canteen.model.PaymentMethod;
import com.campus.canteen.model.PaymentStatus;
import com.campus.canteen.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<?> getAllPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String search) {
            
        PaymentStatus paymentStatus = null;
        if (status != null && !status.isEmpty() && !status.equals("ALL")) {
            try {
                paymentStatus = PaymentStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
            }
        }
        
        PaymentMethod paymentMethod = null;
        if (method != null && !method.isEmpty() && !method.equals("ALL")) {
            try {
                paymentMethod = PaymentMethod.valueOf(method);
            } catch (IllegalArgumentException e) {
            }
        }
        
        String safeSearch = (search != null && !search.trim().isEmpty()) ? "%" + search.trim() + "%" : "";
        
        List<Payment> payments = paymentRepository.findForAdmin(paymentStatus, paymentMethod, safeSearch);
        
        List<AdminPaymentDTO> dtos = payments.stream().map(p -> {
            AdminPaymentDTO dto = new AdminPaymentDTO();
            dto.setId(p.getId());
            dto.setTransactionReference(p.getTransactionReference());
            dto.setOrderId(p.getOrder() != null ? p.getOrder().getId() : null);
            dto.setStudentUsername(p.getOrder() != null ? p.getOrder().getStudent().getUsername() : null);
            dto.setMethod(p.getMethod().name());
            dto.setAmount(p.getAmount());
            dto.setStatus(p.getStatus().name());
            dto.setCreatedAt(p.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getPaymentById(@PathVariable Long id) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", payment.getId());
        response.put("transactionReference", payment.getTransactionReference());
        response.put("orderId", payment.getOrder() != null ? payment.getOrder().getId() : null);
        response.put("studentUsername", payment.getOrder() != null ? payment.getOrder().getStudent().getUsername() : null);
        response.put("method", payment.getMethod().name());
        response.put("amount", payment.getAmount());
        response.put("status", payment.getStatus().name());
        response.put("createdAt", payment.getCreatedAt());
        
        return ResponseEntity.ok(response);
    }
}
