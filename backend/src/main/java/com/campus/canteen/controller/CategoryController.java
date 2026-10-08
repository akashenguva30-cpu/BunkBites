package com.campus.canteen.controller;

import com.campus.canteen.dto.CategoryRequest;
import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.model.Category;
import com.campus.canteen.repository.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category name already taken!"));
        }
        Category category = new Category(request.getName(), request.getDescription());
        categoryRepository.save(category);
        return ResponseEntity.ok(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryRepository.findById(id).map(category -> {
            if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Category name already taken!"));
            }
            category.setName(request.getName());
            category.setDescription(request.getDescription());
            categoryRepository.save(category);
            return ResponseEntity.ok(category);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Category deleted successfully!"));
    }
}
