import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";
import { readSearchFromUrl, searchToQueryString } from "./data/searchState.js";

function makePage(params) {
  const size = Number(params.get("size") || 12);
  const page = Number(params.get("page") || 0);
  const totalPages = Math.ceil(300 / size);
  return {
    content: [{
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
    totalElements: 300,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

const requestParams = () =>
  new URL(global.fetch.mock.calls.at(-1)[0], window.location.origin).searchParams;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  global.fetch = vi.fn(async (url) => ({
    ok: true,
    json: async () => makePage(new URL(url, window.location.origin).searchParams),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("search kept in the URL", () => {
  it("writes the applied search to the address bar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });
    expect(window.location.search).toBe("");

    await user.selectOptions(screen.getByLabelText("Make"), "Toyota");
    await user.selectOptions(screen.getByLabelText("Sort"), "estimatedValue:desc");
    await user.click(screen.getByRole("button", { name: /go to next page/i }));

    await waitFor(() => expect(window.location.search)
      .toBe("?make=Toyota&sortBy=estimatedValue&direction=desc&page=2"));
  });

  it("restores the search from a shared or refreshed link", async () => {
    window.history.replaceState(null, "", "/?q=dallas&make=Honda&model=Civic&damage=Hail&condition=Run+and+Drive&minYear=2019&maxYear=2023&price=10000-15000&sortBy=year&direction=desc&size=24&page=3");
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    const params = requestParams();
    expect(Object.fromEntries(params)).toEqual({
      q: "dallas",
      make: "Honda",
      model: "Civic",
      primaryDamage: "Hail",
      condition: "Run and Drive",
      minYear: "2019",
      maxYear: "2023",
      minPrice: "10000",
      maxPrice: "15000",
      page: "2",
      size: "24",
      sortBy: "year",
      direction: "desc",
    });
    expect(screen.getByRole("searchbox", { name: /search by vehicle/i })).toHaveValue("dallas");
    expect(screen.getByLabelText("Make")).toHaveValue("Honda");
    expect(screen.getByLabelText("Model")).toHaveValue("Civic");
    expect(screen.getByLabelText("Sort")).toHaveValue("year:desc");
    expect(screen.getByLabelText("Per page")).toHaveValue("24");
  });

  it("goes back to the previous search with the Back button", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.selectOptions(screen.getByLabelText("Make"), "Toyota");
    await waitFor(() => expect(window.location.search).toBe("?make=Toyota"));
    await user.selectOptions(screen.getByLabelText("Make"), "Kia");
    await waitFor(() => expect(window.location.search).toBe("?make=Kia"));

    await act(async () => {
      window.history.back();
      await new Promise((resolve) => window.addEventListener("popstate", resolve, { once: true }));
    });

    await waitFor(() => expect(screen.getByLabelText("Make")).toHaveValue("Toyota"));
    await waitFor(() => expect(requestParams().get("make")).toBe("Toyota"));
    expect(window.location.search).toBe("?make=Toyota");
  });

  it("ignores invalid values in the link and tidies the address bar", async () => {
    window.history.replaceState(null, "", "/?make=Ferrari&sortBy=id&direction=sideways&size=7&page=-4&minYear=2024&maxYear=2019&price=1-2");
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    const params = requestParams();
    expect(params.get("make")).toBeNull();
    expect(params.get("sortBy")).toBe("saleDate");
    expect(params.get("size")).toBe("12");
    expect(params.get("page")).toBe("0");
    expect(params.get("minYear")).toBeNull();
    expect(params.get("minPrice")).toBeNull();
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("round-trips every search option through the URL", () => {
    const link = "?q=lot+1001&make=Ford&model=F-150&damage=Water%2FFlood&condition=Stationary&minYear=2018&maxYear=2022&price=30000-&sortBy=odometer&direction=asc&size=48&page=2";
    expect(searchToQueryString(readSearchFromUrl(link).criteria)).toBe(link);
  });
});
