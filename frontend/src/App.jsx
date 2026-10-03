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

const savedVehiclesKey = "copart:saved-vehicle-ids:v1";

function readSavedVehicleIds() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(savedVehiclesKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [result, setResult] = useState(emptyResult);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(readSavedVehicleIds);
  const [showStickySearch, setShowStickySearch] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(savedVehiclesKey, JSON.stringify(favoriteIds));
    } catch {
      // Keep favorites usable for the current session when storage is unavailable.
    }
  }, [favoriteIds]);

  useEffect(() => {
    const syncFavorites = (event) => {
      if (event.key !== savedVehiclesKey && event.key !== null) return;
      try {
        const saved = JSON.parse(event.newValue || "[]");
        setFavoriteIds(Array.isArray(saved) ? saved : []);
      } catch {
        setFavoriteIds([]);
      }
    };
    window.addEventListener("storage", syncFavorites);
    return () => window.removeEventListener("storage", syncFavorites);
  }, []);

  useEffect(() => {
    const updateStickySearch = () => setShowStickySearch(window.scrollY > 320);
    updateStickySearch();
    window.addEventListener("scroll", updateStickySearch, { passive: true });
    return () => window.removeEventListener("scroll", updateStickySearch);
  }, []);

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
    const nextFilters = {
      ...filters,
      [name]: value,
      ...(name === "make" && value !== filters.make ? { model: "" } : {}),
    };
    const searchableFields = ["q", "make", "model", "condition", "minYear", "maxYear"];
    const hasSearchFilters = searchableFields.some((field) => nextFilters[field].trim() !== "");
    const hadSubmittedSearch = searchableFields.some((field) => {
      const value = criteria[field];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });

    setFilters(nextFilters);
    setValidationError("");
    setError("");

    if (!hasSearchFilters && hadSubmittedSearch) {
      setCriteria({ ...initialCriteria });
    }
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

  const handleSortChange = ({ sortBy, direction }) => {
    setError("");
    setValidationError("");
    setFilters((current) => ({ ...current, sortBy, direction }));
    setCriteria((current) => ({ ...current, sortBy, direction, page: 0 }));
  };

  const handlePageSizeChange = (size) => {
    const pageSize = Number(size);
    setError("");
    setValidationError("");
    setFilters((current) => ({ ...current, size: String(pageSize) }));
    setCriteria((current) => ({ ...current, size: pageSize, page: 0 }));
  };

  const handleFavoriteToggle = useCallback((vehicleId) => {
    setFavoriteIds((current) => current.includes(vehicleId)
      ? current.filter((id) => id !== vehicleId)
      : [...current, vehicleId]);
  }, []);

  const showFilters = () => {
    document.querySelector(".search-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRetry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Copart Vehicle Search home">
          <img src="/copart-logo.svg" alt="Copart" />
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow eyebrow--light">Vehicle marketplace</p>
            <h1>Find a vehicle</h1>
            <p className="hero__description">
              Search by make, model, lot number, or location.
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
          {showStickySearch && (
            <div className="sticky-search" role="region" aria-label="Quick vehicle search">
              <form className="sticky-search__form" onSubmit={handleSubmit}>
                <label className="search-field" htmlFor="sticky-query">
                  <span className="search-field__icon" aria-hidden="true">⌕</span>
                  <span className="sr-only">Search by vehicle, lot, or location</span>
                  <input
                    id="sticky-query"
                    name="q"
                    type="search"
                    placeholder="Search make, model, lot number, or location"
                    value={filters.q}
                    onChange={handleFilterChange}
                  />
                </label>
                <button className="button button--secondary" type="button" onClick={showFilters}>
                  Filters
                </button>
              </form>
            </div>
          )}
          <VehicleResults
            result={result}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
            criteria={criteria}
            onSortChange={handleSortChange}
            onPageSizeChange={handlePageSizeChange}
            favoriteIds={favoriteIds}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </div>
      </main>

      <footer className="site-footer">
        <span>Copart Vehicle Search</span>
        <span>Sample auction data · For demonstration only</span>
      </footer>
    </div>
  );
}
