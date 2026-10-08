package com.campus.canteen.repository;

import com.campus.canteen.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);
    
    @Query("SELECT AVG(f.rating) FROM Feedback f JOIN f.order o JOIN o.items i WHERE i.menuItem.id = :menuItemId")
    Double getAverageRatingForMenuItem(@Param("menuItemId") Long menuItemId);
    
    @Query("SELECT COUNT(f) FROM Feedback f JOIN f.order o JOIN o.items i WHERE i.menuItem.id = :menuItemId")
    Long getRatingCountForMenuItem(@Param("menuItemId") Long menuItemId);
    
    // For admin view
    List<Feedback> findAllByOrderByCreatedAtDesc();
}
