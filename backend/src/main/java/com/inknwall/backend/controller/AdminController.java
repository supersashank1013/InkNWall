package com.inknwall.backend.controller;

import java.util.*;
import com.inknwall.backend.dto.LoginRequest;
import com.inknwall.backend.dto.AdminLoginRequest;
import com.inknwall.backend.entity.Admin;
import com.inknwall.backend.entity.AdminLog;
import com.inknwall.backend.repository.AdminLogRepository;
import com.inknwall.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")   // ✅ VERY IMPORTANT
@RequiredArgsConstructor
@CrossOrigin
public class AdminController {

    private final AdminService adminService;
    private final AdminLogRepository adminLogRepository;

    @PostMapping("/login")
    public String login(@RequestBody AdminLoginRequest request) {
        return adminService.login(request.getEmail(), request.getPassword());
    }

    @GetMapping("/test")
    public String test() {
        return "Admin access granted";
    }

    @GetMapping("/logs")
    public List<AdminLog> getLogs() {
        return adminLogRepository.findAll();
    }

}