package com.inknwall.backend.repository;

import com.inknwall.backend.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;


public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

}