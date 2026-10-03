// How serious each auction condition is, so the card can colour-code it.
// "good" = drivable/normal, "caution" = cosmetic or collision damage, "severe" = flood or mechanical.
export const conditionTone = {
  "Run & Drive": "good",
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

export function getConditionTone(condition) {
  return conditionTone[condition] ?? "caution";
}
