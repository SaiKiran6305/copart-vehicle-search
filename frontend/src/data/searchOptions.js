// Choices offered in the search form. Also used to validate values read from the URL.

export const priceRanges = [
  { value: "0-10000", label: "$0–$10,000" },
  { value: "10000-20000", label: "$10,000–$20,000" },
  { value: "20000-30000", label: "$20,000–$30,000" },
  { value: "30000-40000", label: "$30,000–$40,000" },
  { value: "40000-50000", label: "$40,000–$50,000" },
  { value: "50000-", label: "$50,000+" },
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

// "up-to-20000" comes from AI search; the rest are the ranges above ("50000-" has no upper bound).
export function getPriceBounds(priceRange) {
  if (!priceRange) return {};
  if (priceRange.startsWith("up-to-")) return { maxPriceInclusive: Number(priceRange.slice(6)) };
  const [minPrice, maxPrice] = priceRange.split("-").map((part) => (part === "" ? undefined : Number(part)));
  return { minPrice, maxPrice };
}

export function isKnownPriceRange(priceRange) {
  return priceRanges.some((range) => range.value === priceRange) || /^up-to-\d+$/.test(priceRange);
}
