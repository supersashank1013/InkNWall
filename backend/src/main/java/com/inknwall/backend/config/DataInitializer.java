package com.inknwall.backend.config;

import com.inknwall.backend.entity.Admin;
import com.inknwall.backend.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if (adminRepository.count() == 0) {

            adminRepository.save(new Admin(null, "TS-sashank",
                    passwordEncoder.encode("tonystarkmark42")));

            adminRepository.save(new Admin(null, "Marvelmax",
                    passwordEncoder.encode("marvel123")));

            adminRepository.save(new Admin(null, "GridVelocity",
                    passwordEncoder.encode("Velocity123")));

            adminRepository.save(new Admin(null, "notTanishqGamer",
                    passwordEncoder.encode("Gamerz123.")));

            System.out.println("✅ 4 Admins created");
        }
    }
}