import VehicleCard from "./VehicleCard.jsx";
import Pagination from "./Pagination.jsx";
import LoadingState from "./LoadingState.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

export default function VehicleResults({
  result,
  isLoading,
  error,
  onPageChange,
  onRetry,
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (result.content.length === 0) {
    return (
      <section className="empty-state" aria-live="polite">
        <span className="empty-state__icon" aria-hidden="true">
          ◌
        </span>
        <h2>No vehicles found</h2>
        <p>Try broadening your search or clearing one or more filters.</p>
      </section>
    );
  }

  return (
    <section className="results" aria-label="Vehicle search results" aria-live="polite">
      <div className="results__header">
        <div>
          <p className="eyebrow">Search results</p>
          <h2>
            {result.totalElements.toLocaleString()}{" "}
            {result.totalElements === 1 ? "vehicle" : "vehicles"}
          </h2>
        </div>
        <p className="results__page-summary">
          Showing {result.number * result.size + 1}–
          {Math.min((result.number + 1) * result.size, result.totalElements)} of{" "}
          {result.totalElements.toLocaleString()}
        </p>
      </div>
      <div className="vehicle-grid">
        {result.content.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
      <Pagination result={result} onPageChange={onPageChange} />
    </section>
  );
}
