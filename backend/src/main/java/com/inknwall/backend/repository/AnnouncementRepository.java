package com.inknwall.backend.repository;

import com.inknwall.backend.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByPosterId(Long posterId);

}