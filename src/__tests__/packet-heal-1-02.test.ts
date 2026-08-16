import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../pages/Home";
import Challenge from "../pages/Challenge";
import Result from "../pages/Result";
import Ranking from "../pages/Ranking";

/**
 * 화면·문구에서 금전/경쟁적 금전이전 UX 제거, 습관 트래커 UX로 재구성
 *
 * AC-1: 금액 입력/결제/환급 UI 컴포넌트와 그 라우트가 존재하지 않고 404·깨진 링크가 없음
 * AC-2: 전체 텍스트에서 금전·베팅 관련 단어(상금, 배팅, 예치, 환급, 원, 잃/따다)가 검색되지 않음
 * AC-3: 목표설정→오늘 체크→진행률/스트릭→배지 흐름이 클릭만으로 끝까지 동작
 * AC-4: 라우팅·렌더링 런타임 에러 없이 모든 화면 정상 표시
 */

// ---- @toss/tds-mobile mock: jsdom에서 크래시하므로 어떤 named/nested export든 통과시키는 Proxy로 대체 ----
vi.mock("@toss/tds-mobile", () => {
  const makeComponent = (name: string): any => {
    const Component = ({ children, ...props }: any) =>
      React.createElement("div", { "data-tds": name, ...props }, children);
    Component.displayName = name;
    return new Proxy(Component, {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        return makeComponent(`${name}.${String(prop)}`);
      },
    });
  };
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "__esModule") return true;
        return makeComponent(String(prop));
      },
    }
  );
});

// ---- react-router-dom useNavigate mock ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

// ---- 앱 전역 store mock (src/store/useAppStore.ts 계약을 그대로 흉내) ----
const mockCompleteChallenge = vi.fn().mockResolvedValue(undefined);
const mockLoadChallenges = vi.fn().mockResolvedValue(undefined);
const mockSetUser = vi.fn();

const sampleChallenge = {
  id: "c1",
  title: "독서 습관 21일",
  description: "매일 20쪽씩 21일 동안 읽기",
  category: "habit",
  difficulty: "easy" as const,
  durationDays: 21,
  pointsReward: 210,
};

const sampleResult = {
  id: "result_c1_1",
  challengeId: "c1",
  userId: "me",
  completedAt: "2026-08-16T09:00:00.000Z",
  pointsEarned: 210,
};

function buildStoreState(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "me", name: "나", points: 210, level: 3, completedChallenges: 1, createdAt: "2026-08-01T00:00:00.000Z" },
    challenges: [sampleChallenge],
    results: [sampleResult],
    loading: false,
    error: null,
    completeChallenge: mockCompleteChallenge,
    loadChallenges: mockLoadChallenges,
    setUser: mockSetUser,
    ...overrides,
  };
}

let mockStoreState = buildStoreState();

