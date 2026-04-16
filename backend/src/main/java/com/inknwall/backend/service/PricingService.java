//package com.inknwall.backend.service;
//
//import org.springframework.stereotype.Service;
//import com.inknwall.backend.entity.OrderItem;
//
//import java.util.List;
//
//@Service
//public class PricingService {
//
//    public double calculateTotal(List<OrderItem> items) {
//
//        int standardCount = 0;
//        double premiumTotal = 0;
//
//        for (OrderItem item : items) {
//            if (item.isPremium()) {
//                premiumTotal += item.getPrice() * item.getQuantity();
//            } else {
//                standardCount += item.getQuantity();
//            }
//        }
//
//        // 🎯 BUY 4 GET 1 FREE
//        int freeItems = standardCount / 5;
//        int payableStandard = standardCount - freeItems;
//
//        // 🎯 COMBO 3 FOR 349
//        int comboSets = payableStandard / 3;
//        int remaining = payableStandard % 3;
//
//        double total =
//                comboSets * 349 +
//                        remaining * 119 +
//                        premiumTotal;
//
//        return total;
//    }
//
//}
