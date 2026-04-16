package com.inknwall.backend.repository;

import com.inknwall.backend.entity.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
}