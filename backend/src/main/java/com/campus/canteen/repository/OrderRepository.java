package com.campus.canteen.repository;

import com.campus.canteen.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.campus.canteen.model.OrderStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    
    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:search = '' OR " +
           "  CAST(o.id AS string) LIKE :search OR " +
           "  LOWER(o.student.username) LIKE LOWER(CAST(:search AS string)) OR " +
           "  LOWER(o.token.tokenNumber) LIKE LOWER(CAST(:search AS string))" +
           ") " +
           "ORDER BY o.createdAt DESC")
    List<Order> findForAdmin(@Param("status") OrderStatus status, @Param("search") String search);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusInAndCreatedAtBetween(List<OrderStatus> statuses, LocalDateTime start, LocalDateTime end);

    List<Order> findByStatusInAndCreatedAtBetweenOrderByCreatedAtAsc(List<OrderStatus> statuses, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :statuses AND o.createdAt BETWEEN :start AND :end")
    double sumTotalAmountByStatusInAndCreatedAtBetween(@Param("statuses") List<OrderStatus> statuses, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT new com.campus.canteen.dto.PopularItemDTO(oi.menuItem.name, SUM(oi.quantity)) FROM Order o JOIN o.items oi WHERE o.createdAt BETWEEN :start AND :end GROUP BY oi.menuItem.name ORDER BY SUM(oi.quantity) DESC")
    List<com.campus.canteen.dto.PopularItemDTO> findPopularItems(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT oi.menuItem.id FROM Order o JOIN o.items oi WHERE o.createdAt BETWEEN :start AND :end GROUP BY oi.menuItem.id ORDER BY SUM(oi.quantity) DESC")
    List<Long> findPopularMenuItemIds(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Order> findTop10ByOrderByCreatedAtDesc();
}
