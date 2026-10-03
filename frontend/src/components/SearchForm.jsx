import FilterPanel from "./FilterPanel.jsx";

export default function SearchForm({
  filters,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
  aiQuery, onAiQueryChange, aiQuestion, aiClarification, onAiClarificationChange,
  aiError, isAiLoading, onAiSearch, onAiClarify,
}) {
  return (
    <form className="search-panel" onSubmit={onSubmit} noValidate>
      <div className="ai-search">
        <div className="ai-search__intro">
          <span className="ai-search__spark" aria-hidden="true">✦</span>
          <div><label htmlFor="ai-query">Search with AI</label><p>Describe the vehicle you want in your own words.</p></div>
        </div>
        <div className="ai-search__controls">
          <input id="ai-query" type="text" value={aiQuery} onChange={onAiQueryChange} placeholder="Example: Toyota under $20,000 near Dallas" maxLength={300}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAiSearch(); } }} />
          <button className="button button--ai" type="button" onClick={onAiSearch} disabled={isAiLoading}>{isAiLoading ? "Searching…" : "Search with AI"}</button>
        </div>
        {aiQuestion && <div className="ai-search__clarification">
          <p role="status">{aiQuestion}</p>
          <div className="ai-search__controls">
            <label className="sr-only" htmlFor="ai-clarification">Your clarification</label>
            <input id="ai-clarification" type="text" value={aiClarification} onChange={onAiClarificationChange} placeholder="Type your clarification" maxLength={300}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAiClarify(); } }} />
            <button className="button button--secondary" type="button" onClick={onAiClarify} disabled={isAiLoading || !aiClarification.trim()}>{isAiLoading ? "Checking…" : "Continue"}</button>
          </div>
        </div>}
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

      <FilterPanel filters={filters} onChange={onChange} />

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
