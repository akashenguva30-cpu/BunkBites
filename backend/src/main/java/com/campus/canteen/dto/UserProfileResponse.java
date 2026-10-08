package com.campus.canteen.dto;

public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean enabled;

    public UserProfileResponse(Long id, String username, String email, String role, boolean enabled) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.enabled = enabled;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isEnabled() { return enabled; }
}
