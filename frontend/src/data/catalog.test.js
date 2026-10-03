import { describe, expect, it } from "vitest";
import seedVehicles from "../../../backend/src/main/resources/vehicles.json";
import { modelsByMake } from "../components/FilterPanel.jsx";
import { bodyStyleByModel, defaultVehicleImage, getVehicleImage, photosByStyle } from "./vehicleImages.js";
import { damageTone, getDamageTone, isKnownCondition } from "./conditions.js";
import { getPriceBounds, priceRanges } from "./searchOptions.js";

describe("vehicle catalog consistency", () => {
  it("has a body-style image for every model in the seed data", () => {
    const missing = [...new Set(seedVehicles.map((vehicle) => vehicle.model))]
      .filter((model) => !(model in bodyStyleByModel));
    expect(missing).toEqual([]);
  });

  it("has a body-style image for every model offered in the Model filter", () => {
    const missing = Object.values(modelsByMake).flat().filter((model) => !(model in bodyStyleByModel));
    expect(missing).toEqual([]);
  });

  it("offers every make and model that exists in the seed data", () => {
    const missing = seedVehicles
      .filter((vehicle) => !(modelsByMake[vehicle.make] || []).includes(vehicle.model))
      .map((vehicle) => `${vehicle.make} ${vehicle.model}`);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("maps models by body style rather than by make", () => {
    const photo = (model) => getVehicleImage({ make: "Any", model, lotNumber: "LOT-1001" });
    expect(photo("Camry")).toContain("sedan");
    expect(photo("Corolla")).toContain("hatchback");
    expect(photo("RAV4")).toMatch(/suv|crossover/);
    expect(photo("F-150")).toContain("pickup");
    expect(photo("Mustang")).toContain("coupe");
    expect(getVehicleImage({ make: "Unknown", model: "Unknown" })).toBe(defaultVehicleImage);
  });

  it("gives a vehicle the same photo every time and mixes photos across lots", () => {
    const camry = { make: "Toyota", model: "Camry", lotNumber: "LOT-1234" };
    expect(getVehicleImage(camry)).toBe(getVehicleImage({ ...camry }));

    const sedans = ["LOT-1001", "LOT-1002", "LOT-1003", "LOT-1004", "LOT-1005", "LOT-1006"]
      .map((lotNumber) => getVehicleImage({ make: "Toyota", model: "Camry", lotNumber }));
    expect(new Set(sedans).size).toBe(photosByStyle.sedan.length);
  });

  it("has a file for every photo, and every photo file is used", () => {
    const files = Object.keys(import.meta.glob("../../public/vehicles/*.webp"))
      .map((path) => path.split("/").pop().replace(".webp", ""))
      .sort();
    const listed = Object.values(photosByStyle).flat().sort();
    expect(listed).toEqual(files);
  });

  it("uses every photo for the seed vehicles", () => {
    const used = new Set(seedVehicles.map((vehicle) => getVehicleImage(vehicle)));
    const all = Object.values(photosByStyle).flat().map((name) => `/vehicles/${name}.webp`);
    expect(all.filter((url) => !used.has(url))).toEqual([]);
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
