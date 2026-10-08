package com.campus.canteen.security;

import com.campus.canteen.model.ERole;
import com.campus.canteen.model.Role;
import com.campus.canteen.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

import org.springframework.core.annotation.Order;

@Component
@Order(1)
public class RoleSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        Arrays.stream(ERole.values()).forEach(eRole -> {
            if (roleRepository.findByName(eRole).isEmpty()) {
                roleRepository.save(new Role(eRole));
            }
        });
    }
}
