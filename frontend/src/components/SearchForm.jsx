import FilterPanel from "./FilterPanel.jsx";

export default function SearchForm({
  filters,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
}) {
  return (
    <form className="search-panel" onSubmit={onSubmit} noValidate>
      <div className="search-panel__heading">
        <div>
          <p className="eyebrow">Find your next vehicle</p>
          <h2>Search inventory</h2>
        </div>
      </div>

      <label className="search-field" htmlFor="query">
        <span className="sr-only">Search by vehicle, lot, or location</span>
        <span className="search-field__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="query"
          name="q"
          type="search"
          placeholder="Search make, model, lot number, or location"
          value={filters.q}
          onChange={onChange}
        />
      </label>

      <FilterPanel filters={filters} onChange={onChange} />

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}

      <div className="search-actions">
        <button className="button button--primary" type="submit" disabled={isLoading}>
          <span aria-hidden="true">⌕</span>
          {isLoading ? "Searching…" : "Search vehicles"}
        </button>
        <button className="button button--secondary" type="button" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </form>
  );
}
