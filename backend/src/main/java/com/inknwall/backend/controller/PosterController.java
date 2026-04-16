package com.inknwall.backend.controller;

import com.inknwall.backend.entity.Poster;
import com.inknwall.backend.service.PosterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posters")
@RequiredArgsConstructor
@CrossOrigin

public class PosterController {

    private final PosterService posterService;

    @PostMapping("/upload")
    public Poster uploadPoster(
            @RequestParam String name,
            @RequestParam String category,
            @RequestParam Double price,
            @RequestParam MultipartFile file,
            @RequestParam boolean isPremium
    ) {
        return posterService.uploadPoster(name, category, price, file, isPremium);
    }
    @GetMapping
    public List<Poster> getAllPosters() {
        return posterService.getAllPosters();
    }
    @DeleteMapping("/{id}")
    public void deletePoster(@PathVariable Long id) {
        posterService.deletePoster(id);
    }
}