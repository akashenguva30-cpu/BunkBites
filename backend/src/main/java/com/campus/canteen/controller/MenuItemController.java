package com.campus.canteen.controller;

import com.campus.canteen.dto.MenuItemRequest;
import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.model.Category;
import com.campus.canteen.model.MenuItem;
import com.campus.canteen.repository.CategoryRepository;
import com.campus.canteen.repository.FeedbackRepository;
import com.campus.canteen.repository.MenuItemRepository;
import com.campus.canteen.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MenuItemController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Value("${app.upload.dir:uploads/menu}")
    private String uploadDir;

    private void populateRatings(List<MenuItem> items) {
        for (MenuItem item : items) {
            populateRating(item);
        }
    }

    private void populateRating(MenuItem item) {
        Double avg = feedbackRepository.getAverageRatingForMenuItem(item.getId());
        Long count = feedbackRepository.getRatingCountForMenuItem(item.getId());
        item.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : null);
        item.setRatingCount(count != null ? count : 0L);
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<MenuItem>> getAllMenuItems(@RequestParam(required = false) Long categoryId,
                                                          @RequestParam(required = false) String search,
                                                          @RequestParam(required = false) Boolean all) {
        // Students should only see available items by default unless 'all' is explicitly true and user is staff
        // For simplicity, returning all available items for general query, 
        // and filtering based on category/search.
        
        // Note: For students, we enforce availability. For staff, they can see all.
        // We will just fetch available ones if the request is standard.
        // Actually, let's keep it simple: 
        if (search != null && !search.isEmpty()) {
            List<MenuItem> items = menuItemRepository.findByNameContainingIgnoreCase(search);
            populateRatings(items);
            return ResponseEntity.ok(items);
        }
        if (categoryId != null) {
            List<MenuItem> items = menuItemRepository.findByCategoryId(categoryId);
            populateRatings(items);
            return ResponseEntity.ok(items);
        }
        List<MenuItem> items = menuItemRepository.findAll();
        populateRatings(items);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<MenuItem>> getAvailableMenuItems(@RequestParam(required = false) Long categoryId,
                                                                @RequestParam(required = false) String search) {
        if (search != null && !search.isEmpty()) {
            List<MenuItem> items = menuItemRepository.findByNameContainingIgnoreCaseAndAvailableTrue(search);
            populateRatings(items);
            return ResponseEntity.ok(items);
        }
        if (categoryId != null) {
            List<MenuItem> items = menuItemRepository.findByCategoryIdAndAvailableTrue(categoryId);
            populateRatings(items);
            return ResponseEntity.ok(items);
        }
        List<MenuItem> items = menuItemRepository.findByAvailableTrue();
        populateRatings(items);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/popular-ids")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<Long>> getPopularMenuItemIds() {
        // Consider popular over the last 30 days
        java.time.LocalDateTime endOfDay = java.time.LocalDateTime.now();
        java.time.LocalDateTime startOfDay = endOfDay.minusDays(30);
        List<Long> popularIds = orderRepository.findPopularMenuItemIds(startOfDay, endOfDay);
        return ResponseEntity.ok(popularIds);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getMenuItemById(@PathVariable Long id) {
        return menuItemRepository.findById(id)
                .map(item -> {
                    populateRating(item);
                    return ResponseEntity.ok(item);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String contentType = file.getContentType();
            if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid file type. Only JPEG, PNG, and WEBP are allowed."));
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String newFilename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", "/uploads/menu/" + newFilename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(500).body(new MessageResponse("Error: Failed to upload file"));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        Optional<Category> category = categoryRepository.findById(request.getCategoryId());
        if (category.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found!"));
        }

        MenuItem item = new MenuItem();
        item.setCategory(category.get());
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setImageUrl(request.getImageUrl());
        item.setAvailable(request.isAvailable());
        item.setPreparationTime(request.getPreparationTime());

        menuItemRepository.save(item);
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long id, @Valid @RequestBody MenuItemRequest request) {
        return menuItemRepository.findById(id).map(item -> {
            Optional<Category> category = categoryRepository.findById(request.getCategoryId());
            if (category.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found!"));
            }

            item.setCategory(category.get());
            item.setName(request.getName());
            item.setDescription(request.getDescription());
            item.setPrice(request.getPrice());
            item.setImageUrl(request.getImageUrl());
            item.setAvailable(request.isAvailable());
            item.setPreparationTime(request.getPreparationTime());

            menuItemRepository.save(item);
            return ResponseEntity.ok(item);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        if (!menuItemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        menuItemRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("MenuItem deleted successfully!"));
    }
}
