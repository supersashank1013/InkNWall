package com.inknwall.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "admin_log")
@NoArgsConstructor
@AllArgsConstructor
public class AdminLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String adminEmail;
    private String action; //Login
    private String details; // Poster Name etc..
    private LocalDateTime timestamp;
}