package com.campus.canteen.repository;

import com.campus.canteen.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategoryId(Long categoryId);
    List<MenuItem> findByNameContainingIgnoreCase(String name);
    List<MenuItem> findByAvailableTrue();
    List<MenuItem> findByCategoryIdAndAvailableTrue(Long categoryId);
    List<MenuItem> findByNameContainingIgnoreCaseAndAvailableTrue(String name);
}
