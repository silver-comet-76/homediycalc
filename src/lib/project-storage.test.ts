// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  PROJECT_STORAGE_KEY,
  addItemToProject,
  clearProject,
  loadProject,
  parseProject,
  removeProjectItem,
  updateProjectItem,
} from "./project";

/**
 * LocalStorage-backed planner behavior: add/edit/remove/clear and
 * corrupt-data handling through the real storage key. Pure
 * serialize/parse/format behavior lives in project.test.ts.
 */

beforeEach(() => {
  localStorage.clear();
});

const PAINT = {
  calculatorSlug: "paint-calculator",
  label: "Paint — Living room walls",
  lines: ["2 gallons of paint"],
  costUsd: 48.5,
  savedAt: 1_700_000_000_000,
};

describe("project LocalStorage behavior", () => {
  it("adds items from a calculator and persists them under the same key", () => {
    const project = addItemToProject({ ...PAINT });
    expect(project.items).toHaveLength(1);
    expect(project.items[0]?.quantity).toBe(1);
    expect(project.items[0]?.room).toBe("General");
    expect(typeof project.items[0]?.id).toBe("string");
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(parseProject(raw).items).toHaveLength(1);
  });

  it("edits quantity, price, label, and room of a saved item", () => {
    const added = addItemToProject({ ...PAINT });
    const id = added.items[0]?.id ?? "";
    const updated = updateProjectItem(id, {
      quantity: 3,
      costUsd: 50,
      room: "Kitchen",
      label: "Paint — Kitchen walls",
    });
    const item = updated.items[0];
    expect(item?.quantity).toBe(3);
    expect(item?.costUsd).toBe(50);
    expect(item?.room).toBe("Kitchen");
    expect(item?.label).toBe("Paint — Kitchen walls");
    // The edit survives a fresh load from storage.
    expect(loadProject().items[0]?.quantity).toBe(3);
  });

  it("clamps quantity to a whole number of at least 1", () => {
    const added = addItemToProject({ ...PAINT });
    const id = added.items[0]?.id ?? "";
    expect(updateProjectItem(id, { quantity: 0 }).items[0]?.quantity).toBe(1);
    expect(updateProjectItem(id, { quantity: 2.7 }).items[0]?.quantity).toBe(2);
    expect(updateProjectItem(id, { quantity: -5 }).items[0]?.quantity).toBe(1);
  });

  it("clears a price when the price is emptied", () => {
    const added = addItemToProject({ ...PAINT });
    const id = added.items[0]?.id ?? "";
    // The page sends NaN for an empty price field (Number("") is 0,
    // which would wrongly save a $0.00 price).
    const updated = updateProjectItem(id, { costUsd: Number.NaN });
    expect(updated.items[0]?.costUsd).toBeUndefined();
  });

  it("removes one item by id and keeps the rest", () => {
    const first = addItemToProject({ ...PAINT });
    addItemToProject({
      calculatorSlug: "primer-calculator",
      label: "Primer",
      lines: ["1 gallon of primer"],
      savedAt: 1_700_000_000_001,
    });
    const remaining = removeProjectItem(first.items[0]?.id ?? "");
    expect(remaining.items).toHaveLength(1);
    expect(remaining.items[0]?.calculatorSlug).toBe("primer-calculator");
  });

  it("leaves the project unchanged when removing an unknown id", () => {
    addItemToProject({ ...PAINT });
    expect(removeProjectItem("no-such-id").items).toHaveLength(1);
  });

  it("clears all saved project data", () => {
    addItemToProject({ ...PAINT });
    const cleared = clearProject();
    expect(cleared.items).toHaveLength(0);
    expect(loadProject().items).toHaveLength(0);
  });

  it("returns an empty project for corrupt stored data instead of throwing", () => {
    localStorage.setItem(PROJECT_STORAGE_KEY, "{not json");
    expect(loadProject().items).toHaveLength(0);
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ version: 99, items: [] }));
    expect(loadProject().items).toHaveLength(0);
  });
});
