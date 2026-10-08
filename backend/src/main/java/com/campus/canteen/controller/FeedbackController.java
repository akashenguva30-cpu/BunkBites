package com.campus.canteen.controller;

import com.campus.canteen.dto.FeedbackRequest;
import com.campus.canteen.dto.FeedbackResponse;
import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.model.Feedback;
import com.campus.canteen.model.Order;
import com.campus.canteen.model.OrderStatus;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.FeedbackRepository;
import com.campus.canteen.repository.OrderRepository;
import com.campus.canteen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Rating must be between 1 and 5"));
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User student = userRepository.findByUsername(username).orElse(null);
        if (student == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: User not found"));

        Optional<Order> orderOpt = orderRepository.findById(request.getOrderId());
        if (orderOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Order not found"));
        }

        Order order = orderOpt.get();

        if (!order.getStudent().getId().equals(student.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You can only rate your own orders"));
        }

        if (order.getStatus() != OrderStatus.COLLECTED) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: You can only rate orders that have been collected"));
        }

        if (feedbackRepository.existsByOrderId(order.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse("Error: Feedback already exists for this order"));
        }

        if (request.getComment() != null && request.getComment().length() > 500) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Comment exceeds 500 characters"));
        }

        Feedback feedback = new Feedback();
        feedback.setOrder(order);
        feedback.setUser(student);
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        feedbackRepository.save(feedback);

        return ResponseEntity.ok(new FeedbackResponse(feedback));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getFeedbackForOrder(@PathVariable Long orderId) {
        Optional<Feedback> feedbackOpt = feedbackRepository.findByOrderId(orderId);
        if (feedbackOpt.isPresent()) {
            return ResponseEntity.ok(new FeedbackResponse(feedbackOpt.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Feedback not found"));
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllFeedback() {
        List<FeedbackResponse> feedback = feedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(FeedbackResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(feedback);
    }
}
