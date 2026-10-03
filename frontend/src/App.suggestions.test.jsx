import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";

const vehicle = {
  id: 1,
  lotNumber: "LOT-1001",
  year: 2016,
  make: "Chevrolet",
  model: "Silverado",
  primaryDamage: "Water/Flood",
  condition: "Stationary",
  location: "Dallas, TX",
  saleDate: "2026-10-08",
  odometer: 125000,
  estimatedValue: 4200,
};

// Fake API: 2 vehicles match Chevrolet + Water/Flood + under $5,000.
// Without the price filter 9 match, without the damage filter 14, without the make 30.
function countFor(params) {
  const filters = ["make", "primaryDamage", "maxPrice"].filter((name) => params.get(name));
  if (filters.length === 3) return 2;
  if (!params.get("maxPrice")) return 9;
  if (!params.get("primaryDamage")) return 14;
  if (!params.get("make")) return 30;
  return 300;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/?make=Chevrolet&damage=Water%2FFlood&price=0-5000");
  window.localStorage.clear();
  global.fetch = vi.fn(async (url) => {
    const params = new URL(url, window.location.origin).searchParams;
    const total = params.toString().includes("make") || params.toString().includes("Price") ? countFor(params) : 300;
    const size = Number(params.get("size") || 12);
    return {
      ok: true,
      json: async () => ({
        content: total === 0 ? [] : [vehicle],
        number: 0,
        size,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        first: true,
        last: total <= size,
      }),
    };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("sparse results", () => {
  it("suggests the filters to remove, most results first", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "2 vehicles" })).toBeInTheDocument();

    const buttons = await screen.findAllByRole("button", { name: /^Remove / });
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Remove Chevrolet30 vehicles",
      "Remove Water/Flood damage14 vehicles",
      "Remove Under $5,0009 vehicles",
    ]);
  });

  it("removes the chosen filter and keeps the others", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "2 vehicles" });

    await user.click(await screen.findByRole("button", { name: /Remove Under \$5,000/ }));

    await waitFor(() => expect(screen.getByLabelText("Estimated value")).toHaveValue(""));
    expect(screen.getByLabelText("Make")).toHaveValue("Chevrolet");
    expect(screen.getByLabelText("Primary damage")).toHaveValue("Water/Flood");
    await waitFor(() => expect(window.location.search).toBe("?make=Chevrolet&damage=Water%2FFlood"));
    expect(await screen.findByRole("heading", { name: "9 vehicles" })).toBeInTheDocument();
  });

  it("does not suggest anything when plenty of vehicles match", async () => {
    window.history.replaceState(null, "", "/?make=Chevrolet");
    render(<App />);
    const results = await screen.findByRole("region", { name: "Vehicle search results" });
    await waitFor(() => expect(within(results).queryByText(/Try removing a filter/)).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
  });
});
