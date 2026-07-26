package com.inknwall.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    @PostMapping("/razorpay")
    public ResponseEntity<String> receiveWebhook(

            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
            System.out.println("========== RAZORPAY WEBHOOK ==========");
            System.out.println("Signature: " + signature);
            System.out.println("Payload:");
            System.out.println(payload);
            System.out.println("======================================");
            return ResponseEntity.ok("OK");
    }
}

