export async function searchVehicles(criteria, signal) {
  const params = new URLSearchParams();
  const parameterNames = [
    "q",
    "make",
    "model",
    "primaryDamage",
    "condition",
    "minYear",
    "maxYear",
    "minPrice",
    "maxPrice",
    "maxPriceInclusive",
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

export async function interpretVehicleSearch(query, clarification = "") {
  const response = await fetch("/api/ai-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, clarification }),
  });
  if (!response.ok) {
    if (response.status === 429) {
      const waitSeconds = Number(response.headers?.get?.("Retry-After"));
      throw new Error(waitSeconds > 0
        ? `Too many AI searches. Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} and try again.`
        : "Too many AI searches. Please wait a minute and try again.");
    }
    throw new Error(response.status === 503
      ? "AI search is not configured on the server yet."
      : "AI search could not complete. Please try again.");
  }
  return response.json();
}
