package com.inknwall.backend.controller;

import com.inknwall.backend.entity.Announcement;
import com.inknwall.backend.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcement")
@RequiredArgsConstructor
@CrossOrigin
public class AnnouncementController {

    private final AnnouncementService service;

    // ✅ CREATE
    @PostMapping
    public Announcement create(
            @RequestParam String message,
            @RequestParam(required = false) Long posterId
    ) {
        System.out.println("MESSAGE: " + message);
        System.out.println("POSTER ID: " + posterId);
        return service.create(message, posterId);
    }

    // ✅ GET ALL
    @GetMapping
    public List<Announcement> getAll() {
        return service.getAll();
    }
}