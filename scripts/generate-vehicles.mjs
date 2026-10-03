// Generates backend/src/main/resources/vehicles.json: 1,000 synthetic auction lots.
// Deterministic (fixed seed), so re-running it produces the same file.
// Usage: node scripts/generate-vehicles.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SEED = 20261003;
// 100 lots per make (1,000 in total), split as evenly as possible across its three models.
const LOTS_PER_MAKE = 100;
const REFERENCE_YEAR = 2026;
const FIRST_SALE_DATE = "2026-10-07";
const SALE_WEEKS = 10;

// Approximate new price in USD for each model.
const MODELS = {
  BMW: { "3 Series": 46000, "5 Series": 60000, X3: 50000 },
  Chevrolet: { Equinox: 29000, Malibu: 26000, Silverado: 47000 },
  Ford: { Escape: 30000, "F-150": 48000, Mustang: 36000 },
  Honda: { Accord: 30000, "CR-V": 33000, Civic: 25000 },
  Hyundai: { Elantra: 22000, "Santa Fe": 35000, Tucson: 30000 },
  Jeep: { Cherokee: 34000, Compass: 29000, Wrangler: 40000 },
  Kia: { Forte: 21000, Sorento: 34000, Sportage: 29000 },
  Nissan: { Altima: 28000, Rogue: 30000, Sentra: 21000 },
  Tesla: { "Model 3": 42000, "Model S": 82000, "Model Y": 46000 },
  Toyota: { Camry: 29000, Corolla: 23000, RAV4: 32000 },
};

// Primary damage (Copart's main damage category) -> [relative frequency, share of value kept].
const PRIMARY_DAMAGE = {
  "Front End": [22, 0.66],
  "Rear End": [14, 0.72],
  Side: [11, 0.72],
  "Minor Dent/Scratches": [12, 0.9],
  "Normal Wear": [12, 0.96],
  Hail: [8, 0.82],
  Vandalism: [6, 0.8],
  Mechanical: [8, 0.6],
  "Water/Flood": [7, 0.45],
};

// Condition (Copart lot highlight) -> share of value kept.
const CONDITION_VALUE = {
  "Run and Drive": 1,
  "Enhanced Vehicles": 1.05,
  "Engine Start Program": 0.9,
  Stationary: 0.8,
};

// How likely each condition is for a given damage: flood and mechanical damage rarely run and drive.
const CONDITION_ODDS = {
  default: { "Run and Drive": 55, "Engine Start Program": 20, "Enhanced Vehicles": 8, Stationary: 17 },
  "Front End": { "Run and Drive": 35, "Engine Start Program": 25, "Enhanced Vehicles": 5, Stationary: 35 },
  Side: { "Run and Drive": 40, "Engine Start Program": 25, "Enhanced Vehicles": 5, Stationary: 30 },
  Mechanical: { "Run and Drive": 5, "Engine Start Program": 25, "Enhanced Vehicles": 2, Stationary: 68 },
  "Water/Flood": { "Run and Drive": 8, "Engine Start Program": 15, "Enhanced Vehicles": 2, Stationary: 75 },
};

const LOCATIONS = [
  "Dallas, TX", "Houston, TX", "Atlanta, GA", "Phoenix, AZ", "Chicago, IL",
  "Denver, CO", "Orlando, FL", "Jacksonville, FL", "Seattle, WA", "Los Angeles, CA",
  "Las Vegas, NV", "Nashville, TN", "Miami, FL", "Detroit, MI", "Columbus, OH",
];

// Small seeded PRNG (mulberry32).
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(SEED);
const between = (min, max) => min + random() * (max - min);
const integerBetween = (min, max) => Math.floor(between(min, max + 1));
const pick = (items) => items[Math.floor(random() * items.length)];

// weights: { name: weight } or { name: [weight, ...] }
function pickWeighted(weights) {
  const entries = Object.entries(weights).map(([name, value]) => [name, Array.isArray(value) ? value[0] : value]);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [name, weight] of entries) {
    roll -= weight;
    if (roll < 0) return name;
  }
  return entries.at(-1)[0];
}

function saleDates() {
  const dates = [];
  const day = new Date(`${FIRST_SALE_DATE}T00:00:00Z`);
  for (let i = 0; i < SALE_WEEKS * 7; i += 1) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}

const dates = saleDates();
const vehicles = [];

for (const [make, models] of Object.entries(MODELS)) {
  const modelCount = Object.keys(models).length;
  for (const [modelIndex, [model, newPrice]] of Object.entries(models).entries()) {
    const lots = Math.floor(LOTS_PER_MAKE / modelCount) + (modelIndex < LOTS_PER_MAKE % modelCount ? 1 : 0);
    for (let i = 0; i < lots; i += 1) {
      const year = integerBetween(2016, 2025);
      const age = Math.max(1, REFERENCE_YEAR - year);
      const odometer = Math.max(800, Math.round(age * between(8000, 15000) + between(-3000, 3000)));
      const primaryDamage = pickWeighted(PRIMARY_DAMAGE);
      const condition = pickWeighted(CONDITION_ODDS[primaryDamage] ?? CONDITION_ODDS.default);
      const depreciated = newPrice * 0.9 ** age;
      const mileageFactor = 1 - Math.min(0.25, odometer / 600000);
      const value = depreciated * mileageFactor * PRIMARY_DAMAGE[primaryDamage][1]
        * CONDITION_VALUE[condition] * between(0.92, 1.08);
      vehicles.push({
        year,
        make,
        model,
        primaryDamage,
        condition,
        location: pick(LOCATIONS),
        saleDate: pick(dates),
        odometer,
        estimatedValue: Math.max(800, Math.round(value / 50) * 50),
        order: random(),
      });
    }
  }
}

// Lot numbers follow the auction calendar, like a real sale schedule.
vehicles.sort((a, b) => a.saleDate.localeCompare(b.saleDate) || a.order - b.order);
const output = vehicles.map(({ order, ...vehicle }, index) => ({
  lotNumber: `LOT-${1001 + index}`,
  ...vehicle,
}));

const target = fileURLToPath(new URL("../backend/src/main/resources/vehicles.json", import.meta.url));
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.length} vehicles to ${target}`);
