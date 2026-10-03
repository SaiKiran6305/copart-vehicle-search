import FilterPanel from "./FilterPanel.jsx";
import SearchControls from "./SearchControls.jsx";

// A "Did you mean Toyota Corolla?" question can be answered with one click. Questions offering a
// choice ("…, or another Honda?") or asking for details still need a typed answer.
export function isConfirmationQuestion(question) {
  return /^\s*(did|do) you mean\b/i.test(question) && !/\bor\b/i.test(question);
}

export default function SearchForm({
  filters,
  searchValue,
  onChange,
  onSearchTextChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  aiQuestion,
  aiOriginalQuery,
  aiChips,
  aiError,
  isAiLoading,
  isClarifying,
  onAiSearch,
  onAiAnswer,
  onAiCancel,
}) {
  return (
    <form className={`search-panel${filtersOpen ? " filters-open" : ""}`} onSubmit={onSubmit} noValidate>
      <SearchControls
        idPrefix="main"
        value={searchValue}
        onChange={onSearchTextChange}
        isClarifying={isClarifying}
        isAiLoading={isAiLoading}
        isLoading={isLoading}
        onAskAi={onAiSearch}
      />

      {aiQuestion && (
        <div className="ai-followup" role="status">
          <p>{aiQuestion}</p>
          <span>Original request: “{aiOriginalQuery}”</span>
          {isConfirmationQuestion(aiQuestion) && (
            <div className="ai-followup__actions">
              <button
                className="button button--primary"
                type="button"
                onClick={() => onAiAnswer("Yes")}
                disabled={isAiLoading}
              >
                {isAiLoading ? "Searching…" : "Yes"}
              </button>
              <button className="button button--secondary" type="button" onClick={onAiCancel} disabled={isAiLoading}>
                No, edit my search
              </button>
            </div>
          )}
        </div>
      )}
      {aiChips.length > 0 && (
        <div className="ai-interpretation" aria-label="AI interpreted filters">
          <span className="ai-interpretation__label"><span aria-hidden="true">✨</span> AI interpreted</span>
          {aiChips.map((chip) => <span className="ai-chip" key={chip}>{chip}</span>)}
        </div>
      )}
      {aiError && <p className="ai-search__error" role="alert">{aiError}</p>}

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

      <div className="search-panel__footer">
        {validationError && <p className="form-error" role="alert">{validationError}</p>}
        <button className="button button--text" type="button" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </form>
  );
}
