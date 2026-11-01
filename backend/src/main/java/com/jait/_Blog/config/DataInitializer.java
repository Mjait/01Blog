package com.jait._Blog.config;

import com.jait._Blog.user.Role;
import com.jait._Blog.user.User;
import com.jait._Blog.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@01blog.com")
                    .password(passwordEncoder.encode("admin123"))
                    .bio("01Blog Platform Administrator")
                    .role(Role.ADMIN)
                    .banned(false)
                    .build();
            userRepository.save(admin);
        }
    }
}