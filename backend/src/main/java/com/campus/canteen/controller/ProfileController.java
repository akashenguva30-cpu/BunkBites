package com.campus.canteen.controller;

import com.campus.canteen.dto.ChangePasswordRequest;
import com.campus.canteen.dto.MessageResponse;
import com.campus.canteen.dto.UpdateProfileRequest;
import com.campus.canteen.dto.UserProfileResponse;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.UserRepository;
import com.campus.canteen.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }

        UserProfileResponse response = new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().getName().name().replace("ROLE_", ""),
                user.isEnabled()
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        user.setEmail(request.getEmail());
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }

    @PutMapping("/password")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }

        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Incorrect current password!"));
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: New passwords do not match!"));
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
    }
}
