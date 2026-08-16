import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * 습관 트래커 화면 재구성: 금전 UI 제거 후 목표→체크→진행률→배지 흐름 완성
 *
 * AC-1: 금액 입력/결제/환급 UI 컴포넌트와 라우트가 존재하지 않고 dead import·404 링크가 없음
 * AC-2: 전체 텍스트에서 상금·배팅·예치·환급·원(₩)·잃다·따다 검색 결과 0건
 * AC-3: 목표설정→오늘 체크→진행률/스트릭→배지 흐름이 클릭만으로 끝까지 동작하고 렌더 런타임 에러 없음
 * AC-4: npx tsc --noEmit, npm test -- --run, npm run build 모두 성공
 */

// ---- @toss/tds-mobile mock: jsdom에서 크래시하므로 어떤 named/nested export든 통과시키는 Proxy로 대체 ----
vi.mock("@toss/tds-mobile", () => {
  const SPECIAL_KEYS = new Set([
    "then",
    "prototype",
    "propTypes",
    "defaultProps",
    "contextTypes",
    "childContextTypes",
    "getDerivedStateFromProps",
    "contextType",
    "$$typeof",
  ]);
  const makeComponent = (name: string): any => {
    const Component = ({ children, ...props }: any) =>
      React.createElement("div", { "data-tds": name, ...props }, children);
    Component.displayName = name;
    return new Proxy(Component, {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        if (typeof prop === "symbol" || SPECIAL_KEYS.has(prop)) return undefined;
        return makeComponent(`${name}.${String(prop)}`);
      },
    });
  };
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "__esModule") return true;
        if (typeof prop === "symbol" || SPECIAL_KEYS.has(prop as string)) return undefined;
        return makeComponent(String(prop));
      },
      has: () => true,
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
const mockSetGoal = vi.fn().mockResolvedValue(undefined);
const mockCheckToday = vi.fn().mockResolvedValue({ date: "2026-08-17", pagesRead: 20, completed: true });
const mockLoadGoals = vi.fn().mockResolvedValue(undefined);
const mockResetStreakIfMissed = vi.fn();
const mockGrantBadge = vi.fn();

const sampleGoal = { id: "daily-reading", title: "매일 읽기", dailyTargetPages: 20 };
const sampleLog = { date: "2026-08-17", pagesRead: 20, completed: true };
const sampleBadge = {
  id: "streak-week",
  name: "일주일 연속 기록",
  description: "7일 연속으로 읽었어요",
  achievedAt: "2026-08-17",
};

function buildStoreState(overrides: Record<string, unknown> = {}) {
  return {
    goals: [sampleGoal],
    logs: [sampleLog],
    stats: {
      xp: 70,
      level: 1,
      streak: { current: 3, best: 5, lastCheckedDate: "2026-08-17" },
      badges: [sampleBadge],
    },
    loading: false,
    error: null,
    setGoal: mockSetGoal,
    checkToday: mockCheckToday,
    loadGoals: mockLoadGoals,
    resetStreakIfMissed: mockResetStreakIfMissed,
    grantBadge: mockGrantBadge,
    ...overrides,
  };
}

let mockStoreState = buildStoreState();

