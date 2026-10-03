// Illustrative photos, grouped by body style. File names describe what each picture shows.
// The color variants were made from the original photos by recoloring only the paint, and the
// "facing-left" ones are mirrored copies, so neighbouring cards don't all show the same picture.
export const photosByStyle = {
  sedan: [
    "black-sedan", "blue-sedan", "red-sedan", "silver-sedan", "green-sedan", "black-sedan-facing-left",
  ],
  hatchback: ["red-hatchback", "blue-hatchback", "silver-hatchback", "yellow-hatchback"],
  suv: [
    "silver-suv", "blue-crossover", "green-suv", "red-crossover", "gray-crossover",
    "silver-suv-facing-left", "green-suv-facing-left",
  ],
  electricCrossover: ["white-electric-crossover", "white-electric-crossover-facing-left"],
  pickup: ["white-pickup", "white-pickup-facing-left"],
  coupe: ["orange-coupe", "red-coupe", "blue-coupe", "gray-coupe"],
};

// Keyed by model, not make: one make sells sedans, SUVs and trucks.
export const bodyStyleByModel = {
  // Sedans
  Camry: "sedan",
  Altima: "sedan",
  Elantra: "sedan",
  Forte: "sedan",
  "Model 3": "sedan",
  Accord: "sedan",
  Malibu: "sedan",
  Sentra: "sedan",
  "3 Series": "sedan",
  "5 Series": "sedan",
  "Model S": "sedan",
  // Hatchbacks
  Corolla: "hatchback",
  Civic: "hatchback",
  // SUVs and crossovers
  RAV4: "suv",
  Escape: "suv",
  Tucson: "suv",
  Sportage: "suv",
  "CR-V": "suv",
  Equinox: "suv",
  Rogue: "suv",
  Compass: "suv",
  X3: "suv",
  "Santa Fe": "suv",
  Sorento: "suv",
  Cherokee: "suv",
  Wrangler: "suv",
  // Electric crossover
  "Model Y": "electricCrossover",
  // Pickups
  "F-150": "pickup",
  Silverado: "pickup",
  // Coupes
  Mustang: "coupe",
};

const photoUrl = (name) => `/vehicles/${name}.webp`;

export const defaultVehicleImage = photoUrl("black-sedan");

// A vehicle always gets the same photo of its body style, chosen from its lot number.
// Consecutive lot numbers get consecutive photos, so a page of results shows a mix.
export function getVehicleImage(vehicle) {
  const photos = photosByStyle[bodyStyleByModel[vehicle?.model]];
  if (!photos) return defaultVehicleImage;
  let hash = 0;
  for (const character of String(vehicle.lotNumber ?? "")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return photoUrl(photos[hash % photos.length]);
}
