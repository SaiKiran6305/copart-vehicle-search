import FilterPanel from "./FilterPanel.jsx";

function Spinner() {
  return <span className="spinner spinner--small" aria-hidden="true" />;
}

export default function SearchForm({
  filters,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  aiQuery, onAiQueryChange, aiQuestion, aiClarification, onAiClarificationChange,
  aiError, isAiLoading, onAiSearch, onAiClarify,
}) {
  return (
    <form className={`search-panel${filtersOpen ? " filters-open" : ""}`} onSubmit={onSubmit} noValidate>
      <div className="ai-search" aria-busy={isAiLoading}>
        <div className="ai-search__intro">
          <span className="ai-search__spark" aria-hidden="true">✦</span>
          <label htmlFor="ai-query">Search with AI</label>
        </div>
        <div className="ai-search__controls">
          <input
            id="ai-query"
            type="text"
            value={aiQuery}
            onChange={onAiQueryChange}
            placeholder="e.g. Toyota under $20,000 near Dallas"
            maxLength={300}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAiSearch();
              }
            }}
          />
          <button className="button button--ai" type="button" onClick={onAiSearch} disabled={isAiLoading}>
            {isAiLoading && <Spinner />}
            {isAiLoading ? "Searching…" : "Search with AI"}
          </button>
        </div>
        {aiQuestion && (
          <div className="ai-search__clarification">
            <p role="status">{aiQuestion}</p>
            <div className="ai-search__controls">
              <label className="sr-only" htmlFor="ai-clarification">Your clarification</label>
              <input
                id="ai-clarification"
                type="text"
                value={aiClarification}
                onChange={onAiClarificationChange}
                placeholder="Type your clarification"
                maxLength={300}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onAiClarify();
                  }
                }}
              />
              <button
                className="button button--secondary"
                type="button"
                onClick={onAiClarify}
                disabled={isAiLoading || !aiClarification.trim()}
              >
                {isAiLoading && <Spinner />}
                {isAiLoading ? "Checking…" : "Continue"}
              </button>
            </div>
          </div>
        )}
        {aiError && <p className="ai-search__error" role="alert">{aiError}</p>}
      </div>
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

      <button
        className="button button--secondary filters-toggle"
        type="button"
        aria-expanded={filtersOpen}
        aria-controls="search-filters"
        onClick={onToggleFilters}
      >
        {filtersOpen ? "Hide filters" : "Show filters"}
        {activeFilterCount > 0 && (
          <span className="filters-toggle__count">
            {activeFilterCount}
            <span className="sr-only"> active</span>
          </span>
        )}
      </button>

      <FilterPanel filters={filters} onChange={onChange} />

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
