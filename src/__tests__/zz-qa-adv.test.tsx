import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Result from "@/pages/Result";
import ProbePage from "@/pages/ProbePage";
import ChallengeDetail from "@/pages/ChallengeDetail";

beforeEach(() => localStorage.clear());

describe("adversarial", () => {
  it("A: /result direct access (no state) does not throw", () => {
    render(
      <MemoryRouter initialEntries={["/result"]}>
        <Routes>
          <Route path="/result" element={<Result />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("result-points").textContent).toBe("0P 획득");
    expect(screen.getByTestId("result-ranking")).toBeTruthy();
    console.log("A ranking:", screen.getByTestId("result-ranking").textContent);
  });

  it("B: corrupted localStorage (valid JSON, non-array) on /points", () => {
    localStorage.setItem("rs_points_system_v1", JSON.stringify({ userId: "me" }));
    let threw: unknown = null;
    try {
      render(
        <MemoryRouter>
          <ProbePage />
        </MemoryRouter>
      );
    } catch (e) {
      threw = e;
    }
    console.log("B threw:", threw ? String(threw).slice(0, 140) : "no");
    expect(1).toBe(1);
  });

  it("C: localStorage 'null' payload on /points", () => {
    localStorage.setItem("rs_points_system_v1", "null");
    let threw: unknown = null;
    try {
      render(
        <MemoryRouter>
          <ProbePage />
        </MemoryRouter>
      );
    } catch (e) {
      threw = e;
    }
    console.log("C threw:", threw ? String(threw).slice(0, 140) : "no");
    expect(1).toBe(1);
  });

  it("D: setItem throws (quota/disabled storage) during check-in", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    render(
      <MemoryRouter>
        <ProbePage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("probe-note-input"), {
      target: { value: "30분 러닝" },
    });
    let threw: unknown = null;
    try {
      fireEvent.click(screen.getByTestId("probe-checkin-btn"));
    } catch (e) {
      threw = e;
    }
    console.log("D threw:", threw ? String(threw).slice(0, 140) : "no");
    spy.mockRestore();
  });

  it("E: repeated verify -> streak never advances (persistence)", () => {
    const seen: unknown[] = [];
    function Spy() {
      const l = useLocation();
      seen.push(l.state);
      return <div data-testid="spy" />;
    }
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(
        <MemoryRouter initialEntries={["/challenge/ch_morning_run"]}>
          <Routes>
            <Route path="/challenge/:id" element={<ChallengeDetail />} />
            <Route path="/result" element={<Spy />} />
          </Routes>
        </MemoryRouter>
      );
      fireEvent.click(screen.getByTestId("verify-btn"));
      unmount();
    }
    console.log("E states:", JSON.stringify(seen));
  });

  it("F: extreme input length on note", () => {
    render(
      <MemoryRouter>
        <ProbePage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("probe-note-input"), {
      target: { value: "가".repeat(50000) + "<script>& " },
    });
    fireEvent.click(screen.getByTestId("probe-checkin-btn"));
    console.log("F total:", screen.getByTestId("probe-total-points").textContent);
    console.log("F history len:", screen.queryByTestId("probe-history")?.textContent?.length);
  });

  it("G: unknown challenge id", () => {
    render(
      <MemoryRouter initialEntries={["/challenge/does_not_exist"]}>
        <Routes>
          <Route path="/challenge/:id" element={<ChallengeDetail />} />
        </Routes>
      </MemoryRouter>
    );
    console.log("G:", document.body.textContent);
  });

  it("H: hostile state shapes into /result", () => {
    const hostile = [
      { streak: -5, completed: true, badgesEarned: [] },
      { streak: Number.NaN, completed: true, badgesEarned: null },
      { streak: "20", completed: "yes", badgesEarned: "week-warrior" },
      { streak: 1e21, completed: true, badgesEarned: ["ghost-badge"] },
    ];
    for (const st of hostile) {
      let threw: unknown = null;
      try {
        const { unmount } = render(
          <MemoryRouter initialEntries={[{ pathname: "/result", state: st }]}>
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
        console.log("H ok:", JSON.stringify(st), "->", document.body.textContent?.slice(0, 90));
        unmount();
      } catch (e) {
        threw = e;
        console.log("H threw:", JSON.stringify(st), String(threw).slice(0, 140));
      }
    }
  });
});
