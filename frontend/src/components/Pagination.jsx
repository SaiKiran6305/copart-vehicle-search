export default function Pagination({ result, onPageChange, pageSize, onPageSizeChange }) {
  const currentPage = result.totalPages === 0 ? 0 : result.number + 1;

  return (
    <nav className="pagination" aria-label="Vehicle result pages">
      <p>
        Page <strong>{currentPage}</strong> of <strong>{result.totalPages}</strong>
      </p>
      <div className="pagination__controls">
        <label className="pagination__size" htmlFor="page-size">
          <span>Per page</span>
          <select
            id="page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="96">96</option>
          </select>
        </label>
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
      </div>
    </nav>
  );
}
