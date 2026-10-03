import { useCallback, useEffect, useRef, useState } from "react";
import { interpretVehicleSearch, searchVehicles } from "./api/vehicles.js";
import { getPriceBounds } from "./data/searchOptions.js";
import {
  initialCriteria,
  initialFilters,
  readSearchFromUrl,
  searchToQueryString,
  toCriteria,
  validateYearRange,
} from "./data/searchState.js";
import SearchForm from "./components/SearchForm.jsx";
import SearchControls from "./components/SearchControls.jsx";
import VehicleResults from "./components/VehicleResults.jsx";

const emptyResult = {
  content: [],
  number: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

const savedVehiclesKey = "copart:saved-vehicle-ids:v1";

const searchableFields = ["q", "make", "model", "primaryDamage", "condition", "minYear", "maxYear", "priceRange"];
const instantFields = ["make", "model", "primaryDamage", "condition", "priceRange"];

function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (!element || typeof element.scrollIntoView !== "function") return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

function readSavedVehicleIds() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(savedVehiclesKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function App() {
  // The search in the URL (if any) decides the first results, so refreshed or shared links work.
  const [searchFromUrl] = useState(() => readSearchFromUrl(window.location.search));
  const [filters, setFilters] = useState(searchFromUrl.filters);
  const [criteria, setCriteria] = useState(searchFromUrl.criteria);
  // True when the next criteria change came from the URL itself (first load or Back/Forward),
  // so the URL is normalised in place instead of adding a history entry.
  const criteriaFromUrl = useRef(true);
  const [result, setResult] = useState(emptyResult);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(readSavedVehicleIds);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiClarification, setAiClarification] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [pendingAiQuery, setPendingAiQuery] = useState("");
  const [aiChips, setAiChips] = useState([]);
  const [aiError, setAiError] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiRequestVersion = useRef(0);

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
    // Show the compact search bar only once the whole search panel has scrolled out of view,
    // so the page never shows two search boxes at once.
    const panel = document.querySelector(".search-panel");
    if (!panel) return undefined;

    if (typeof window.IntersectionObserver === "function") {
      const observer = new window.IntersectionObserver(([entry]) => {
        setShowStickySearch(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
      });
      observer.observe(panel);
      return () => observer.disconnect();
    }

    // Fallback without IntersectionObserver (for example in tests): only once the panel is fully above the screen.
    const updateStickySearch = () => setShowStickySearch(panel.getBoundingClientRect().bottom < 0);
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

  // Keep the address bar in step with the applied search; each new search or page is a history entry.
  useEffect(() => {
    const query = searchToQueryString(criteria);
    if (query === window.location.search) {
      criteriaFromUrl.current = false;
      return;
    }
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    if (criteriaFromUrl.current) {
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
    criteriaFromUrl.current = false;
  }, [criteria]);

  // Back/Forward: show the search stored in that history entry.
  useEffect(() => {
    const showSearchFromUrl = () => {
      const { filters: urlFilters, criteria: urlCriteria } = readSearchFromUrl(window.location.search);
      criteriaFromUrl.current = true;
      aiRequestVersion.current += 1;
      setFilters(urlFilters);
      setValidationError("");
      setError("");
      setAiQuestion("");
      setPendingAiQuery("");
      setAiClarification("");
      setAiChips([]);
      setAiError("");
      setIsAiLoading(false);
      setCriteria(urlCriteria);
    };
    window.addEventListener("popstate", showSearchFromUrl);
    return () => window.removeEventListener("popstate", showSearchFromUrl);
  }, []);

  const applyAiFilters = (interpreted) => {
    const nextFilters = {
      ...filters, q: interpreted.q || "", make: interpreted.make || "",
      model: interpreted.model || "", primaryDamage: interpreted.primaryDamage || "",
      condition: interpreted.condition || "",
      minYear: interpreted.minYear == null ? "" : String(interpreted.minYear),
      maxYear: interpreted.maxYear == null ? "" : String(interpreted.maxYear),
      priceRange: interpreted.maxPriceInclusive == null ? "" : "up-to-" + interpreted.maxPriceInclusive,
    };
    setFilters(nextFilters);
    setValidationError("");
    setAiQuestion("");
    setPendingAiQuery("");
    setAiClarification("");
    setAiError("");
    const chips = [];
    if (interpreted.make && interpreted.model) chips.push(`${interpreted.make} ${interpreted.model}`);
    else if (interpreted.make || interpreted.model) chips.push(interpreted.make || interpreted.model);
    if (interpreted.primaryDamage) chips.push(`Damage: ${interpreted.primaryDamage}`);
    if (interpreted.condition) chips.push(`Condition: ${interpreted.condition}`);
    if (interpreted.minYear != null || interpreted.maxYear != null) {
      chips.push(`${interpreted.minYear ?? "Any"}–${interpreted.maxYear ?? "Any"}`);
    }
    if (interpreted.maxPriceInclusive != null) {
      chips.push(`Up to ${new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
      }).format(interpreted.maxPriceInclusive)}`);
    }
    setAiChips(chips);
    setCriteria({ ...nextFilters, ...getPriceBounds(nextFilters.priceRange), page: 0, size: Number(nextFilters.size) });
  };

  const runAiSearch = async () => {
    const clarification = aiQuestion ? aiClarification.trim() : "";
    const query = aiQuestion ? pendingAiQuery : filters.q.trim();
    if (!query) { setAiError("Enter a vehicle search description first."); return; }
    if (aiQuestion && !clarification) return;
    const requestVersion = ++aiRequestVersion.current;
    setIsAiLoading(true);
    setAiError("");
    try {
      const response = await interpretVehicleSearch(query, clarification);
      if (requestVersion !== aiRequestVersion.current) return;
      if (response.status === "CLARIFICATION") {
        setPendingAiQuery(query);
        setAiQuestion(response.question || "Could you clarify what you mean?");
        setAiClarification("");
      } else {
        applyAiFilters(response.filters || {});
      }
    } catch (requestError) {
      if (requestVersion === aiRequestVersion.current) setAiError(requestError.message);
    } finally {
      if (requestVersion === aiRequestVersion.current) setIsAiLoading(false);
    }
  };

  // Sends everything the form currently shows (text, dropdowns, years, sort, page size) to the API,
  // so the results always match the visible inputs. Returns false when the year range is invalid.
  const applyFilters = (formFilters) => {
    const minYear = formFilters.minYear.trim();
    const maxYear = formFilters.maxYear.trim();
    const message = validateYearRange(minYear, maxYear);

    if (message) {
      setValidationError(message);
      return false;
    }

    setValidationError("");
    setCriteria(toCriteria(formFilters));
    return true;
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    aiRequestVersion.current += 1;
    setIsAiLoading(false);
    if (name !== "q") setAiChips([]);
    const nextFilters = {
      ...filters,
      [name]: value,
      ...(name === "make" && value !== filters.make ? { model: "" } : {}),
    };
    const hasSearchFilters = searchableFields.some((field) => nextFilters[field].trim() !== "");
    const hadSubmittedSearch = searchableFields.some((field) => {
      const value = criteria[field];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });

    setFilters(nextFilters);
    setValidationError("");
    setError("");
    setAiError("");

    // Clearing the last filter restores the default results (keeping the chosen sort and page size),
    // and dropdowns apply immediately together with any text or years already typed.
    if ((!hasSearchFilters && hadSubmittedSearch) || instantFields.includes(name)) {
      applyFilters(nextFilters);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    aiRequestVersion.current += 1;
    setIsAiLoading(false);
    setAiError("");
    if (aiQuestion) {
      const nextFilters = { ...filters, q: pendingAiQuery };
      setAiQuestion("");
      setPendingAiQuery("");
      setAiClarification("");
      setAiChips([]);
      applyFilters(nextFilters);
      return;
    }
    applyFilters(filters);
  };

  const handleSearchTextChange = (event) => {
    aiRequestVersion.current += 1;
    setIsAiLoading(false);
    setAiError("");
    if (aiQuestion) {
      setAiClarification(event.target.value);
      setAiError("");
      return;
    }
    handleFilterChange(event);
  };

  // Remove filters suggested for a sparse result, starting from the search that is applied now.
  const handleRemoveFilter = (fields) => {
    const nextFilters = { ...initialFilters };
    for (const key of Object.keys(initialFilters)) {
      if (criteria[key] !== undefined && criteria[key] !== null) nextFilters[key] = String(criteria[key]);
    }
    for (const field of fields) nextFilters[field] = "";
    setFilters(nextFilters);
    setError("");
    setAiChips([]);
    applyFilters(nextFilters);
  };

  const handleClear = () => {
    aiRequestVersion.current += 1;
    setIsAiLoading(false);
    setFilters(initialFilters);
    setValidationError("");
    setAiQuestion("");
    setPendingAiQuery("");
    setAiClarification("");
    setAiChips([]);
    setAiError("");
    setCriteria({ ...initialCriteria });
  };

  const handlePageChange = useCallback((page) => {
    setCriteria((current) => ({ ...current, page }));
    const results = document.querySelector(".results");
    if (results && results.getBoundingClientRect().top < 0) {
      scrollToElement(".results");
    }
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
    setFiltersOpen(true);
    scrollToElement(".search-panel");
  };

  const searchValue = aiQuestion ? aiClarification : filters.q;

  const activeFilterCount = ["make", "model", "primaryDamage", "condition", "priceRange"]
    .filter((field) => filters[field]).length + (filters.minYear || filters.maxYear ? 1 : 0);

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
            searchValue={searchValue}
            onChange={handleFilterChange}
            onSearchTextChange={handleSearchTextChange}
            onSubmit={handleSubmit}
            onClear={handleClear}
            isLoading={isLoading}
            validationError={validationError}
            filtersOpen={filtersOpen || Boolean(validationError)}
            onToggleFilters={() => setFiltersOpen((open) => !open)}
            activeFilterCount={activeFilterCount}
            aiQuestion={aiQuestion}
            aiOriginalQuery={pendingAiQuery}
            aiChips={aiChips}
            aiError={aiError}
            isAiLoading={isAiLoading}
            isClarifying={Boolean(aiQuestion)}
            onAiSearch={runAiSearch}
          />
          {showStickySearch && (
            <div className="sticky-search" role="region" aria-label="Quick vehicle search">
              <form className="sticky-search__form" onSubmit={handleSubmit}>
                <SearchControls
                  idPrefix="sticky"
                  value={searchValue}
                  onChange={handleSearchTextChange}
                  isClarifying={Boolean(aiQuestion)}
                  isAiLoading={isAiLoading}
                  isLoading={isLoading}
                  onAskAi={runAiSearch}
                  onShowFilters={showFilters}
                />
              </form>
            </div>
          )}
          <VehicleResults
            result={result}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
            onReset={handleClear}
            onRemoveFilter={handleRemoveFilter}
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
