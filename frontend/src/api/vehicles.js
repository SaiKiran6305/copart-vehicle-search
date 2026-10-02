export async function searchVehicles(criteria, signal) {
  const params = new URLSearchParams();
  const parameterNames = [
    "q",
    "make",
    "model",
    "condition",
    "minYear",
    "maxYear",
    "page",
    "size",
    "sortBy",
    "direction",
  ];

  for (const name of parameterNames) {
    const value = criteria[name];
    if (value !== undefined && value !== null && value !== "") {
      params.set(name, String(value));
    }
  }

  const response = await fetch(`/api/vehicles?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(
      response.status === 400
        ? "Some search options are invalid. Check the filters and try again."
        : `Vehicle search failed (HTTP ${response.status}). Please try again.`,
    );
  }

  return response.json();
}
