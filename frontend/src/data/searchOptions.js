// Choices offered in the search form. Also used to validate values read from the URL.

// Auction values are mostly under $20,000, so the low end gets finer steps.
export const priceRanges = [
  { value: "0-5000", label: "Under $5,000" },
  { value: "5000-10000", label: "$5,000–$10,000" },
  { value: "10000-15000", label: "$10,000–$15,000" },
  { value: "15000-20000", label: "$15,000–$20,000" },
  { value: "20000-30000", label: "$20,000–$30,000" },
  { value: "30000-", label: "$30,000+" },
];

export const sortOptions = [
  { value: "saleDate:asc", label: "Sale date: Earliest first" },
  { value: "saleDate:desc", label: "Sale date: Latest first" },
  { value: "year:desc", label: "Year: Newest first" },
  { value: "year:asc", label: "Year: Oldest first" },
  { value: "estimatedValue:asc", label: "Value: Low to high" },
  { value: "estimatedValue:desc", label: "Value: High to low" },
  { value: "odometer:asc", label: "Odometer: Low to high" },
  { value: "odometer:desc", label: "Odometer: High to low" },
  { value: "make:asc", label: "Make: A to Z" },
  { value: "make:desc", label: "Make: Z to A" },
];

export const pageSizes = [12, 24, 48, 96];

// One-click searches shown under the search box. Each starts a new search with only these filters.
// Locations are stored as "Dallas, TX", so Texas searches for "TX".
export const quickSearches = [
  { label: "Under $5,000", filters: { priceRange: "0-5000" } },
  { label: "Tesla", filters: { make: "Tesla" } },
  { label: "2025 or newer", filters: { minYear: "2025" } },
  { label: "Texas", filters: { q: "TX" } },
];

// "up-to-20000" comes from AI search; the rest are the ranges above ("30000-" has no upper bound).
export function getPriceBounds(priceRange) {
  if (!priceRange) return {};
  if (priceRange.startsWith("up-to-")) return { maxPriceInclusive: Number(priceRange.slice(6)) };
  const [minPrice, maxPrice] = priceRange.split("-").map((part) => (part === "" ? undefined : Number(part)));
  return { minPrice, maxPrice };
}

export function priceRangeLabel(priceRange) {
  if (priceRange.startsWith("up-to-")) return `Up to $${Number(priceRange.slice(6)).toLocaleString("en-US")}`;
  return priceRanges.find((range) => range.value === priceRange)?.label ?? priceRange;
}

export function isKnownPriceRange(priceRange) {
  return priceRanges.some((range) => range.value === priceRange) || /^up-to-\d+$/.test(priceRange);
}
