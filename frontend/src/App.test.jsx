import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";

function makeVehicle(make = "Toyota", model = "Camry", id = 1) {
  return {
    id,
    lotNumber: `LOT-${1000 + id}`,
    year: 2020,
    make,
    model,
    condition: "Run & Drive",
    location: "Dallas, TX",
    saleDate: "2026-10-08",
    odometer: 25000,
    estimatedValue: 18000,
  };
}

function makePage({ totalElements = 300, page = 0, size = 10, vehicle = makeVehicle() } = {}) {
  const totalPages = Math.ceil(totalElements / size);
  return {
    content: totalElements === 0 ? [] : [vehicle],
    number: page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

function mockSearchApi() {
  global.fetch = vi.fn(async (url) => {
    const params = new URL(url, window.location.origin).searchParams;
    const query = params.get("q") || "";
    const page = Number(params.get("page") || 0);
    const size = Number(params.get("size") || 10);

    if (query.toLowerCase() === "hondaxyz") {
      return { ok: true, json: async () => makePage({ totalElements: 0, page, size }) };
    }

    if (query.toLowerCase() === "honda") {
      return {
        ok: true,
        json: async () => makePage({
          totalElements: 12,
          page,
          size,
          vehicle: makeVehicle("Honda", "Civic", 2),
        }),
      };
    }

    return { ok: true, json: async () => makePage({ page, size }) };
  });
}

beforeEach(() => {
  window.localStorage.clear();
  mockSearchApi();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("vehicle search interactions", () => {
  it("loads results and moves to the next page", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "300 vehicles" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /go to next page/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("page=1"),
        expect.any(Object),
      );
    });
    expect(await screen.findByRole("navigation", { name: "Vehicle result pages" })).toHaveTextContent("Page 2 of 30");
  });

  it("updates available models when the make changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.selectOptions(screen.getByLabelText("Make"), "Toyota");
    const model = screen.getByLabelText("Model");
    expect(model).toBeEnabled();
    await user.selectOptions(model, "Camry");

    await user.selectOptions(screen.getByLabelText("Make"), "Honda");

    expect(model).toHaveValue("");
    expect(within(model).getByRole("option", { name: "Civic" })).toBeInTheDocument();
    expect(within(model).queryByRole("option", { name: "Camry" })).not.toBeInTheDocument();
  });

  it("submits a text search and displays matching results", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.type(screen.getByRole("searchbox", { name: /search by vehicle/i }), "Honda");
    await user.click(screen.getByRole("button", { name: "Search vehicles" }));

    expect(await screen.findByRole("heading", { name: "12 vehicles" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "2020 Honda Civic" })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("q=Honda"),
      expect.any(Object),
    );
  });

  it("restores default results as soon as the last text filter is cleared", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    const search = screen.getByRole("searchbox", { name: /search by vehicle/i });
    await user.type(search, "HondaXYZ");
    await user.click(screen.getByRole("button", { name: "Search vehicles" }));
    expect(await screen.findByText("No vehicles found")).toBeInTheDocument();

    await user.clear(search);

    expect(await screen.findByRole("heading", { name: "300 vehicles" })).toBeInTheDocument();
    expect(screen.queryByText("No vehicles found")).not.toBeInTheDocument();
  });

  it("clear filters resets selections and reloads the default results", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "300 vehicles" });

    await user.selectOptions(screen.getByLabelText("Make"), "Honda");
    await user.selectOptions(screen.getByLabelText("Model"), "Civic");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByLabelText("Make")).toHaveValue("");
    expect(screen.getByLabelText("Model")).toBeDisabled();
    expect(await screen.findByRole("heading", { name: "300 vehicles" })).toBeInTheDocument();
  });

  it("keeps a saved vehicle after the app is rendered again", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);
    await screen.findByRole("article", { name: "2020 Toyota Camry" });

    await user.click(screen.getByRole("button", { name: "Save 2020 Toyota Camry" }));
    expect(screen.getByRole("button", { name: "Remove 2020 Toyota Camry from saved vehicles" }))
      .toHaveAttribute("aria-pressed", "true");

    firstRender.unmount();
    render(<App />);

    expect(await screen.findByRole("button", {
      name: "Remove 2020 Toyota Camry from saved vehicles",
    })).toHaveAttribute("aria-pressed", "true");
  });
});
