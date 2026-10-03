const modelsByMake = {
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
    <div className="filter-grid">
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

      <label className="form-control" htmlFor="condition">
        <span>Condition</span>
        <select id="condition" name="condition" value={filters.condition} onChange={onChange}>
          <option value="">Any condition</option>
          <option value="Run & Drive">Run &amp; Drive</option>
          <option value="Normal Wear">Normal Wear</option>
          <option value="Front End">Front End</option>
          <option value="Rear End">Rear End</option>
          <option value="Side">Side</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Hail">Hail</option>
          <option value="Water/Flood">Water/Flood</option>
          <option value="Vandalism">Vandalism</option>
          <option value="Minor Dent/Scratches">Minor Dent/Scratches</option>
        </select>
      </label>

      <label className="form-control" htmlFor="priceRange">
        <span>Estimated value</span>
        <select id="priceRange" name="priceRange" value={filters.priceRange} onChange={onChange}>
          <option value="">Any value</option>
          <option value="0-10000">$0–$10,000</option>
          <option value="10000-20000">$10,000–$20,000</option>
          <option value="20000-30000">$20,000–$30,000</option>
          <option value="30000-40000">$30,000–$40,000</option>
          <option value="40000-50000">$40,000–$50,000</option>
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
