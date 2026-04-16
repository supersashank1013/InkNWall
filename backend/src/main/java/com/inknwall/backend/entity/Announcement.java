package com.inknwall.backend.entity;

import jakarta.persistence.*;
import com.inknwall.backend.entity.Poster;
import lombok.*;

import java.time.LocalDateTime;


@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String message;

    @ManyToOne
    @JoinColumn(name = "poster_id")
    private Poster poster; // can be null (optional)

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Setter
    private String imageUrl;

    // ✅ GETTERS & SETTERS

}