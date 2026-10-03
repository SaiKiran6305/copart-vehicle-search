import VehicleCard from "./VehicleCard.jsx";
import Pagination from "./Pagination.jsx";
import LoadingState from "./LoadingState.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import { sortOptions } from "../data/searchOptions.js";

export default function VehicleResults({
  result,
  isLoading,
  error,
  onPageChange,
  onRetry,
  onReset,
  criteria,
  onSortChange,
  onPageSizeChange,
  favoriteIds,
  onFavoriteToggle,
}) {
  const hasResults = result.content.length > 0;

  // Only the very first load (nothing to show yet) replaces the results with a spinner.
  // Later loads keep the current cards on screen, dimmed, so the page doesn't jump.
  if (isLoading && !hasResults) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (!hasResults) {
    return (
      <section className="empty-state" aria-live="polite">
        <span className="empty-state__icon" aria-hidden="true">
          ◌
        </span>
        <h2>No vehicles found</h2>
        <p>Try broadening your search or clearing one or more filters.</p>
        {onReset && (
          <button className="button button--secondary" type="button" onClick={onReset}>
            Reset search
          </button>
        )}
      </section>
    );
  }

  const firstShown = result.number * result.size + 1;
  const lastShown = Math.min((result.number + 1) * result.size, result.totalElements);

  return (
    <section
      className={`results${isLoading ? " is-updating" : ""}`}
      aria-label="Vehicle search results"
      aria-busy={isLoading}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Showing ${firstShown} to ${lastShown} of ${result.totalElements} vehicles`}
      </p>
      <div className="results__header">
        <div>
          <p className="eyebrow">Search results</p>
          <h2>
            {result.totalElements.toLocaleString()}{" "}
            {result.totalElements === 1 ? "vehicle" : "vehicles"}
          </h2>
        </div>
        <div className="results__controls">
          {isLoading && (
            <span className="results__updating">
              <span className="spinner spinner--small" aria-hidden="true" />
              Updating…
            </span>
          )}
          <p className="results__page-summary">
            Showing {firstShown}–{lastShown} of{" "}
            {result.totalElements.toLocaleString()}
          </p>
          <label className="results__sort" htmlFor="sort-choice">
            <span>Sort</span>
            <select
              id="sort-choice"
              value={`${criteria.sortBy}:${criteria.direction}`}
              onChange={(event) => {
                const [sortBy, direction] = event.target.value.split(":");
                onSortChange({ sortBy, direction });
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="vehicle-grid">
        {result.content.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isFavorite={favoriteIds.includes(vehicle.id)}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
      <Pagination
        result={result}
        onPageChange={onPageChange}
        pageSize={criteria.size}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
}
