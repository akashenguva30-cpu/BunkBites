package com.campus.canteen.repository;

import com.campus.canteen.model.Favorite;
import com.campus.canteen.model.MenuItem;
import com.campus.canteen.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    @EntityGraph(attributePaths = "menuItem")
    List<Favorite> findByUserOrderByCreatedAtDesc(User user);
    Optional<Favorite> findByUserAndMenuItem(User user, MenuItem menuItem);
    boolean existsByUserAndMenuItem(User user, MenuItem menuItem);
}
