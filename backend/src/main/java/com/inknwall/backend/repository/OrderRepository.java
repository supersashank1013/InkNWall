package com.inknwall.backend.repository;

import com.inknwall.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserEmail(String email);
//    List<Order> findByCreatedAtAfter(LocalDateTime dateTime);
}
