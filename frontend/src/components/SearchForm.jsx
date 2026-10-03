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
      <div className="search-panel__top-row">
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
        <div className="search-actions">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            <span aria-hidden="true">⌕</span>
            {isLoading ? "Searching…" : "Search vehicles"}
          </button>
          <button className="button button--text" type="button" onClick={onClear}>
            Clear filters
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onChange={onChange} />

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
