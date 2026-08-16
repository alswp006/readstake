import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * 정책 셀프체크 스크립트 추가(순수 정적 검사, 실행 범위 최소화)
 *
 * AC-1: node scripts/policy-check.mjs가 위반 0건으로 exit 0
 * AC-2: npm run build 시 prebuild로 policy-check가 선행 실행되고 빌드 성공
 * AC-3: 금지 단어를 임시 삽입하면 위반 위치가 출력되며 exit 1로 빌드가 중단됨(삽입 코드는 원복)
 * AC-4: 설정 화면 하단에 비금전 서비스 안내 문구가 노출되고 tsc 오류 없음
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

beforeEach(() => {
  mockNavigate.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("정책 셀프체크 스크립트 추가(순수 정적 검사, 실행 범위 최소화)", () => {
  const projectRoot = process.cwd();
  const scriptPath = path.join(projectRoot, "scripts", "policy-check.mjs");
  const packageJsonPath = path.join(projectRoot, "package.json");
  const tempViolationFile = path.join(projectRoot, "src", "lib", "__policy_check_temp_violation.ts");
  const tempIndexHtml = path.join(projectRoot, "index.html");
  let createdIndexHtml = false;

  function runPolicyCheck() {
    let exitCode = 0;
    let output = "";
    try {
      output = execFileSync("node", [scriptPath], {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: any) {
      exitCode = typeof error.status === "number" ? error.status : 1;
      output = (error.stdout || "") + (error.stderr || "");
    }
    return { exitCode, output };
  }

  afterEach(() => {
    if (fs.existsSync(tempViolationFile)) {
      fs.unlinkSync(tempViolationFile);
    }
    if (createdIndexHtml && fs.existsSync(tempIndexHtml)) {
      fs.unlinkSync(tempIndexHtml);
      createdIndexHtml = false;
    }
  });

  // ============================================================================
  // AC-1: 위반 0건으로 exit 0
  // ============================================================================

  it("AC-1[P0]: scripts/policy-check.mjs exists and running it on the clean codebase exits 0", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    const { exitCode, output } = runPolicyCheck();

    expect(exitCode).toBe(0);
    expect(output).toContain("policy-check: OK");
  });

  it("AC-1[P0]: policy-check does not scan excluded directories (node_modules/dist/.git)", () => {
    const distDir = path.join(projectRoot, "dist");
    const distExistedBefore = fs.existsSync(distDir);
    if (!distExistedBefore) fs.mkdirSync(distDir);
    const tempDistFile = path.join(distDir, "__policy_check_temp_violation.ts");
    fs.writeFileSync(tempDistFile, `export const violation = "상금 배팅 예치";\n`, "utf-8");

    try {
      const { exitCode } = runPolicyCheck();
      expect(exitCode).toBe(0);
    } finally {
      fs.unlinkSync(tempDistFile);
      if (!distExistedBefore) fs.rmdirSync(distDir);
    }
  });

  // ============================================================================
  // AC-2: npm run build 시 prebuild로 policy-check가 선행 실행되고 빌드 성공
  // ============================================================================

  it("AC-2[P0]: package.json wires prebuild/policy-check scripts to run before build", () => {
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(pkg.scripts?.prebuild).toContain("policy-check");
    expect(pkg.scripts?.["policy:check"] ?? pkg.scripts?.["policy-check"]).toContain("scripts/policy-check.mjs");
  });

  it(
    "AC-2[P0]: npm run build runs policy-check first and completes the production build successfully",
    () => {
      let exitCode = 0;
      let output = "";
      try {
        output = execFileSync("npm", ["run", "build"], {
          cwd: projectRoot,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error: any) {
        exitCode = typeof error.status === "number" ? error.status : 1;
        output = (error.stdout || "") + (error.stderr || "");
      }

      expect(output).toContain("policy-check: OK");
      expect(exitCode).toBe(0);
    },
    60_000
  );

  // ============================================================================
  // AC-3: 금지 단어 삽입 시 위반 위치 출력 + exit 1, 삽입 코드 원복
  // ============================================================================

  it("AC-3[P0]: inserting a forbidden gambling/financial word prints the violating file:line and exits 1", () => {
    fs.writeFileSync(
      tempViolationFile,
      `export const violation = "이 챌린지는 상금과 배팅을 지원하는 예치 기반 정산 서비스입니다";\n`,
      "utf-8"
    );

    const { exitCode, output } = runPolicyCheck();

    expect(exitCode).toBe(1);
    expect(output).toContain("__policy_check_temp_violation.ts");
    expect(output).toMatch(/:\d+/);

    fs.unlinkSync(tempViolationFile);
    expect(fs.existsSync(tempViolationFile)).toBe(false);
  });

  it("AC-3[P0]: inserting a KRW-style currency amount or forbidden identifier (deposit/stake/payout/prizePool/wager/settlement/refund) exits 1", () => {
    fs.writeFileSync(
      tempViolationFile,
      `export const depositAmount = 5000;\nexport const label = "5,000원 캐시백 충전 완료, 원금 송금 처리";\n`,
      "utf-8"
    );

    const { exitCode } = runPolicyCheck();

    expect(exitCode).toBe(1);

    fs.unlinkSync(tempViolationFile);
    expect(fs.existsSync(tempViolationFile)).toBe(false);
  });

  // ============================================================================
  // AC-4: 설정 화면 하단에 비금전 서비스 안내 문구 노출 + tsc 오류 없음
  // ============================================================================

  it("AC-4[P0]: Settings screen renders a non-financial service notice at the bottom", async () => {
    const Settings = (await import("../pages/Settings")).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Settings)));

    const notice = screen.getByTestId("non-financial-notice");
    expect(notice.textContent).toContain("금전 보상이 없는");
    expect(notice.textContent).toContain("기록");
  });

  it(
    "AC-4[P0]: npx tsc --noEmit reports zero TypeScript errors",
    () => {
      let exitCode = 0;
      let output = "";
      try {
        output = execFileSync("npx", ["tsc", "--noEmit"], {
          cwd: projectRoot,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error: any) {
        exitCode = typeof error.status === "number" ? error.status : 1;
        output = (error.stdout || "") + (error.stderr || "");
      }

      expect(exitCode).toBe(0);
      expect(output).not.toMatch(/error TS\d+/);
    },
    30_000
  );
});
