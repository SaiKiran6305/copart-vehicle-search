import { describe, expect, it } from "vitest";
import seedVehicles from "../../../backend/src/main/resources/vehicles.json";
import { modelsByMake } from "../components/FilterPanel.jsx";
import { defaultVehicleImage, getVehicleImage, imageByModel } from "./vehicleImages.js";
import { conditionTone, getConditionTone } from "./conditions.js";

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

  it("assigns a severity tone to every condition in the seed data", () => {
    const missing = [...new Set(seedVehicles.map((vehicle) => vehicle.condition))]
      .filter((condition) => !(condition in conditionTone));
    expect(missing).toEqual([]);
    expect(getConditionTone("Run & Drive")).toBe("good");
    expect(getConditionTone("Water/Flood")).toBe("severe");
    expect(getConditionTone("Hail")).toBe("caution");
  });
});
