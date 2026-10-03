import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";

function makePage(params, totalElements = 300) {
  const size = Number(params.get("size") || 12);
  const page = Number(params.get("page") || 0);
  const totalPages = Math.ceil(totalElements / size);
  return {
    content: totalElements === 0 ? [] : [{
      id: 1,
      lotNumber: "LOT-1001",
      year: 2020,
      make: "Toyota",
      model: "Camry",
      primaryDamage: "Normal Wear",
      condition: "Run and Drive",
      location: "Dallas, TX",
      saleDate: "2026-10-08",
      odometer: 25000,
      estimatedValue: 18000,
    }],
    number: page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

const requestParams = (call = -1) =>
  new URL(global.fetch.mock.calls.at(call)[0], window.location.origin).searchParams;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  global.fetch = vi.fn(async (url) => {
    const params = new URL(url, window.location.origin).searchParams;
    const total = params.get("q") === "nomatch" ? 0 : 300;
    return { ok: true, json: async () => makePage(params, total) };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("search state regressions", () => {
  it("keeps the chosen sort and page size when the search box is cleared", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.selectOptions(screen.getByLabelText("Sort"), "estimatedValue:desc");
    await user.selectOptions(screen.getByLabelText("Per page"), "24");
    await waitFor(() => expect(requestParams().get("size")).toBe("24"));

    const search = screen.getByRole("searchbox", { name: /search by vehicle/i });
    await user.type(search, "toyota");
    await user.click(screen.getByRole("button", { name: "Search vehicles" }));
    await waitFor(() => expect(requestParams().get("q")).toBe("toyota"));

    await user.clear(search);
    await waitFor(() => expect(requestParams().get("q")).toBeNull());

    expect(requestParams().get("sortBy")).toBe("estimatedValue");
    expect(requestParams().get("direction")).toBe("desc");
    expect(requestParams().get("size")).toBe("24");
    await screen.findByRole("heading", { name: "300 vehicles" });
    expect(screen.getByLabelText("Sort")).toHaveValue("estimatedValue:desc");
    expect(screen.getByLabelText("Per page")).toHaveValue("24");
  });

  it("includes typed text and years when a dropdown filter is changed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByRole("searchbox", { name: /search by vehicle/i }), "dallas");
    await user.type(screen.getByLabelText("Minimum year"), "2020");
    await user.selectOptions(screen.getByLabelText("Primary damage"), "Hail");

    await waitFor(() => expect(requestParams().get("primaryDamage")).toBe("Hail"));
    expect(requestParams().get("q")).toBe("dallas");
    expect(requestParams().get("minYear")).toBe("2020");
  });

  it("does not search with an invalid year range when a dropdown changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });
    const callsBefore = global.fetch.mock.calls.length;

    await user.type(screen.getByLabelText("Minimum year"), "2024");
    await user.type(screen.getByLabelText("Maximum year"), "2019");
    await user.selectOptions(screen.getByLabelText("Make"), "Kia");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Minimum year must be less than or equal to maximum year.",
    );
    expect(global.fetch.mock.calls.length).toBe(callsBefore);
  });

  it("keeps the current results on screen while the next page loads", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    let release;
    global.fetch.mockImplementationOnce((url) => new Promise((resolve) => {
      release = () => resolve({
        ok: true,
        json: async () => makePage(new URL(url, window.location.origin).searchParams),
      });
    }));
    await user.click(screen.getByRole("button", { name: /go to next page/i }));

    expect(screen.getByRole("heading", { name: "300 vehicles" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Vehicle search results" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Updating…")).toBeInTheDocument();

    release();
    expect(await screen.findByRole("navigation", { name: "Vehicle result pages" }))
      .toHaveTextContent("Page 2 of 25");
    expect(screen.getByRole("region", { name: "Vehicle search results" })).toHaveAttribute("aria-busy", "false");
  });

  it("offers a reset button when nothing matches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByRole("searchbox", { name: /search by vehicle/i }), "nomatch");
    await user.click(screen.getByRole("button", { name: "Search vehicles" }));
    expect(await screen.findByText("No vehicles found")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset search" }));
    expect(await screen.findByRole("heading", { name: "300 vehicles" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /search by vehicle/i })).toHaveValue("");
  });

  it("clear filters also clears the AI search text and any pending AI question", async () => {
    const user = userEvent.setup();
    const listFetch = global.fetch;
    global.fetch = vi.fn(async (url, options) => (url === "/api/ai-search"
      ? { ok: true, json: async () => ({ status: "CLARIFICATION", question: "Which year range?" }) }
      : listFetch(url, options)));
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByLabelText("Search with AI"), "a newer SUV");
    await user.click(screen.getByRole("button", { name: "Search with AI" }));
    expect(await screen.findByText("Which year range?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByLabelText("Search with AI")).toHaveValue("");
    expect(screen.queryByText("Which year range?")).not.toBeInTheDocument();
  });

  it("keeps an AI 'up to' price when another dropdown changes", async () => {
    const user = userEvent.setup();
    const listFetch = global.fetch;
    global.fetch = vi.fn(async (url, options) => (url === "/api/ai-search"
      ? { ok: true, json: async () => ({ status: "READY", filters: {
          q: null, make: "Toyota", model: null, primaryDamage: null, condition: null,
          minYear: null, maxYear: null, maxPriceInclusive: 20000,
        } }) }
      : listFetch(url, options)));
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByLabelText("Search with AI"), "Toyota under $20,000");
    await user.click(screen.getByRole("button", { name: "Search with AI" }));
    await waitFor(() => expect(screen.getByLabelText("Make")).toHaveValue("Toyota"));

    await user.selectOptions(screen.getByLabelText("Primary damage"), "Hail");
    await waitFor(() => expect(requestParams().get("primaryDamage")).toBe("Hail"));
    expect(requestParams().get("make")).toBe("Toyota");
    expect(requestParams().get("maxPriceInclusive")).toBe("20000");
    expect(requestParams().get("minPrice")).toBeNull();
  });

  it("tells the visitor how long to wait when AI search is rate limited", async () => {
    const user = userEvent.setup();
    const listFetch = global.fetch;
    global.fetch = vi.fn(async (url, options) => (url === "/api/ai-search"
      ? { ok: false, status: 429, headers: new Headers({ "Retry-After": "42" }) }
      : listFetch(url, options)));
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByLabelText("Search with AI"), "Toyota under $20,000");
    await user.click(screen.getByRole("button", { name: "Search with AI" }));

    expect(await screen.findByText("Too many AI searches. Please wait 42 seconds and try again."))
      .toBeInTheDocument();
  });

  it("searches $30,000+ with only a lower bound", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.selectOptions(screen.getByLabelText("Estimated value"), "30000-");

    await waitFor(() => expect(requestParams().get("minPrice")).toBe("30000"));
    expect(requestParams().get("maxPrice")).toBeNull();
  });

  it("shows primary damage and condition separately, with a labelled representative photo", async () => {
    render(<App />);
    const card = await screen.findByRole("article", { name: "2020 Toyota Camry" });
    expect(card.querySelector(".damage-pill")).toHaveClass("damage-pill--good");
    expect(card.querySelector(".damage-pill")).toHaveTextContent("Primary damage: Normal Wear");
    expect(card).toHaveTextContent("ConditionRun and Drive");
    expect(screen.getByRole("img", { name: "2020 Toyota Camry, representative photo" })).toBeInTheDocument();
    expect(card).toHaveTextContent("Representative photo");
    expect(card.querySelector("img")).toHaveAttribute("src", "/vehicles/blue-sedan.webp");
    expect(card.querySelector("img")).toHaveAttribute("loading", "lazy");
  });
});
