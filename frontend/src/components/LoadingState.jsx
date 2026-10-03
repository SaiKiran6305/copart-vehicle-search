// Placeholder cards shown while the first results load, in the same layout as the real grid.
export default function LoadingState({ count = 8 }) {
  return (
    <section className="results results--loading" aria-busy="true">
      <p className="sr-only" role="status">Loading vehicle listings…</p>
      <div className="results__header" aria-hidden="true">
        <div>
          <span className="skeleton skeleton--eyebrow" />
          <span className="skeleton skeleton--title" />
        </div>
      </div>
      <div className="vehicle-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="vehicle-card vehicle-card--skeleton" key={index}>
            <span className="skeleton skeleton--image" />
            <div className="vehicle-card__body">
              <span className="skeleton skeleton--line skeleton--wide" />
              <span className="skeleton skeleton--line skeleton--narrow" />
              <span className="skeleton skeleton--line" />
              <span className="skeleton skeleton--line skeleton--narrow" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
