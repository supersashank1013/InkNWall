package com.inknwall.backend.controller;

import java.util.*;
import com.inknwall.backend.dto.LoginRequest;
import com.inknwall.backend.dto.AdminLoginRequest;
import com.inknwall.backend.entity.Admin;
import com.inknwall.backend.entity.AdminLog;
import com.inknwall.backend.repository.AdminLogRepository;
import com.inknwall.backend.service.AdminService;
import com.inknwall.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")   // ✅ VERY IMPORTANT
@RequiredArgsConstructor
@CrossOrigin
public class AdminController {

    private final AdminService adminService;
    private final AdminLogRepository adminLogRepository;
    private final EmailService emailService;

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

    @PostMapping("/mail-test")
    public ResponseEntity<Map<String, Object>> sendMailTest(@RequestBody(required = false) Map<String, String> body) {
        String to = body != null ? body.get("to") : null;
        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "sent", false,
                    "message", "Recipient email is required"
            ));
        }

        EmailService.EmailResult result = emailService.sendEmailNow(
                to.trim(),
                "InkNWall SMTP Test",
                """
                <p>Your InkNWall SMTP configuration is working.</p>
                <p>If you received this email, order confirmation emails can be sent from the backend.</p>
                """
        );

        Map<String, Object> response = Map.of(
                "sent", result.sent(),
                "message", result.message()
        );

        return result.sent() ? ResponseEntity.ok(response) : ResponseEntity.status(500).body(response);
    }

}
