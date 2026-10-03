import { useEffect, useState } from "react";
import { searchVehicles } from "../api/vehicles.js";
import { priceRangeLabel } from "../data/searchOptions.js";

// When a search finds only a few vehicles, check how many each active filter is costing
// and offer to remove the ones that would open up the most results.
const SUGGEST_WHEN_AT_MOST = 3;
const MAX_SUGGESTIONS = 3;

function activeFilters(criteria) {
  const filters = [];
  if (criteria.q?.trim()) filters.push({ fields: ["q"], label: `“${criteria.q.trim()}”` });
  if (criteria.model) filters.push({ fields: ["model"], label: criteria.model });
  if (criteria.make) filters.push({ fields: ["make", "model"], label: criteria.make });
  if (criteria.primaryDamage) filters.push({ fields: ["primaryDamage"], label: `${criteria.primaryDamage} damage` });
  if (criteria.condition) filters.push({ fields: ["condition"], label: criteria.condition });
  if (criteria.priceRange) filters.push({ fields: ["priceRange"], label: priceRangeLabel(criteria.priceRange) });
  if (criteria.minYear || criteria.maxYear) {
    const years = criteria.minYear && criteria.maxYear
      ? `${criteria.minYear}–${criteria.maxYear}`
      : criteria.minYear ? `${criteria.minYear} or newer` : `${criteria.maxYear} or older`;
    filters.push({ fields: ["minYear", "maxYear"], label: years });
  }
  return filters;
}

function withoutFields(criteria, fields) {
  const relaxed = { ...criteria, page: 0, size: 1 };
  for (const field of fields) relaxed[field] = undefined;
  if (fields.includes("priceRange")) {
    relaxed.minPrice = undefined;
    relaxed.maxPrice = undefined;
    relaxed.maxPriceInclusive = undefined;
  }
  return relaxed;
}

export default function FilterSuggestions({ criteria, total, onRemoveFilter }) {
  const [suggestions, setSuggestions] = useState([]);
  const filters = total <= SUGGEST_WHEN_AT_MOST ? activeFilters(criteria) : [];
  const key = JSON.stringify(filters.length ? [criteria, total] : null);

  useEffect(() => {
    setSuggestions([]);
    if (filters.length === 0) return undefined;

    const controller = new AbortController();
    Promise.all(filters.map(async (filter) => {
      const page = await searchVehicles(withoutFields(criteria, filter.fields), controller.signal);
      return { ...filter, count: page.totalElements };
    }))
      .then((results) => setSuggestions(results
        .filter((result) => result.count > total)
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_SUGGESTIONS)))
      .catch(() => {
        // Suggestions are optional; leave them out if a request fails.
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (suggestions.length === 0) return null;

  return (
    <div className="filter-suggestions" aria-live="polite">
      <p>{total === 0 ? "Try removing a filter:" : "Want more options? Try removing a filter:"}</p>
      <ul>
        {suggestions.map((suggestion) => (
          <li key={suggestion.fields.join(",")}>
            <button className="button button--secondary" type="button" onClick={() => onRemoveFilter(suggestion.fields)}>
              Remove {suggestion.label}
              <span className="filter-suggestions__count">
                {suggestion.count.toLocaleString("en-US")} {suggestion.count === 1 ? "vehicle" : "vehicles"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
