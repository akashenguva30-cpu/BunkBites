package com.campus.canteen.repository;

import com.campus.canteen.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.campus.canteen.model.PaymentStatus;
import com.campus.canteen.model.PaymentMethod;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    @Query("SELECT p FROM Payment p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:method IS NULL OR p.method = :method) AND " +
           "(:search = '' OR " +
           "  LOWER(p.transactionReference) LIKE LOWER(CAST(:search AS string)) OR " +
           "  CAST(p.order.id AS string) LIKE :search OR " +
           "  LOWER(p.order.student.username) LIKE LOWER(CAST(:search AS string))" +
           ") " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findForAdmin(@Param("status") PaymentStatus status, @Param("method") PaymentMethod method, @Param("search") String search);
}
