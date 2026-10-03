package com.copart.vehiclesearch.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
// Make, model, damage and condition are compared in lower case (lower(make) = ?), which a plain
// index can't serve, so only the year range has an index.
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_year", columnList = "model_year")
})
@Check(constraints = "model_year BETWEEN 1886 AND 2100 AND odometer >= 0 AND estimated_value >= 0")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    @Column(nullable = false, unique = true, length = 20)
    private String lotNumber;

    @NotNull
    @Min(1886)
    @Max(2100)
    @Column(name = "model_year", nullable = false)
    private Integer year;

    @NotBlank
    @Size(max = 40)
    @Column(nullable = false, length = 40)
    private String make;

    @NotBlank
    @Size(max = 60)
    @Column(nullable = false, length = 60)
    private String model;

    /** Main damage category, e.g. "Front End" or "Water/Flood". */
    @NotBlank
    @Size(max = 40)
    // Nullable at the database level so an existing local database can gain the column;
    // the seed loader then replaces those rows with complete data.
    @Column(name = "primary_damage", length = 40)
    private String primaryDamage;

    /** Copart-style lot condition, e.g. "Run and Drive" or "Stationary". */
    @NotBlank
    @Size(max = 40)
    @Column(nullable = false, length = 40)
    private String condition;

    @NotBlank
    @Size(max = 80)
    @Column(nullable = false, length = 80)
    private String location;

    @NotNull
    @Column(nullable = false)
    private LocalDate saleDate;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer odometer;

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedValue;

    protected Vehicle() {
    }

    public Vehicle(String lotNumber, Integer year, String make, String model, String primaryDamage,
                   String condition, String location, LocalDate saleDate,
                   Integer odometer, BigDecimal estimatedValue) {
        this.lotNumber = lotNumber;
        this.year = year;
        this.make = make;
        this.model = model;
        this.primaryDamage = primaryDamage;
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
    public String getPrimaryDamage() { return primaryDamage; }
    public String getCondition() { return condition; }
    public String getLocation() { return location; }
    public LocalDate getSaleDate() { return saleDate; }
    public Integer getOdometer() { return odometer; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
}
