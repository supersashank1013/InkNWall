package com.inknwall.backend.repository;

import com.inknwall.backend.entity.Poster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PosterRepository extends JpaRepository<Poster, Long> {
}