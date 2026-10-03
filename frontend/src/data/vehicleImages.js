// One illustrative photo per body style. File names describe what each picture shows.
const images = {
  blueSedan: "/vehicles/blue-sedan.webp",
  blackSedan: "/vehicles/black-sedan.webp",
  hatchback: "/vehicles/red-hatchback.webp",
  compactSuv: "/vehicles/silver-suv.webp",
  crossover: "/vehicles/blue-crossover.webp",
  midsizeSuv: "/vehicles/green-suv.webp",
  electricCrossover: "/vehicles/white-electric-crossover.webp",
  pickup: "/vehicles/white-pickup.webp",
  coupe: "/vehicles/orange-coupe.webp",
};

// Keyed by model, not make: one make sells sedans, SUVs and trucks.
export const imageByModel = {
  // Sedans
  Camry: images.blueSedan,
  Altima: images.blueSedan,
  Elantra: images.blueSedan,
  Forte: images.blueSedan,
  "Model 3": images.blueSedan,
  Accord: images.blackSedan,
  Malibu: images.blackSedan,
  Sentra: images.blackSedan,
  "3 Series": images.blackSedan,
  "5 Series": images.blackSedan,
  "Model S": images.blackSedan,
  // Hatchbacks
  Corolla: images.hatchback,
  Civic: images.hatchback,
  // Compact SUVs and crossovers
  RAV4: images.compactSuv,
  Escape: images.compactSuv,
  Tucson: images.compactSuv,
  Sportage: images.compactSuv,
  "CR-V": images.crossover,
  Equinox: images.crossover,
  Rogue: images.crossover,
  Compass: images.crossover,
  X3: images.crossover,
  // Mid-size SUVs
  "Santa Fe": images.midsizeSuv,
  Sorento: images.midsizeSuv,
  Cherokee: images.midsizeSuv,
  Wrangler: images.midsizeSuv,
  // Electric crossover
  "Model Y": images.electricCrossover,
  // Pickups
  "F-150": images.pickup,
  Silverado: images.pickup,
  // Coupes
  Mustang: images.coupe,
};

export const defaultVehicleImage = images.blackSedan;

export function getVehicleImage(vehicle) {
  return imageByModel[vehicle?.model] ?? defaultVehicleImage;
}