vi.mock("../store/useAppStore", () => ({
  useAppStore: () => mockStoreState,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockCompleteChallenge.mockClear();
  mockLoadChallenges.mockClear();
  mockSetUser.mockClear();
  mockStoreState = buildStoreState();
});

afterEach(() => {
  cleanup();
});

describe("화면·문구에서 금전/경쟁적 금전이전 UX 제거, 습관 트래커 UX로 재구성", () => {
  const projectRoot = process.cwd();
  const pagesDir = path.join(projectRoot, "src", "pages");
  const componentsDir = path.join(projectRoot, "src", "components");

  function listFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFilesRecursive(fullPath) : [fullPath];
    });
  }

  // ============================================================================
  // AC-1: 금전 UI 컴포넌트/라우트 부재
  // ============================================================================

  it("AC-1[P0]: should have no deposit/payment/refund UI files, and all four habit-tracker pages must exist", () => {
    const forbiddenFileNames = [
      "DepositInput",
      "AmountPicker",
      "AmountSelector",
      "StakeInput",
      "StakeAmount",
      "PrizeDistribution",
      "PayoutResult",
      "RefundNotice",
      "SettlementResult",
      "BettingSelector",
    ];
    const allFiles = [...listFilesRecursive(pagesDir), ...listFilesRecursive(componentsDir)];
    const forbiddenMatches = allFiles.filter((file) =>
      forbiddenFileNames.some((name) => path.basename(file).includes(name))
    );
    expect(forbiddenMatches).toEqual([]);

    const requiredPages = ["Home.tsx", "Challenge.tsx", "Result.tsx", "Ranking.tsx"];
    const existingPageNames = listFilesRecursive(pagesDir).map((file) => path.basename(file));
    requiredPages.forEach((page) => {
      expect(existingPageNames).toContain(page);
    });
  });

  it("AC-1[P0]: no page or component should reference deposit/stake/amount/payout/refund route paths (would 404 once removed)", () => {
    const forbiddenRoutePatterns = ["/deposit", "/stake", "/amount", "/payout", "/refund", "/prize"];
    const allFiles = [...listFilesRecursive(pagesDir), ...listFilesRecursive(componentsDir)];
    const violations: string[] = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      forbiddenRoutePatterns.forEach((route) => {
        if (content.includes(route)) violations.push(`${path.basename(file)}:${route}`);
      });
    });
    expect(violations).toEqual([]);
    expect(allFiles.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // AC-2: 금전·베팅 단어 전무
  // ============================================================================

  it("AC-2[P0]: should have zero occurrences of gambling/prize-money words (상금, 배팅, 베팅, 예치, 환급, 잃/따다) in pages and components", () => {
    const forbiddenWords = ["상금", "배팅", "베팅", "예치", "환급", "돈을 잃", "돈을 땄", "판돈"];
    const allFiles = [...listFilesRecursive(pagesDir), ...listFilesRecursive(componentsDir)];
    const violations: { file: string; word: string }[] = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      forbiddenWords.forEach((word) => {
        if (content.includes(word)) violations.push({ file: path.basename(file), word });
      });
    });
    expect(violations).toEqual([]);
  });

  it("AC-2[P0]: should have zero currency amount notations (₩ symbol or digit followed by 원) in pages and components", () => {
    const currencyPattern = /₩|\d[\d,]*\s*원/;
    const allFiles = [...listFilesRecursive(pagesDir), ...listFilesRecursive(componentsDir)];
    const violations: string[] = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      if (currencyPattern.test(content)) violations.push(path.basename(file));
    });
    expect(violations).toEqual([]);
  });

  // ============================================================================
  // AC-3: 목표설정→오늘체크→진행률/스트릭→배지 흐름이 클릭만으로 완주
  // ============================================================================

  it("AC-3[P0]: setting a goal on Home navigates to the Challenge screen by click alone (flow step 1→2)", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Home)));

    const goalInput = screen.getByTestId("goal-input");
    fireEvent.change(goalInput, { target: { value: "20" } });
    const submitButton = screen.getByTestId("goal-submit-button");
    fireEvent.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/challenge");
  });

  it("AC-3[P0]: checking off today's reading on Challenge records the result and moves to Result (flow step 2→3)", async () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Challenge)));

    const checkButton = screen.getByTestId("today-check-button");
    fireEvent.click(checkButton);

    await waitFor(() => expect(mockCompleteChallenge).toHaveBeenCalledWith("c1"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/result"));
  });

  it("AC-3[P0]: Result shows the concrete completion count/streak and links onward to the badge screen (flow step 3→4)", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Result)));

    const progressCard = screen.getByTestId("progress-card");
    expect(progressCard.textContent).toContain("1");

    const badgeLinkButtons = screen.getAllByTestId("view-badges-button");
    expect(badgeLinkButtons.length).toBe(1);
    fireEvent.click(badgeLinkButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/ranking");
  });

  it("AC-3[P1]: Ranking shows a badge collection and ranks entries by completion rate/streak, not by money", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Ranking)));

    expect(screen.getAllByTestId("ranking-list").length).toBe(1);
    expect(screen.getAllByTestId("badge-list").length).toBe(1);
  });

  // ============================================================================
  // AC-4: 라우팅·렌더링 런타임 에러 없이 모든 화면 정상 표시
  // ============================================================================

  it("AC-4[P0]: all four screens render their core elements without throwing when data is present", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Home)));
    expect(screen.getAllByTestId("goal-form").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, null, React.createElement(Challenge)));
    expect(screen.getAllByTestId("today-check-button").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, null, React.createElement(Result)));
    expect(screen.getAllByTestId("progress-card").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, null, React.createElement(Ranking)));
    expect(screen.getAllByTestId("ranking-list").length).toBe(1);
  });

  it("AC-4[P0]: Challenge and Result render a crash-free empty state when there is no goal/history yet (edge case)", () => {
    mockStoreState = buildStoreState({ challenges: [], results: [], user: null });

    render(React.createElement(MemoryRouter, null, React.createElement(Challenge)));
    expect(screen.getAllByTestId("empty-state").length).toBeGreaterThanOrEqual(1);
    cleanup();

    render(React.createElement(MemoryRouter, null, React.createElement(Result)));
    expect(screen.getAllByTestId("empty-state").length).toBeGreaterThanOrEqual(1);
  });
});
