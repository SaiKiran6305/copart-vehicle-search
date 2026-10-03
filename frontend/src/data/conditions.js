// Primary damage and condition values, matching Copart's terms.
// Primary damage = the main damage on the vehicle. Condition = whether Copart verified it runs.

// Severity of each primary damage, used to colour-code the card badge.
// "good" = wear only, "caution" = cosmetic or collision damage, "severe" = flood or mechanical.
export const damageTone = {
  "Normal Wear": "good",
  "Minor Dent/Scratches": "caution",
  Hail: "caution",
  Vandalism: "caution",
  "Front End": "caution",
  "Rear End": "caution",
  Side: "caution",
  Mechanical: "severe",
  "Water/Flood": "severe",
};

export const primaryDamages = Object.keys(damageTone);

export const conditions = [
  { value: "Run and Drive", description: "Started, went into gear, and moved under its own power" },
  { value: "Engine Start Program", description: "Engine started and ran at idle" },
  { value: "Enhanced Vehicles", description: "Seller paid for an enhancement service" },
  { value: "Stationary", description: "Not verified to start" },
];

export function getDamageTone(primaryDamage) {
  return damageTone[primaryDamage] ?? "caution";
}

export function isKnownCondition(condition) {
  return conditions.some((item) => item.value === condition);
}
