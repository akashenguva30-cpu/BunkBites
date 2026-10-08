package com.campus.canteen.controller;

import com.campus.canteen.dto.FavoriteDTO;
import com.campus.canteen.model.Favorite;
import com.campus.canteen.model.MenuItem;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.FavoriteRepository;
import com.campus.canteen.repository.MenuItemRepository;
import com.campus.canteen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/favorites")
@PreAuthorize("hasRole('STUDENT')")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    @Transactional
    @GetMapping
    public ResponseEntity<?> getFavorites() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        List<Favorite> favorites = favoriteRepository.findByUserOrderByCreatedAtDesc(user);
        
        List<FavoriteDTO> dtos = favorites.stream().map(f -> {
            FavoriteDTO dto = new FavoriteDTO();
            dto.setId(f.getId());
            dto.setMenuItemId(f.getMenuItem().getId());
            MenuItem item = f.getMenuItem();
            MenuItem plainItem = new MenuItem();
            plainItem.setId(item.getId());
            plainItem.setName(item.getName());
            plainItem.setDescription(item.getDescription());
            plainItem.setPrice(item.getPrice());
            plainItem.setImageUrl(item.getImageUrl());
            plainItem.setAvailable(item.isAvailable());
            plainItem.setPreparationTime(item.getPreparationTime());
            plainItem.setAverageRating(item.getAverageRating());
            plainItem.setRatingCount(item.getRatingCount());
            dto.setMenuItem(plainItem);
            dto.setCreatedAt(f.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{menuItemId}")
    public ResponseEntity<?> addFavorite(@PathVariable Long menuItemId) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        Optional<MenuItem> itemOpt = menuItemRepository.findById(menuItemId);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Menu item not found"));
        }

        MenuItem item = itemOpt.get();

        if (favoriteRepository.existsByUserAndMenuItem(user, item)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Already favorited"));
        }

        Favorite favorite = new Favorite(user, item);
        favoriteRepository.save(favorite);
        return ResponseEntity.ok(java.util.Map.of("message", "Added to favorites"));
    }

    @DeleteMapping("/{menuItemId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long menuItemId) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        Optional<MenuItem> itemOpt = menuItemRepository.findById(menuItemId);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.ok(java.util.Map.of("message", "Not found anyway"));
        }

        Optional<Favorite> favOpt = favoriteRepository.findByUserAndMenuItem(user, itemOpt.get());
        if (favOpt.isPresent()) {
            favoriteRepository.delete(favOpt.get());
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Removed from favorites"));
    }
}
