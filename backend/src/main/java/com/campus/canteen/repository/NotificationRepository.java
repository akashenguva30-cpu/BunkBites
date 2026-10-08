package com.campus.canteen.repository;

import com.campus.canteen.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    int countByUserIdAndIsReadFalse(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
