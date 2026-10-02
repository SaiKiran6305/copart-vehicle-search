import { useCallback, useEffect, useState } from "react";
import { searchVehicles } from "./api/vehicles.js";
import SearchForm from "./components/SearchForm.jsx";
import VehicleResults from "./components/VehicleResults.jsx";

const initialFilters = {
  q: "",
  make: "",
  model: "",
  condition: "",
  minYear: "",
  maxYear: "",
  sortBy: "saleDate",
  direction: "asc",
  size: "10",
};

const initialCriteria = {
  ...initialFilters,
  page: 0,
  size: 10,
};

const emptyResult = {
  content: [],
  number: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [result, setResult] = useState(emptyResult);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    searchVehicles(criteria, controller.signal)
      .then(setResult)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [criteria, requestVersion]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setValidationError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const minYear = filters.minYear.trim();
    const maxYear = filters.maxYear.trim();

    if (minYear && maxYear && Number(minYear) > Number(maxYear)) {
      setValidationError("Minimum year must be less than or equal to maximum year.");
      return;
    }

    for (const year of [minYear, maxYear]) {
      if (year && (!Number.isInteger(Number(year)) || Number(year) < 1886 || Number(year) > 2100)) {
        setValidationError("Enter a year between 1886 and 2100.");
        return;
      }
    }

    setValidationError("");
    setCriteria({
      ...filters,
      minYear: minYear || undefined,
      maxYear: maxYear || undefined,
      page: 0,
      size: Number(filters.size),
    });
  };

  const handleClear = () => {
    setFilters(initialFilters);
    setValidationError("");
    setCriteria({ ...initialCriteria });
  };

  const handlePageChange = useCallback((page) => {
    setCriteria((current) => ({ ...current, page }));
  }, []);

  const handleRetry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Copart Vehicle Search home">
          <span className="brand__mark" aria-hidden="true">
            C
          </span>
          <span className="brand__text">
            <strong>COPART</strong>
            <small>VEHICLE SEARCH</small>
          </span>
        </a>
        <span className="header-tag">
          <span className="status-dot" />
          Prototype inventory
        </span>
      </header>

      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow eyebrow--light">Vehicle marketplace</p>
            <h1>Find the right vehicle.<br />Start with a search.</h1>
            <p className="hero__description">
              Explore auction listings and narrow down your next opportunity.
            </p>
          </div>
          <div className="hero__art" aria-hidden="true">
            <span className="hero__ring hero__ring--one" />
            <span className="hero__ring hero__ring--two" />
            <span className="hero__road" />
            <span className="hero__spark">✦</span>
          </div>
        </section>

        <div className="content-wrap">
          <SearchForm
            filters={filters}
            onChange={handleFilterChange}
            onSubmit={handleSubmit}
            onClear={handleClear}
            isLoading={isLoading}
            validationError={validationError}
          />
          <VehicleResults
            result={result}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
          />
        </div>
      </main>

      <footer className="site-footer">
        <span>Copart Vehicle Search</span>
        <span>Demonstration prototype · Synthetic listings only</span>
      </footer>
    </div>
  );
}
