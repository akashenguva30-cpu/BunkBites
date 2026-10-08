package com.campus.canteen.controller;

import com.campus.canteen.model.ERole;
import com.campus.canteen.model.Role;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.RoleRepository;
import com.campus.canteen.repository.UserRepository;
import com.campus.canteen.dto.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        List<User> users = userRepository.findAll();

        if (search != null && !search.isEmpty()) {
            users = users.stream()
                .filter(u -> u.getUsername().toLowerCase().contains(search.toLowerCase()) || 
                             u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .collect(Collectors.toList());
        }

        if (role != null && !role.equals("ALL")) {
            users = users.stream()
                .filter(u -> u.getRole().getName().name().equals("ROLE_" + role))
                .collect(Collectors.toList());
        }

        List<Map<String, Object>> userDtos = users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().getName().name());
            map.put("enabled", u.isEnabled());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userDtos);
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String password = request.get("password");

        if (username == null || username.isEmpty() || email == null || email.isEmpty() || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Missing required fields"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User(username, email, encoder.encode(password));
        Role staffRole = roleRepository.findByName(ERole.ROLE_STAFF)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRole(staffRole);
        user.setEnabled(true);

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Staff user registered successfully!"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        Boolean enabled = request.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Missing 'enabled' status"));
        }

        User targetUser = userRepository.findById(id).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found"));
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        
        if (targetUser.getUsername().equals(currentUsername)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: You cannot disable your own account"));
        }

        targetUser.setEnabled(enabled);
        userRepository.save(targetUser);

        return ResponseEntity.ok(new MessageResponse("User status updated successfully!"));
    }
}
