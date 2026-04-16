package com.inknwall.backend.controller;

import com.inknwall.backend.entity.Order;
import com.inknwall.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.inknwall.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final JwtUtil jwtUtil;

    @GetMapping("/my")
    public List<Order> getMyOrders(
            @RequestHeader("Authorization") String token
    ) {
        String jwt = token.substring(7);
        String email = jwtUtil.extractEmail(jwt);

        return orderService.getOrdersByEmail(email);
    }
    @PostMapping
    public Order create(
            @RequestBody Order order,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        return orderService.createOrder(order, token);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Order.Status status,
            @RequestBody(required = false) Map<String, String> body
    ) {
        Order.Status resolvedStatus = status;

        if (resolvedStatus == null && body != null && body.get("status") != null) {
            resolvedStatus = Order.Status.valueOf(body.get("status"));
        }

        if (resolvedStatus == null) {
            throw new RuntimeException("Status is required");
        }

        return orderService.updateStatus(id, resolvedStatus);
    }

    @GetMapping("/recent")
    public List<Order> getRecentOrders() {
        return orderService.getRecentOrders();
    }

    @GetMapping("/export")
    public void exportCSV(HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=orders.csv");

        List<Order> orders = orderService.getAllOrders();

        PrintWriter writer = response.getWriter();

        // Header
        writer.println("OrderID,Name,Roll,Total,Status,Date");

        for (Order order : orders) {
            writer.println(
                    order.getId() + "," +
                            order.getName() + "," +
                            order.getRoll() + "," +
                            order.getTotal() + "," +
                            order.getStatus() + "," +
                            order.getCreatedAt()
            );
        }

        writer.flush();
        writer.close();
    }

}
