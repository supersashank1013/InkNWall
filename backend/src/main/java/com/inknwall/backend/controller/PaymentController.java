package com.inknwall.backend.controller;

import com.inknwall.backend.service.PaymentService;
import com.razorpay.Order;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestParam BigDecimal amount) throws Exception {
        Order order = paymentService.createOrder(amount);
        Map<String, Object> response = new HashMap<>();
        response.put("id", order.get("id").toString());
        response.put("amount", order.get("amount"));
        response.put("currency", order.get("currency"));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyPayment(@RequestBody Map<String, String> data) throws Exception {
        String orderId = data.get("razorpay_order_id");
        String paymentId = data.get("razorpay_payment_id");
        String signature = data.get("razorpay_signature");

        if (orderId == null || paymentId == null || signature == null) {
            return ResponseEntity.badRequest().body("Missing payment fields");
        }

        if (paymentService.verifyPayment(orderId, paymentId, signature)) {
            return ResponseEntity.ok("Payment verified");
        }

        return ResponseEntity.status(400).body("Invalid payment");
    }
}
