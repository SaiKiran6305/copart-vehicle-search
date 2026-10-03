import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";
import { saleCountdown } from "./components/VehicleCard.jsx";

const isoDate = (daysFromToday) => {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + daysFromToday))
    .toISOString().slice(0, 10);
};

function page(totalElements = 1000, saleDate = isoDate(3)) {
  return {
    content: [{
      id: 1, lotNumber: "LOT-1001", year: 2024, make: "Tesla", model: "Model 3",
      primaryDamage: "Hail", condition: "Run and Drive", location: "Dallas, TX",
      saleDate, odometer: 12000, estimatedValue: 4800,
    }],
    number: 0, size: 12, totalElements, totalPages: Math.ceil(totalElements / 12), first: true, last: false,
  };
}

const lastSearch = () => new URL(global.fetch.mock.calls.at(-1)[0], window.location.origin).searchParams;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => page() }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("popular search chips", () => {
  it.each([
    ["Tesla", { make: "Tesla" }, "?make=Tesla"],
    ["Under $5,000", { maxPrice: "5000" }, "?price=0-5000"],
    ["2025 or newer", { minYear: "2025" }, "?minYear=2025"],
    ["Texas", { q: "TX" }, "?q=TX"],
  ])("%s starts a search with only its filters", async (label, expected, url) => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?make=Honda&damage=Hail");
    render(<App />);
    await screen.findByRole("heading", { name: "1,000 vehicles" });

    await user.click(screen.getByRole("button", { name: label }));

    await waitFor(() => {
      for (const [key, value] of Object.entries(expected)) expect(lastSearch().get(key)).toBe(value);
    });
    for (const key of ["make", "primaryDamage"].filter((key) => !(key in expected))) {
      expect(lastSearch().get(key)).toBeNull();
    }
    expect(window.location.search).toBe(url);
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows TX in the search box for Texas, so the search is clear", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "1,000 vehicles" });

    await user.click(screen.getByRole("button", { name: "Texas" }));

    expect(screen.getByRole("searchbox", { name: /search by vehicle/i })).toHaveValue("TX");
  });
});

describe("header", () => {
  it("shows the total number of vehicles from the unfiltered search", async () => {
    render(<App />);
    const stats = await screen.findByRole("list", { name: "About the listings" });
    await waitFor(() => expect(within(stats).getByText("1,000")).toBeInTheDocument());
    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("link", { name: "Copart Vehicle Search home" }));
  });

  it("leaves the total out when the page opens on a filtered search", async () => {
    window.history.replaceState(null, "", "/?make=Tesla");
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => page(100) }));
    render(<App />);
    await screen.findByRole("heading", { name: "100 vehicles" });

    const stats = screen.getByRole("list", { name: "About the listings" });
    expect(within(stats).queryByText("100")).not.toBeInTheDocument();
    expect(within(stats).getByText("15")).toBeInTheDocument();
  });
});

describe("sale countdown", () => {
  const today = new Date(2026, 9, 3);

  it("counts days to sales in the next two weeks", () => {
    expect(saleCountdown("2026-10-03", today)).toBe("Sale today");
    expect(saleCountdown("2026-10-04", today)).toBe("Sale tomorrow");
    expect(saleCountdown("2026-10-07", today)).toBe("Sale in 4 days");
    expect(saleCountdown("2026-10-17", today)).toBe("Sale in 14 days");
  });

  it("shows nothing for past sales, far-off sales, or a missing date", () => {
    expect(saleCountdown("2026-10-02", today)).toBe("");
    expect(saleCountdown("2026-10-18", today)).toBe("");
    expect(saleCountdown(undefined, today)).toBe("");
  });

  it("appears on the vehicle card", async () => {
    render(<App />);
    const card = await screen.findByRole("article", { name: "2024 Tesla Model 3" });
    expect(card).toHaveTextContent("Sale in 3 days");
  });
});
