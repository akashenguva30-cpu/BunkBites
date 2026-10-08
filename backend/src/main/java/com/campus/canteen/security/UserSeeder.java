package com.campus.canteen.security;

import com.campus.canteen.model.ERole;
import com.campus.canteen.model.Role;
import com.campus.canteen.model.User;
import com.campus.canteen.repository.RoleRepository;
import com.campus.canteen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Order(2)
public class UserSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultUser("admin", "admin@canteen.com", "Admin@123", ERole.ROLE_ADMIN);
        createDefaultUser("staff", "staff@canteen.com", "Staff@123", ERole.ROLE_STAFF);
    }

    private void createDefaultUser(String username, String email, String password, ERole eRole) {
        if (!userRepository.existsByUsername(username) && !userRepository.existsByEmail(email)) {
            Optional<Role> roleOpt = roleRepository.findByName(eRole);
            if (roleOpt.isPresent()) {
                User user = new User(username, email, encoder.encode(password));
                user.setRole(roleOpt.get());
                userRepository.save(user);
                System.out.println("Default " + eRole.name() + " created: username=" + username + ", password=" + password);
            }
        }
    }
}
