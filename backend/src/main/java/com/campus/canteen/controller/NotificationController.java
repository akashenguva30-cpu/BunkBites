package com.campus.canteen.controller;

import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.model.Notification;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.NotificationRepository;
import com.campus.canteen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getNotifications() {
        User student = getCurrentUser();
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));
        
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId());
        int unreadCount = notificationRepository.countByUserIdAndIsReadFalse(student.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User student = getCurrentUser();
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));
        
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || !notification.getUser().getId().equals(student.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Notification not found"));
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
        
        return ResponseEntity.ok(new MessageResponse("Notification marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> markAllAsRead() {
        User student = getCurrentUser();
        if (student == null) return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));
        
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(student.getId());
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
        
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }
}
