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

  const url = `/api/vehicles?${params.toString()}`;
  const response = (await takeInitialResponse(url)) ?? (await fetch(url, { signal }));
  if (signal?.aborted) {
    throw new DOMException("A newer search replaced this one.", "AbortError");
  }
  if (!response.ok) {
    const detail = await problemDetail(response);
    throw new Error(
      response.status === 400
        ? detail || "Some search options are invalid. Check the filters and try again."
        : `Vehicle search failed (HTTP ${response.status}). Please try again.`,
    );
  }

  return response.json();
}

// index.html starts the default search before the app's code arrives (see the script there).
// Only the app's first search may use that response, and only if it asks for the same URL;
// otherwise it is dropped so a later search can never get old results.
function takeInitialResponse(url) {
  const initial = globalThis.__initialVehicleSearch;
  globalThis.__initialVehicleSearch = undefined;
  return initial?.url === url ? initial.response : null;
}

// The server explains errors in an RFC 9457 problem detail: { "status": 400, "detail": "..." }.
async function problemDetail(response) {
  try {
    const body = await response.json();
    return typeof body?.detail === "string" ? body.detail : "";
  } catch {
    return "";
  }
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
