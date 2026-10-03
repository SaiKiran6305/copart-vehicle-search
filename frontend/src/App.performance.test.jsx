import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";
import { searchVehicles } from "./api/vehicles.js";
import { initialCriteria } from "./data/searchState.js";
import indexHtml from "../index.html?raw";

function vehicle(number) {
  return {
    id: number,
    lotNumber: `LOT-${1000 + number}`,
    year: 2020,
    make: "Toyota",
    model: "Camry",
    primaryDamage: "Normal Wear",
    condition: "Run and Drive",
    location: "Dallas, TX",
    saleDate: "2026-10-08",
    odometer: 25000,
    estimatedValue: 18000,
  };
}

function page(count) {
  return {
    content: Array.from({ length: count }, (_, index) => vehicle(index + 1)),
    number: 0,
    size: 12,
    totalElements: count,
    totalPages: 1,
    first: true,
    last: true,
  };
}

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  globalThis.__initialVehicleSearch = undefined;
  global.fetch = vi.fn(async () => okResponse(page(6)));
});

afterEach(() => {
  cleanup();
  globalThis.__initialVehicleSearch = undefined;
  vi.restoreAllMocks();
});

describe("early first search started by index.html", () => {
  it("asks for the same URL the app requests for the default search", async () => {
    const earlyUrl = indexHtml.match(/const url = "([^"]+)"/)[1];

    await searchVehicles(initialCriteria);

    expect(global.fetch).toHaveBeenCalledWith(earlyUrl, expect.anything());
  });

  it("is used for the first search instead of a second request", async () => {
    const url = "/api/vehicles?page=0&size=12&sortBy=saleDate&direction=asc";
    globalThis.__initialVehicleSearch = { url, response: Promise.resolve(okResponse(page(2))) };

    const result = await searchVehicles(initialCriteria);

    expect(result.content).toHaveLength(2);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("is used only once, so later searches get fresh results", async () => {
    const url = "/api/vehicles?page=0&size=12&sortBy=saleDate&direction=asc";
    globalThis.__initialVehicleSearch = { url, response: Promise.resolve(okResponse(page(2))) };

    await searchVehicles(initialCriteria);
    const second = await searchVehicles(initialCriteria);

    expect(second.content).toHaveLength(6);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("is dropped when the first search is a different one", async () => {
    globalThis.__initialVehicleSearch = {
      url: "/api/vehicles?page=0&size=12&sortBy=saleDate&direction=asc",
      response: Promise.resolve(okResponse(page(2))),
    };

    await searchVehicles({ ...initialCriteria, make: "Honda" });
    const later = await searchVehicles(initialCriteria);

    expect(later.content).toHaveLength(6);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to a normal request when the early one failed", async () => {
    const url = "/api/vehicles?page=0&size=12&sortBy=saleDate&direction=asc";
    globalThis.__initialVehicleSearch = { url, response: Promise.resolve(null) };

    const result = await searchVehicles(initialCriteria);

    expect(result.content).toHaveLength(6);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("is not applied after the search was cancelled", async () => {
    const url = "/api/vehicles?page=0&size=12&sortBy=saleDate&direction=asc";
    globalThis.__initialVehicleSearch = { url, response: Promise.resolve(okResponse(page(2))) };
    const controller = new AbortController();
    controller.abort();

    await expect(searchVehicles(initialCriteria, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("vehicle photos", () => {
  it("load the first row right away and the rest as they are scrolled near", async () => {
    render(<App />);

    const photos = await screen.findAllByRole("img", { name: "2020 Toyota Camry" });
    expect(photos).toHaveLength(6);
    for (const photo of photos.slice(0, 4)) {
      expect(photo).toHaveAttribute("loading", "eager");
      expect(photo).toHaveAttribute("fetchpriority", "high");
    }
    for (const photo of photos.slice(4)) {
      expect(photo).toHaveAttribute("loading", "lazy");
      expect(photo).toHaveAttribute("fetchpriority", "auto");
    }
  });
});
