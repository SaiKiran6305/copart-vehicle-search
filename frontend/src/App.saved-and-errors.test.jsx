import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App.jsx";

const vehicle = {
  id: 7,
  lotNumber: "LOT-1123",
  year: 2021,
  make: "Hyundai",
  model: "Tucson",
  primaryDamage: "Front End",
  condition: "Run and Drive",
  location: "Miami, FL",
  saleDate: "2026-10-20",
  odometer: 41000,
  estimatedValue: 14250,
};

const page = {
  content: [vehicle],
  number: 0,
  size: 12,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
};

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => page }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("saved vehicles", () => {
  it("are stored by lot number, not database id", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Save 2021 Hyundai Tucson" }));

    expect(JSON.parse(window.localStorage.getItem("copart:saved-lot-numbers:v2"))).toEqual(["LOT-1123"]);
  });

  it("drop the old id-based list, which can point to the wrong car", async () => {
    window.localStorage.setItem("copart:saved-vehicle-ids:v1", JSON.stringify([7]));
    render(<App />);

    expect(await screen.findByRole("button", { name: "Save 2021 Hyundai Tucson" }))
      .toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("copart:saved-vehicle-ids:v1")).toBeNull();
  });
});

describe("search errors", () => {
  it("show the server's explanation of what is wrong", async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ status: 400, detail: "size must be between 1 and 100." }),
    }));
    render(<App />);

    expect(await screen.findByText("size must be between 1 and 100.")).toBeInTheDocument();
  });

  it("fall back to a general message when the server gives no details", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 400, json: async () => { throw new Error("empty"); } }));
    render(<App />);

    expect(await screen.findByText("Some search options are invalid. Check the filters and try again."))
      .toBeInTheDocument();
  });
});
