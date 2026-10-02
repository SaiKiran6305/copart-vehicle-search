export default function Pagination({ result, onPageChange }) {
  const currentPage = result.totalPages === 0 ? 0 : result.number + 1;

  return (
    <nav className="pagination" aria-label="Vehicle result pages">
      <p>
        Page <strong>{currentPage}</strong> of <strong>{result.totalPages}</strong>
      </p>
      <div className="pagination__buttons">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => onPageChange(result.number - 1)}
          disabled={result.first}
          aria-label="Go to previous page"
        >
          ← <span>Previous</span>
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => onPageChange(result.number + 1)}
          disabled={result.last || result.totalPages === 0}
          aria-label="Go to next page"
        >
          <span>Next</span> →
        </button>
      </div>
    </nav>
  );
}
