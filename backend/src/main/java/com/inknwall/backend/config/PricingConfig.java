package com.inknwall.backend.config;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class PricingConfig {

    @Id
    @GeneratedValue
    private Long id;

    private double standardPrice;
    private double premiumPrice;

    private int comboSize; // 3
    private double comboPrice; // 349

    private int buyX; // 4
    private int getY; // 1
}
