export default function ErrorMessage({ message, onRetry }) {
  return (
    <section className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        !
      </span>
      <div>
        <h2>We couldn’t load the listings</h2>
        <p>{message}</p>
        <button className="button button--secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </section>
  );
}
