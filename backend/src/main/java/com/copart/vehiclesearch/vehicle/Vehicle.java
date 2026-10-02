package com.copart.vehiclesearch.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_make_model", columnList = "make, model"),
        @Index(name = "idx_vehicle_year", columnList = "year"),
        @Index(name = "idx_vehicle_condition", columnList = "condition")
})
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String lotNumber;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(nullable = false, length = 40)
    private String make;

    @Column(nullable = false, length = 60)
    private String model;

    @Column(nullable = false, length = 40)
    private String condition;

    @Column(nullable = false, length = 80)
    private String location;

    @Column(nullable = false)
    private LocalDate saleDate;

    @Column(nullable = false)
    private Integer odometer;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedValue;

    protected Vehicle() {
    }

    public Vehicle(String lotNumber, Integer year, String make, String model,
                   String condition, String location, LocalDate saleDate,
                   Integer odometer, BigDecimal estimatedValue) {
        this.lotNumber = lotNumber;
        this.year = year;
        this.make = make;
        this.model = model;
        this.condition = condition;
        this.location = location;
        this.saleDate = saleDate;
        this.odometer = odometer;
        this.estimatedValue = estimatedValue;
    }

    public Long getId() { return id; }
    public String getLotNumber() { return lotNumber; }
    public Integer getYear() { return year; }
    public String getMake() { return make; }
    public String getModel() { return model; }
    public String getCondition() { return condition; }
    public String getLocation() { return location; }
    public LocalDate getSaleDate() { return saleDate; }
    public Integer getOdometer() { return odometer; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
}
