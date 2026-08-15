import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Packet: 화면 문안 정화 + 자기참조 없는 정책 린트 연결 (heal-1-02 + heal-1-03 통합)
 *
 * ACs:
 * 1. 금액 입력 UI / 통화 포맷 유틸 완전 제거, 결과 화면은 달성률·연속일수·뱃지만 표시
 * 2. 비환금 고지 문구가 챌린지 생성/결과 화면에 렌더링됨
 * 3. `npm run policy-lint`가 현재 코드베이스에서 exit 0 (자기 사전 자기검출 실패 없음)
 * 4. 금지 키워드를 포함한 픽스처 투입 시 exit 1과 위반 파일:라인 출력
 * 5. 챌린지 생성 API가 금지 키워드 포함 입력을 400으로 거부
 * 6. prebuild 연결 후 typecheck·policy-lint(prebuild) 게이트가 모두 통과
 */

const ROOT = process.cwd();
const LINT_SCRIPT = path.join(ROOT, "scripts", "policy-lint.mjs");

const FORM_PATH = path.join(ROOT, "src/components/ChallengeForm.tsx");
const RESULT_SUMMARY_PATH = path.join(ROOT, "src/components/ResultSummary.tsx");
const NEW_PAGE_PATH = path.join(ROOT, "src/app/challenge/new/page.tsx");
const RESULT_PAGE_PATH = path.join(ROOT, "src/app/challenge/[id]/result/page.tsx");
const COPY_PATH = path.join(ROOT, "src/constants/copy.ts");

