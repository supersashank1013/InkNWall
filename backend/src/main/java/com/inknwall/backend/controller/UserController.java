package com.inknwall.backend.controller;

import com.inknwall.backend.entity.User;
import com.inknwall.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.inknwall.backend.util.JwtUtil;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor

public class UserController {

    private final UserService service;
    private final JwtUtil jwtUtil;

    @PostMapping("/google-login")
    public Map<String, Object> googleLogin(@RequestBody User user) {
        User savedUser = service.googleLogin(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());
        return Map.of(
                "token", token,
                "user", savedUser
        );
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User updated) {
        return service.updateUser(id, updated);
    }

}
