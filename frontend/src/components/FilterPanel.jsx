import { priceRangeLabel, priceRanges } from "../data/searchOptions.js";
import { conditions, primaryDamages } from "../data/conditions.js";

export const modelsByMake = {
  BMW: ["3 Series", "5 Series", "X3"],
  Chevrolet: ["Equinox", "Malibu", "Silverado"],
  Ford: ["Escape", "F-150", "Mustang"],
  Honda: ["Accord", "CR-V", "Civic"],
  Hyundai: ["Elantra", "Santa Fe", "Tucson"],
  Jeep: ["Cherokee", "Compass", "Wrangler"],
  Kia: ["Forte", "Sorento", "Sportage"],
  Nissan: ["Altima", "Rogue", "Sentra"],
  Tesla: ["Model 3", "Model S", "Model Y"],
  Toyota: ["Camry", "Corolla", "RAV4"],
};

export default function FilterPanel({ filters, onChange }) {
  return (
    <div className="filter-grid" id="search-filters">
      <label className="form-control" htmlFor="make">
        <span>Make</span>
        <select
          id="make"
          name="make"
          value={filters.make}
          onChange={onChange}
        >
          <option value="">Any make</option>
          {Object.keys(modelsByMake).map((make) => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </label>

      <label className="form-control" htmlFor="model">
        <span>Model</span>
        <select
          id="model"
          name="model"
          value={filters.model}
          onChange={onChange}
          disabled={!filters.make}
        >
          <option value="">{filters.make ? "Any model" : "Choose a make first"}</option>
          {(modelsByMake[filters.make] || []).map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </label>

      <label className="form-control" htmlFor="primaryDamage">
        <span>Primary damage</span>
        <select id="primaryDamage" name="primaryDamage" value={filters.primaryDamage} onChange={onChange}>
          <option value="">Any damage</option>
          {primaryDamages.map((damage) => (
            <option key={damage} value={damage}>{damage}</option>
          ))}
        </select>
      </label>

      <label className="form-control" htmlFor="condition">
        <span>Condition</span>
        <select id="condition" name="condition" value={filters.condition} onChange={onChange}>
          <option value="">Any condition</option>
          {conditions.map((condition) => (
            <option key={condition.value} value={condition.value} title={condition.description}>
              {condition.value}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control" htmlFor="priceRange">
        <span>Estimated value</span>
        <select id="priceRange" name="priceRange" value={filters.priceRange} onChange={onChange}>
          <option value="">Any value</option>
          {priceRanges.map((range) => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
          {filters.priceRange.startsWith("up-to-") && (
            <option value={filters.priceRange}>{priceRangeLabel(filters.priceRange)}</option>
          )}
        </select>
      </label>

      <fieldset className="year-filter">
        <legend>Year range</legend>
        <label className="sr-only" htmlFor="minYear">
          Minimum year
        </label>
        <input
          id="minYear"
          name="minYear"
          type="number"
          min="1886"
          max="2100"
          placeholder="From"
          value={filters.minYear}
          onChange={onChange}
        />
        <span aria-hidden="true">—</span>
        <label className="sr-only" htmlFor="maxYear">
          Maximum year
        </label>
        <input
          id="maxYear"
          name="maxYear"
          type="number"
          min="1886"
          max="2100"
          placeholder="To"
          value={filters.maxYear}
          onChange={onChange}
        />
      </fieldset>

    </div>
  );
}
