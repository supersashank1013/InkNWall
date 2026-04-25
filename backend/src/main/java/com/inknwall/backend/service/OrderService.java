package com.inknwall.backend.service;

import com.inknwall.backend.entity.Order;
import com.inknwall.backend.entity.Poster;
import com.inknwall.backend.entity.User;
import com.inknwall.backend.repository.OrderRepository;
import com.inknwall.backend.repository.PosterRepository;
import com.inknwall.backend.repository.UserRepository;
import com.inknwall.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository repo;
    private final PosterRepository posterRepository;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final EmailService emailService;
//    private final PricingService pricingService;

    public List<Order> getOrdersByEmail(String email) {
        return repo.findByUserEmail(email);
    }

    public Order createOrder(Order order, String token) {
        User user = null;

        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);

            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            order.setUser(user);
            order.setName(user.getName());
            order.setRoll(user.getRoll());
        }

        if (order.getItems() != null) {
            order.getItems().forEach(item -> {
                item.setOrder(order);

                Poster poster = posterRepository.findById(item.getPosterId())
                        .orElseThrow(() -> new RuntimeException("Poster not found"));

                item.setName(poster.getName());
                item.setImage(poster.getImageUrl());
                item.setPrice(poster.getPrice());
//                item.setPremium(poster.isPremium());
            });
        }

//        double finalTotal = pricingService.calculateTotal(order.getItems());
//        order.setTotal(finalTotal);

        Order savedOrder = repo.save(order);

        if (user != null) {
            String itemsHtml = buildItemsHtml(savedOrder);
            String html = buildConfirmationHtml(user, savedOrder, itemsHtml);

            emailService.sendEmail(
                    user.getEmail(),
                    "Your InkNWall Order is Confirmed!",
                    html
            );
        }

        return savedOrder;
    }

    public Order updateStatus(Long id, Order.Status status) {
        Order order = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status);
        return repo.save(order);
    }

    public List<Order> getAllOrders() {
        List<Order> orders = repo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        orders.forEach(order -> order.getItems().size());
        return orders;
    }

//    public List<Order> getRecentOrders() {
//        return repo.findByCreatedAtAfter(LocalDateTime.now().minusDays(7));
//    }

    private String buildItemsHtml(Order order) {
        if (order.getItems() == null) {
            return "";
        }

        StringBuilder itemsHtml = new StringBuilder();
        for (var item : order.getItems()) {
            itemsHtml.append("""
                <tr>
                    <td style="padding:8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="%s" style="width:50px; height:70px; object-fit:cover; border-radius:6px;" />
                            <span>%s</span>
                        </div>
                    </td>
                    <td style="padding:8px;" align="center">%d</td>
                    <td style="padding:8px;" align="right">Rs.%s</td>
                </tr>
                """.formatted(
                    item.getImage(),
                    item.getName(),
                    item.getQuantity(),
                    item.getPrice()
            ));
        }

        return itemsHtml.toString();
    }

    private String buildConfirmationHtml(User user, Order order, String itemsHtml) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0; padding:0; background:#0f0f0f; font-family: Arial, sans-serif;">
            <div style="max-width:600px; margin:20px auto; background:#1a1a1a; border-radius:10px; overflow:hidden;">
                <div style="background:#ff6a00; padding:15px; text-align:center; color:white; font-size:20px; font-weight:bold;">
                    InkNWall
                </div>
                <div style="padding:20px; color:white;">
                    <p>Hello %s,</p>
                    <p style="color:#00ff9c; font-weight:bold;">Your order is confirmed.</p>
                    <table width="100%%" style="border-collapse: collapse; margin-top:15px;">
                        <tr style="border-bottom:1px solid #333; color:#ff6a00;">
                            <th align="left">Poster</th>
                            <th align="center">Qty</th>
                            <th align="right">Price</th>
                        </tr>
                        %s
                    </table>
                    <p style="margin-top:15px; font-size:16px;"><b>Total: Rs.%s</b></p>
                    <p><b>Delivery Address:</b><br/>%s</p>
                    <div style="text-align:center; margin-top:25px;">
                        <a href="/profile"
                           style="background:#00ff9c; color:black; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
                           Track Your Order
                        </a>
                    </div>
                    <p style="margin-top:30px; font-size:13px; color:#aaa;">
                        Thanks,<br/>
                        InkNWall
                    </p>
                </div>
            </div>
            </body>
            </html>
            """.formatted(
                user.getName(),
                itemsHtml,
                order.getTotal(),
                user.getHostel() + ", Phone: " + user.getPhone()
        );
    }
    public List<Order> getRecentOrders() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        return repo.findAll().stream()
                .filter(order -> order.getCreatedAt().isAfter(sevenDaysAgo))
                .toList();
    }
}