vi.mock("../store/useAppStore", () => ({
  useAppStore: () => mockStoreState,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetGoal.mockClear();
  mockCheckToday.mockClear();
  mockLoadGoals.mockClear();
  mockResetStreakIfMissed.mockClear();
  mockGrantBadge.mockClear();
  mockStoreState = buildStoreState();
});

afterEach(() => {
  cleanup();
});

describe("습관 트래커 화면 재구성: 금전 UI 제거 후 목표→체크→진행률→배지 흐름 완성", () => {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, "src");
  const pagesDir = path.join(srcDir, "pages");
  const componentsDir = path.join(srcDir, "components");

  function listFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFilesRecursive(fullPath) : [fullPath];
    });
  }

  // ============================================================================
  // AC-1: 금전 UI 컴포넌트/라우트 부재 + 새 4개 라우트 구성
  // ============================================================================

  it("AC-1[P0]: no deposit/payment/refund UI files exist, and the four new habit-tracker pages exist", () => {
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

    const requiredPages = ["Home.tsx", "Goal.tsx", "Stats.tsx", "Badges.tsx"];
    const existingPageNames = listFilesRecursive(pagesDir).map((file) => path.basename(file));
    requiredPages.forEach((page) => {
      expect(existingPageNames).toContain(page);
    });
  });

  it("AC-1[P0]: no page or component references deposit/stake/amount/payout/refund/prize route paths (would 404 once removed)", () => {
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

  it("AC-1[P0]: App.tsx defines exactly the four routes (/, /goal, /stats, /badges) and every navigate() target matches a defined Route", () => {
    const appPath = path.join(srcDir, "App.tsx");
    expect(fs.existsSync(appPath)).toBe(true);

    const appContent = fs.readFileSync(appPath, "utf-8");
    const definedRoutePaths = Array.from(appContent.matchAll(/path=["']([^"']+)["']/g)).map((m) => m[1]);

    ["/", "/goal", "/stats", "/badges"].forEach((expectedPath) => {
      expect(definedRoutePaths).toContain(expectedPath);
    });

    const allFiles = [...listFilesRecursive(pagesDir), ...listFilesRecursive(componentsDir), appPath];
    const navigateTargets = new Set<string>();
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      Array.from(content.matchAll(/navigate\(["']([^"']+)["']/g)).forEach((m) => navigateTargets.add(m[1]));
    });

    navigateTargets.forEach((target) => {
      expect(definedRoutePaths).toContain(target);
    });
  });

  // ============================================================================
  // AC-2: 금전·베팅 단어 전무
  // ============================================================================

  it("AC-2[P0]: zero occurrences of gambling/prize-money words (상금, 배팅, 베팅, 예치, 환급, 잃/따다) in pages and components", () => {
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

  it("AC-2[P0]: zero currency amount notations (₩ symbol or digit followed by 원) in pages and components", () => {
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

  it("AC-3[P0]: setting a daily goal on Goal screen saves it and navigates home by click alone (flow step 1→2)", async () => {
    const { default: Goal } = await import("../pages/Goal");
    render(React.createElement(MemoryRouter, null, React.createElement(Goal)));

    const goalInput = screen.getByTestId("goal-input");
    fireEvent.change(goalInput, { target: { value: "20" } });
    const submitButton = screen.getByTestId("goal-submit-button");
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(mockSetGoal).toHaveBeenCalledWith(
        expect.objectContaining({ dailyTargetPages: 20 })
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-3[P0]: checking off today's reading on Home records the result and shows the updated progress summary (flow step 2→3)", async () => {
    const { default: Home } = await import("../pages/Home");
    render(React.createElement(MemoryRouter, null, React.createElement(Home)));

    const checkButton = screen.getByTestId("today-check-button");
    fireEvent.click(checkButton);

    await waitFor(() => expect(mockCheckToday).toHaveBeenCalledWith(20));

    const progressSummary = screen.getByTestId("progress-summary");
    expect(progressSummary.textContent).toContain("3");
  });

  it("AC-3[P0]: Stats dashboard shows the concrete completion count/streak and links onward to the badge screen (flow step 3→4)", async () => {
    const { default: Stats } = await import("../pages/Stats");
    render(React.createElement(MemoryRouter, null, React.createElement(Stats)));

    const progressCard = screen.getByTestId("progress-card");
    expect(progressCard.textContent).toContain("5");

    const badgeLinkButtons = screen.getAllByTestId("view-badges-button");
    expect(badgeLinkButtons.length).toBe(1);
    fireEvent.click(badgeLinkButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/badges");
  });

  it("AC-3[P1]: Badges screen renders the earned badge collection ranked by streak/completion, not by money", async () => {
    const { default: Badges } = await import("../pages/Badges");
    render(React.createElement(MemoryRouter, null, React.createElement(Badges)));

    const badgeList = screen.getAllByTestId("badge-list");
    expect(badgeList.length).toBe(1);
    expect(badgeList[0].textContent).toContain(sampleBadge.name);
  });

  // ============================================================================
  // AC-3/AC-4: 라우팅·렌더링 런타임 에러 없이 모든 화면 정상 표시 (통합)
  // ============================================================================

  it("AC-4[P0]: App renders each of the four routes without throwing when data is present", async () => {
    const { default: App } = await import("../App");

    render(React.createElement(MemoryRouter, { initialEntries: ["/"] }, React.createElement(App)));
    expect(screen.getAllByTestId("today-check-button").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, { initialEntries: ["/goal"] }, React.createElement(App)));
    expect(screen.getAllByTestId("goal-form").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, { initialEntries: ["/stats"] }, React.createElement(App)));
    expect(screen.getAllByTestId("progress-card").length).toBe(1);
    cleanup();

    render(React.createElement(MemoryRouter, { initialEntries: ["/badges"] }, React.createElement(App)));
    expect(screen.getAllByTestId("badge-list").length).toBe(1);
  });

  it("AC-4[P0]: Home renders a crash-free empty state when there is no goal/history yet (edge case)", async () => {
    mockStoreState = buildStoreState({
      goals: [],
      logs: [],
      stats: { xp: 0, level: 1, streak: { current: 0, best: 0, lastCheckedDate: null }, badges: [] },
    });

    const { default: Home } = await import("../pages/Home");
    render(React.createElement(MemoryRouter, null, React.createElement(Home)));
    expect(screen.getAllByTestId("empty-state").length).toBeGreaterThanOrEqual(1);
  });

  // ============================================================================
  // AC-4: 타입체크 성공 (build/test 자체 실행은 CI 명령으로 별도 검증)
  // ============================================================================

  it("AC-4[P0]: npx tsc --noEmit reports zero errors", () => {
    try {
      execSync("npx tsc --noEmit", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect(true).toBe(true);
    } catch (error: any) {
      const stderr = error.stderr?.toString() || "";
      const stdout = error.stdout?.toString() || "";
      const combinedOutput = (stdout + stderr).trim();
      const tsErrors = combinedOutput.split("\n").filter((line: string) => line.includes("error TS"));
      expect(tsErrors, `TypeScript 컴파일 에러:\n${combinedOutput}`).toEqual([]);
    }
  });
});
