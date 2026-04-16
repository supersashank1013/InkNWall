package com.inknwall.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;  // Username

    @Column(nullable = false)
    private String password;

    private String name;

    private LocalDateTime createdAt;

    public Admin(Long id, String email, String password) {
        this.id = id;
        this.email = email;
        this.password = password;
    }

}