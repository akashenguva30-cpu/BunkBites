package com.campus.canteen.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class TestController {
    @GetMapping("/student/test")
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public String studentAccess() {
        return "Student Content.";
    }

    @GetMapping("/staff/test")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public String staffAccess() {
        return "Staff Content.";
    }

    @GetMapping("/admin/test")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin Content.";
    }
}
