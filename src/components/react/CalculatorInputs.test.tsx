// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NumberInput, ResultPanel, UnitToggle } from "./CalculatorInputs";

describe("NumberInput", () => {
  it("renders a labeled input and reports changes", () => {
    const onChange = vi.fn();
    render(
      <NumberInput
        id="length"
        label="Length"
        value="10"
        onChange={onChange}
        unit="ft"
        required
      />,
    );
    const input = screen.getByLabelText("Length (ft) *") as HTMLInputElement;
    expect(input.value).toBe("10");
    expect(input.type).toBe("number");
  });

  it("shows an inline error with role=alert when provided", () => {
    render(
      <NumberInput
        id="length"
        label="Length"
        value="-1"
        onChange={() => {}}
        error="Length must be greater than 0"
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Length must be greater than 0",
    );
  });
});

describe("UnitToggle", () => {
  it("marks the active system with aria-pressed and switches on click", () => {
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle value="imperial" onChange={onChange} />);
    expect(screen.getByText("Imperial (ft, in, gal)").getAttribute("aria-pressed")).toBe(
      "true",
    );
    screen.getByText("Metric (m, cm, L)").click();
    expect(onChange).toHaveBeenCalledWith("metric");
    rerender(<UnitToggle value="metric" onChange={onChange} />);
    expect(screen.getByText("Metric (m, cm, L)").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});

describe("ResultPanel", () => {
  it("renders rows, detail, and note", () => {
    render(
      <ResultPanel
        title="Your result"
        rows={[
          { label: "Concrete needed", value: "1.5 yd³", detail: "Exact: 1.42 yd³" },
          { label: "Bags (80 lb)", value: "68 bags" },
        ]}
        note="Package quantities are rounded up."
      />,
    );
    expect(screen.getByText("Your result")).toBeTruthy();
    expect(screen.getByText("1.5 yd³")).toBeTruthy();
    expect(screen.getByText("Exact: 1.42 yd³")).toBeTruthy();
    expect(screen.getByText("Package quantities are rounded up.")).toBeTruthy();
  });
});