function readSource(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

function runPolicyLint(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(process.execPath, [LINT_SCRIPT], {
      cwd: ROOT,
      encoding: "utf-8",
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error: any) {
    return {
      status: typeof error.status === "number" ? error.status : 1,
      stdout: String(error.stdout ?? ""),
      stderr: String(error.stderr ?? ""),
    };
  }
}

describe("화면 문안 정화 + 자기참조 없는 정책 린트 연결", () => {
  // ============= AC-1: 금액 입력 UI + 통화 포맷 유틸 완전 제거 =============

  describe("AC-1: 금액 입력 UI와 통화 포맷 유틸이 완전히 제거되고 결과 화면은 달성률·연속일수·뱃지만 표시", () => {
    it("AC-1[P0]: 어떤 소스 파일에도 통화 포맷 유틸(formatWon/formatCurrency)이나 원화 기호가 없어야 함", () => {
      const targets = [FORM_PATH, RESULT_SUMMARY_PATH, NEW_PAGE_PATH, RESULT_PAGE_PATH, COPY_PATH];

      for (const filePath of targets) {
        const source = readSource(filePath);
        expect(source).not.toMatch(/formatWon|formatCurrency|toLocaleString|Intl\.NumberFormat/);
        expect(source).not.toMatch(/₩/);
        expect(source).not.toMatch(/\d+\s*원(?!고)/);
      }
    });

    it("AC-1[P0]: ResultSummaryData는 달성률·연속기록·뱃지·포인트 필드만 갖고 금액/정산 필드가 없어야 함", async () => {
      const resultSummaryModule = readSource(RESULT_SUMMARY_PATH);

      expect(resultSummaryModule).toMatch(/completionRate/);
      expect(resultSummaryModule).toMatch(/streak/i);
      expect(resultSummaryModule).toMatch(/badges/);
      expect(resultSummaryModule).not.toMatch(/amount|balance|payout|settlement|정산/i);
    });
  });

  // ============= AC-2: 비환금 고지 문구 렌더링 =============

  describe("AC-2: 비환금 고지 문구가 챌린지 생성/결과 화면에 렌더링됨", () => {
    it("AC-2[P0]: 챌린지 생성 화면 콘텐츠는 정확한 NON_CASHABLE_NOTICE 문구를 notice로 노출해야 함", async () => {
      const { CHALLENGE_NEW_PAGE_CONTENT } = await import("../app/challenge/new/page");
      const { NON_CASHABLE_NOTICE } = await import("../constants/copy");

      expect(CHALLENGE_NEW_PAGE_CONTENT.notice).toBe(NON_CASHABLE_NOTICE);
      expect(CHALLENGE_NEW_PAGE_CONTENT.notice).toBe(
        "앱 내 포인트는 현금 가치가 없으며 환전·출금할 수 없습니다"
      );
    });

    it("AC-2[P0]: 완독 리포트(결과) 화면 콘텐츠는 정확한 NON_CASHABLE_NOTICE 문구를 notice로 노출해야 함", async () => {
      const { buildResultPageContent } = await import("../app/challenge/[id]/result/page");
      const { NON_CASHABLE_NOTICE } = await import("../constants/copy");

      const content = buildResultPageContent(
        { participantId: "p-1", status: "completed", completionRate: 1, pointsAwarded: 500, badge: "완독뱃지" },
        { currentStreakDays: 3, longestStreakDays: 5 }
      );

      expect(content.notice).toBe(NON_CASHABLE_NOTICE);
      expect(content.summary.completionRate).toBe(1);
      expect(content.summary.badges).toEqual(["완독뱃지"]);
    });
  });

  // ============= AC-3: policy-lint 현재 코드베이스에서 exit 0 =============

  describe("AC-3: npm run policy-lint가 현재 코드베이스에서 exit 0 (자기 사전 자기검출 실패 없음)", () => {
    it("AC-3[P0]: scripts/policy-lint.mjs를 현재 코드베이스에서 실행하면 exit 0이어야 함", () => {
      const result = runPolicyLint();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("통과");
    });

    it("AC-3[P0]: 비환금 고지 문구(NON_CASHABLE_NOTICE) 자체가 정책 위반으로 검출되지 않아야 함", () => {
      const result = runPolicyLint();

      expect(result.stderr).not.toContain("copy.ts");
      expect(result.status).toBe(0);
    });
  });

  // ============= AC-4: 금지 키워드 픽스처 투입 시 exit 1 + 파일:라인 출력 =============

  describe("AC-4: 금지 키워드를 포함한 픽스처 투입 시 exit 1과 위반 파일:라인 출력", () => {
    const probeFilePath = path.join(ROOT, "src", "lib", "challenge", "__policyLintProbe.ts");

    afterEach(() => {
      if (existsSync(probeFilePath)) {
        rmSync(probeFilePath);
      }
    });

    it("AC-4[P0]: 금지 키워드(도박)를 포함한 파일을 스캔 대상에 두면 exit 1과 파일:라인 위반 정보를 출력해야 함", () => {
      writeFileSync(
        probeFilePath,
        ["// temp fixture for policy-lint test", 'export const probe = "도박 관련 문구";', ""].join("\n")
      );

      const result = runPolicyLint();

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("__policyLintProbe.ts:2");
      expect(result.stderr).toContain("도박");
    });

    it("AC-4[P0]: 픽스처를 제거하면 다시 exit 0으로 돌아와야 함", () => {
      writeFileSync(probeFilePath, 'export const probe = "베팅 문구";\n');
      expect(runPolicyLint().status).toBe(1);

      rmSync(probeFilePath);

      expect(runPolicyLint().status).toBe(0);
    });
  });

  // ============= AC-5: 챌린지 생성 API 금지 키워드 400 거부 =============

  describe("AC-5: 챌린지 생성 API가 금지 키워드 포함 입력을 400으로 거부", () => {
    it("AC-5[P0]: 제목에 금지 키워드(도박)가 있으면 400과 위반 키워드 목록을 반환해야 함", async () => {
      const { POST } = await import("../app/api/challenge/route");

      const request = new Request("http://localhost/api/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "도박 챌린지", description: "완독하면 뱃지를 드립니다" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.keywords).toContain("도박");
      expect(body.fields).toEqual(["title"]);
    });

    it("AC-5[P0]: 제목/설명이 모두 깨끗하면 201로 챌린지를 생성해야 함", async () => {
      const { POST } = await import("../app/api/challenge/route");

      const request = new Request("http://localhost/api/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "책 완독 챌린지", description: "30일간 완독하기" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.title).toBe("책 완독 챌린지");
    });
  });

  // ============= AC-6: prebuild 연결 후 typecheck/policy-lint 게이트 통과 =============

  describe("AC-6: prebuild 연결 후 typecheck·policy-lint(prebuild) 게이트가 모두 통과", () => {
    it("AC-6[P0]: package.json의 prebuild 스크립트는 policy-lint를 실행하도록 연결돼 있어야 함", () => {
      const packageJson = JSON.parse(readSource(path.join(ROOT, "package.json")));

      expect(packageJson.scripts.prebuild).toBe("npm run policy-lint");
      expect(packageJson.scripts["policy-lint"]).toBe("node scripts/policy-lint.mjs");
    });

    it("AC-6[P0]: npm run typecheck와 npm run prebuild가 모두 exit 0으로 통과해야 함", () => {
      expect(() =>
        execFileSync("npm", ["run", "typecheck"], { cwd: ROOT, encoding: "utf-8" })
      ).not.toThrow();

      expect(() =>
        execFileSync("npm", ["run", "prebuild"], { cwd: ROOT, encoding: "utf-8" })
      ).not.toThrow();
    });
  });
});
