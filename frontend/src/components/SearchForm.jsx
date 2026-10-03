import FilterPanel from "./FilterPanel.jsx";
import SearchControls from "./SearchControls.jsx";
import { quickSearches } from "../data/searchOptions.js";

// One-click answers to the AI's "Did you mean …?" questions:
//   "Did you mean Toyota Corolla?"                        -> ["Yes"]
//   "Did you mean a Honda vehicle or a Toyota Corolla?"   -> ["Honda vehicle", "Toyota Corolla"]
//   "…, Did you mean a Toyota Corolla, or another Honda?" -> ["Toyota Corolla", "Another Honda"]
// Any other question (asking for details, or with more than three choices) returns [] and is
// answered by typing.
export function quickAnswers(question) {
  const match = /(?:^|[.!?]\s+)(?:did|do) you mean\s+(.+?)\?\s*$/i.exec(question ?? "");
  if (!match) return [];
  const choices = match[1]
    .split(/,\s+(?:or\s+)?|\s+or\s+/i)
    .map((choice) => choice.trim().replace(/^(a|an|the)\s+/i, ""))
    .filter(Boolean)
    .map((choice) => choice.charAt(0).toUpperCase() + choice.slice(1));
  if (choices.length === 1) return ["Yes"];
  return choices.length <= 3 ? choices : [];
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
  onQuickSearch,
  activeQuickSearch,
}) {
  const answers = aiQuestion ? quickAnswers(aiQuestion) : [];

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

      {!aiQuestion && (
        <div className="quick-searches" role="group" aria-label="Popular searches">
          <span className="quick-searches__label">Popular:</span>
          {quickSearches.map(({ label, filters: preset }) => (
            <button
              key={label}
              className="quick-search"
              type="button"
              aria-pressed={activeQuickSearch === label}
              onClick={() => onQuickSearch(preset)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {aiQuestion && (
        <div className="ai-followup" role="status">
          <p>{aiQuestion}</p>
          <span>Original request: “{aiOriginalQuery}”</span>
          {answers.length > 0 && (
            <div className="ai-followup__actions">
              {answers.map((answer) => (
                <button
                  key={answer}
                  className="button button--primary"
                  type="button"
                  onClick={() => onAiAnswer(answer)}
                  disabled={isAiLoading}
                >
                  {answer}
                </button>
              ))}
              <button className="button button--secondary" type="button" onClick={onAiCancel} disabled={isAiLoading}>
                {answers[0] === "Yes" ? "No, edit my search" : "Neither, edit my search"}
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
