import { describe, expect, it } from "vitest";
import seedVehicles from "../../../backend/src/main/resources/vehicles.json";
import { modelsByMake } from "../components/FilterPanel.jsx";
import { defaultVehicleImage, getVehicleImage, imageByModel } from "./vehicleImages.js";
import { damageTone, getDamageTone, isKnownCondition } from "./conditions.js";
import { getPriceBounds, priceRanges } from "./searchOptions.js";

describe("vehicle catalog consistency", () => {
  it("has a body-style image for every model in the seed data", () => {
    const missing = [...new Set(seedVehicles.map((vehicle) => vehicle.model))]
      .filter((model) => !(model in imageByModel));
    expect(missing).toEqual([]);
  });

  it("has a body-style image for every model offered in the Model filter", () => {
    const missing = Object.values(modelsByMake).flat().filter((model) => !(model in imageByModel));
    expect(missing).toEqual([]);
  });

  it("offers every make and model that exists in the seed data", () => {
    const missing = seedVehicles
      .filter((vehicle) => !(modelsByMake[vehicle.make] || []).includes(vehicle.model))
      .map((vehicle) => `${vehicle.make} ${vehicle.model}`);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("maps models by body style rather than by make", () => {
    expect(getVehicleImage({ make: "Toyota", model: "Camry" })).toContain("sedan");
    expect(getVehicleImage({ make: "Toyota", model: "RAV4" })).toContain("suv");
    expect(getVehicleImage({ make: "Ford", model: "F-150" })).toContain("pickup");
    expect(getVehicleImage({ make: "Ford", model: "Mustang" })).toContain("coupe");
    expect(getVehicleImage({ make: "Unknown", model: "Unknown" })).toBe(defaultVehicleImage);
  });

  it("knows every primary damage and condition in the seed data", () => {
    const unknownDamage = [...new Set(seedVehicles.map((vehicle) => vehicle.primaryDamage))]
      .filter((damage) => !(damage in damageTone));
    const unknownConditions = [...new Set(seedVehicles.map((vehicle) => vehicle.condition))]
      .filter((condition) => !isKnownCondition(condition));
    expect(unknownDamage).toEqual([]);
    expect(unknownConditions).toEqual([]);
    expect(getDamageTone("Normal Wear")).toBe("good");
    expect(getDamageTone("Water/Flood")).toBe("severe");
    expect(getDamageTone("Hail")).toBe("caution");
  });

  it("has seed vehicles in every value range offered", () => {
    for (const range of priceRanges) {
      const { minPrice = 0, maxPrice = Infinity } = getPriceBounds(range.value);
      const matches = seedVehicles.filter((vehicle) =>
        vehicle.estimatedValue >= minPrice && vehicle.estimatedValue < maxPrice);
      expect(matches.length, range.label).toBeGreaterThan(0);
    }
  });
});
