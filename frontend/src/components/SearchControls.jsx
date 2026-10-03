function Spinner() {
  return <span className="spinner spinner--small" aria-hidden="true" />;
}

export default function SearchControls({
  idPrefix,
  value,
  onChange,
  isClarifying,
  isAiLoading,
  isLoading,
  onAskAi,
  onShowFilters,
}) {
  const inputId = `${idPrefix}-query`;

  return (
    <div className="search-composer" aria-busy={isAiLoading}>
      <label className="search-field" htmlFor={inputId}>
        <span className="sr-only">
          {isClarifying ? "Answer the AI question" : "Search by vehicle, lot, or location"}
        </span>
        <span className="search-field__icon" aria-hidden="true">⌕</span>
        <input
          id={inputId}
          name="q"
          type="search"
          aria-label={isClarifying ? "Answer the AI question" : "Search by vehicle, lot, or location"}
          placeholder={isClarifying
            ? "Type your answer to the AI question"
            : "Search make, model, lot # — or describe what you want"}
          value={value}
          onChange={onChange}
          maxLength={300}
        />
      </label>
      <button
        className="button button--primary search-composer__search"
        type="submit"
        aria-label="Search vehicles"
        disabled={isLoading}
      >
        <span aria-hidden="true">⌕</span>
        {isLoading ? "Searching…" : "Search"}
      </button>
      <button
        className="button button--ai search-composer__ai"
        type="button"
        aria-label={isClarifying ? "Ask AI with clarification" : "Ask AI"}
        onClick={onAskAi}
        disabled={isAiLoading || !value.trim()}
      >
        {isAiLoading && <Spinner />}
        {isAiLoading ? "Asking…" : <><span aria-hidden="true">✨</span> Ask AI</>}
      </button>
      {onShowFilters && (
        <button className="button button--secondary search-composer__filters" type="button" onClick={onShowFilters}>
          Filters
        </button>
      )}
    </div>
  );
}
