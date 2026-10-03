// Search state shared by the app: defaults, turning form values into API criteria,
// and reading/writing the current search in the page URL.
import { modelsByMake } from "../components/FilterPanel.jsx";
import { conditionTone } from "./conditions.js";
import { getPriceBounds, isKnownPriceRange, pageSizes, sortOptions } from "./searchOptions.js";

export const initialFilters = {
  q: "",
  make: "",
  model: "",
  condition: "",
  minYear: "",
  maxYear: "",
  priceRange: "",
  sortBy: "saleDate",
  direction: "asc",
  size: "12",
};

export const initialCriteria = {
  ...initialFilters,
  page: 0,
  size: 12,
};

export function validateYearRange(minYear, maxYear) {
  if (minYear && maxYear && Number(minYear) > Number(maxYear)) {
    return "Minimum year must be less than or equal to maximum year.";
  }
  for (const year of [minYear, maxYear]) {
    if (year && (!Number.isInteger(Number(year)) || Number(year) < 1886 || Number(year) > 2100)) {
      return "Enter a year between 1886 and 2100.";
    }
  }
  return "";
}

// Form values -> the criteria sent to /api/vehicles. Assumes the year range is valid.
export function toCriteria(formFilters, page = 0) {
  const minYear = formFilters.minYear.trim();
  const maxYear = formFilters.maxYear.trim();
  return {
    ...formFilters,
    minYear: minYear || undefined,
    maxYear: maxYear || undefined,
    minPrice: undefined,
    maxPrice: undefined,
    maxPriceInclusive: undefined,
    ...getPriceBounds(formFilters.priceRange),
    page,
    size: Number(formFilters.size),
  };
}

// URL query string -> form values and criteria. Unknown or invalid values fall back to the defaults.
export function readSearchFromUrl(search) {
  const params = new URLSearchParams(search);
  if ([...params.keys()].length === 0) {
    return { filters: initialFilters, criteria: initialCriteria };
  }

  const get = (key) => (params.get(key) ?? "").trim();
  const filters = { ...initialFilters, q: get("q").slice(0, 100) };

  if (Object.hasOwn(modelsByMake, get("make"))) {
    filters.make = get("make");
    if (modelsByMake[filters.make].includes(get("model"))) filters.model = get("model");
  }
  if (Object.hasOwn(conditionTone, get("condition"))) filters.condition = get("condition");
  if (!validateYearRange(get("minYear"), get("maxYear"))) {
    filters.minYear = get("minYear");
    filters.maxYear = get("maxYear");
  }
  if (isKnownPriceRange(get("price"))) filters.priceRange = get("price");
  if (sortOptions.some((option) => option.value === `${get("sortBy")}:${get("direction")}`)) {
    filters.sortBy = get("sortBy");
    filters.direction = get("direction");
  }
  if (pageSizes.includes(Number(get("size")))) filters.size = get("size");

  const page = Number(get("page"));
  return { filters, criteria: toCriteria(filters, Number.isInteger(page) && page > 1 ? page - 1 : 0) };
}

// Criteria -> URL query string, leaving out defaults. Pages are 1-based in the URL, as shown on screen.
export function searchToQueryString(criteria) {
  const params = new URLSearchParams();
  for (const key of ["q", "make", "model", "condition", "minYear", "maxYear"]) {
    const value = criteria[key] == null ? "" : String(criteria[key]).trim();
    if (value) params.set(key, value);
  }
  if (criteria.priceRange) params.set("price", criteria.priceRange);
  if (criteria.sortBy !== initialFilters.sortBy || criteria.direction !== initialFilters.direction) {
    params.set("sortBy", criteria.sortBy);
    params.set("direction", criteria.direction);
  }
  if (Number(criteria.size) !== Number(initialFilters.size)) params.set("size", String(criteria.size));
  if (criteria.page > 0) params.set("page", String(criteria.page + 1));

  const query = params.toString();
  return query ? `?${query}` : "";
}
