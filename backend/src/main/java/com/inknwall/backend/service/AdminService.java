package com.inknwall.backend.service;

import com.inknwall.backend.dto.LoginRequest;
import com.inknwall.backend.dto.RegisterRequest;
import com.inknwall.backend.entity.Admin;
import com.inknwall.backend.entity.AdminLog;
import com.inknwall.backend.repository.AdminLogRepository;
import com.inknwall.backend.repository.AdminRepository;
import com.inknwall.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final AdminLogRepository adminLogRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;


    public String login(String email, String password){
        System.out.println("LOGIN METHOD CALLED for: " + email);

        Admin admin = adminRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Admin not Found"));

        if(!passwordEncoder.matches(password,admin.getPassword())){
            throw new RuntimeException("Invalid Password");
        }
        // ✅ LOG ENTRY
        AdminLog log = new AdminLog();
        log.setAdminEmail(admin.getEmail());
        log.setAction("LOGIN");
        log.setDetails("Admin logged in");
        log.setTimestamp(LocalDateTime.now());

        System.out.println("Saving log...");
        adminLogRepository.save(log);
        System.out.println("Log saved!");
//        adminLogRepository.save(log);
        return jwtUtil.generateToken(admin.getEmail());
    }
}