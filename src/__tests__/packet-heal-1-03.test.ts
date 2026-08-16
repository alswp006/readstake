import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * 정책 자가검증 가드 추가(사행성/금융 표현 차단)
 *
 * AC-1: npm run build 실행 시 policy-check가 선행 실행되고 위반 0건으로 통과
 * AC-2: 금지 단어를 임의로 삽입하면 빌드가 exit 1로 실패함
 * AC-3: 설정 화면에 비금전 서비스 안내 문구가 노출됨
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

beforeEach(() => {
  mockNavigate.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("정책 자가검증 가드 추가(사행성/금융 표현 차단)", () => {
  const projectRoot = process.cwd();
  const scriptPath = path.join(projectRoot, "scripts", "policy-check.mjs");
  const packageJsonPath = path.join(projectRoot, "package.json");
  const tempViolationFile = path.join(projectRoot, "src", "lib", "__policy_check_temp_violation.ts");

  afterEach(() => {
    if (fs.existsSync(tempViolationFile)) {
      fs.unlinkSync(tempViolationFile);
    }
  });

  // ============================================================================
  // AC-1: build 스크립트에 policy-check가 선행 연결되고, 현재 코드베이스는 위반 0건
  // ============================================================================

  it("AC-1[P0]: package.json build/prebuild script should invoke scripts/policy-check.mjs", () => {
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const buildScript: string = pkg.scripts?.build ?? "";
    const prebuildScript: string = pkg.scripts?.prebuild ?? "";
    const wiredToBuild =
      buildScript.includes("policy-check") || prebuildScript.includes("policy-check");

    expect(wiredToBuild).toBe(true);
    expect(buildScript.length > 0 || prebuildScript.length > 0).toBe(true);
  });

  it("AC-1[P0]: running scripts/policy-check.mjs against the current clean codebase exits 0 with no violations", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    let exitCode = 0;
    let stdout = "";
    try {
      stdout = execFileSync("node", [scriptPath], {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: any) {
      exitCode = typeof error.status === "number" ? error.status : 1;
      stdout = (error.stdout || "") + (error.stderr || "");
    }

    expect(exitCode).toBe(0);
    expect(stdout).not.toMatch(/위반|violation/i);
  });

  // ============================================================================
  // AC-2: 금지 단어 삽입 시 exit 1로 빌드 실패
  // ============================================================================

  it("AC-2[P0]: inserting a forbidden gambling/financial word makes policy-check exit 1", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    fs.writeFileSync(
      tempViolationFile,
      `export const violation = "이 챌린지는 상금과 배팅을 지원하는 예치 기반 정산 서비스입니다";\n`,
      "utf-8"
    );

    let exitCode = 0;
    try {
      execFileSync("node", [scriptPath], {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: any) {
      exitCode = typeof error.status === "number" ? error.status : 1;
    }

    expect(exitCode).toBe(1);
  });

  it("AC-2[P0]: inserting a KRW-style currency amount (e.g. 5,000원) or a forbidden identifier (deposit/stake/payout/prizePool/wager) makes policy-check exit 1", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    fs.writeFileSync(
      tempViolationFile,
      `export const depositAmount = 5000;\nexport const label = "5,000원 캐시백 충전 완료, 원금 송금 처리";\n`,
      "utf-8"
    );

    let exitCode = 0;
    try {
      execFileSync("node", [scriptPath], {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: any) {
      exitCode = typeof error.status === "number" ? error.status : 1;
    }

    expect(exitCode).toBe(1);
  });

  // ============================================================================
  // AC-3: 설정 화면에 비금전 서비스 안내 문구 노출
  // ============================================================================

  it("AC-3[P0]: Settings screen renders a notice that the service gives no monetary reward", async () => {
    const Settings = (await import("../pages/Settings")).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Settings)));

    const notice = screen.getByTestId("non-financial-notice");
    expect(notice.textContent).toContain("금전 보상이 없는");
    expect(notice.textContent).toContain("기록");
  });

  it("AC-3[P1]: Settings screen renders without crashing and exposes exactly one non-financial notice", async () => {
    const Settings = (await import("../pages/Settings")).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Settings)));

    expect(screen.getAllByTestId("non-financial-notice").length).toBe(1);
  });
});
