const sortOptions = [
  ["saleDate", "Sale date"],
  ["year", "Year"],
  ["make", "Make"],
  ["model", "Model"],
  ["estimatedValue", "Estimated value"],
  ["odometer", "Odometer"],
];

export default function FilterPanel({ filters, onChange }) {
  return (
    <div className="filter-grid">
      <label className="form-control" htmlFor="make">
        <span>Make</span>
        <input
          id="make"
          name="make"
          type="text"
          placeholder="Any make"
          value={filters.make}
          onChange={onChange}
        />
      </label>

      <label className="form-control" htmlFor="model">
        <span>Model</span>
        <input
          id="model"
          name="model"
          type="text"
          placeholder="Any model"
          value={filters.model}
          onChange={onChange}
        />
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

      <label className="form-control" htmlFor="sortBy">
        <span>Sort by</span>
        <select id="sortBy" name="sortBy" value={filters.sortBy} onChange={onChange}>
          {sortOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control" htmlFor="direction">
        <span>Direction</span>
        <select
          id="direction"
          name="direction"
          value={filters.direction}
          onChange={onChange}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>

      <label className="form-control form-control--compact" htmlFor="size">
        <span>Per page</span>
        <select id="size" name="size" value={filters.size} onChange={onChange}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </label>
    </div>
  );
}
