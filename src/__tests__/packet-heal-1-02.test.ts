import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Packet: 화면·문안 정화: 금전/베팅 표현을 목표달성 표현으로 교체
 *
 * ACs:
 * 1. 금액 입력 UI(숫자+원 단위)와 통화 포맷 유틸이 화면에서 완전히 제거됨
 * 2. 결과 화면이 달성률·연속일수·뱃지만 표시하고 금전 항목이 없음
 * 3. 비환금 고지 문구가 챌린지 생성/결과 화면에 렌더링됨
 * 4. 전체 화면 스냅샷/텍스트 검사에서 베팅성 어휘 0건
 *
 * 이 레포는 실제 렌더링 인프라(react/testing-library)가 아직 설치되어 있지 않으므로,
 * 기존 scripts/policy-lint.mjs와 동일한 방식(소스 텍스트 스캔)으로 화면 카피를 검증한다.
 */

const ROOT = process.cwd();

const FORM_PATH = path.join(ROOT, "src/components/ChallengeForm.tsx");
const RESULT_SUMMARY_PATH = path.join(ROOT, "src/components/ResultSummary.tsx");
const NEW_PAGE_PATH = path.join(ROOT, "src/app/challenge/new/page.tsx");
const DETAIL_PAGE_PATH = path.join(ROOT, "src/app/challenge/[id]/page.tsx");
const RESULT_PAGE_PATH = path.join(ROOT, "src/app/challenge/[id]/result/page.tsx");
const COPY_PATH = path.join(ROOT, "src/constants/copy.ts");

function readSource(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

describe("화면·문안 정화: 금전/베팅 표현을 목표달성 표현으로 교체", () => {
  // ============= AC-1: 금액 입력 UI + 통화 포맷 유틸 제거 =============

  describe("AC-1: 금액 입력 UI와 통화 포맷 유틸이 화면에서 완전히 제거됨", () => {
    it("AC-1[P0]: ChallengeForm.tsx는 숫자+원 단위 입력이나 '예치금' 문구를 포함하지 않아야 함", () => {
      const source = readSource(FORM_PATH);

      expect(source).not.toMatch(/\d+\s*원/);
      expect(source).not.toContain("예치금");
      expect(source).not.toContain("예치금 입력");
    });

    it("AC-1[P0]: copy.ts는 '예치금 입력' 대신 '목표 분량/기간 설정' 라벨을 export하고 통화 포맷 유틸이 없어야 함", async () => {
      const copy = await import("../constants/copy");

      expect(copy.GOAL_SETUP_LABEL).toBe("목표 분량/기간 설정");
      expect(copy.GOAL_SETUP_LABEL).not.toContain("예치금");

      const copySource = readSource(COPY_PATH);
      const formSource = readSource(FORM_PATH);
      expect(copySource).not.toMatch(/formatWon|formatCurrency/);
      expect(formSource).not.toMatch(/formatWon|formatCurrency/);
    });
  });

  // ============= AC-2: 결과 화면 항목 검증 =============

  describe("AC-2: 결과 화면이 달성률·연속일수·뱃지만 표시하고 금전 항목이 없음", () => {
    it("AC-2[P0]: ResultSummary.tsx는 달성률/연속기록/뱃지 관련 내용만 참조하고 정산/환급 문구가 없어야 함", () => {
      const source = readSource(RESULT_SUMMARY_PATH);

      expect(source).toMatch(/completionRate|달성률/);
      expect(source).toMatch(/streak|연속/);
      expect(source).toMatch(/badge|뱃지/i);
      expect(source).not.toContain("정산 내역");
      expect(source).not.toContain("환급");
    });

    it("AC-2: copy.ts의 결과 화면 타이틀은 '완독 리포트'이고 '정산 내역'이 아니어야 함", async () => {
      const copy = await import("../constants/copy");

      expect(copy.RESULT_REPORT_TITLE).toBe("완독 리포트");
      expect(copy.RESULT_REPORT_TITLE).not.toBe("정산 내역");
    });
  });

  // ============= AC-3: 비환금 고지 문구 =============

  describe("AC-3: 비환금 고지 문구가 챌린지 생성/결과 화면에 렌더링됨", () => {
    it("AC-3[P0]: copy.ts는 정확한 비환금 고지 문구를 NON_CASHABLE_NOTICE로 export해야 함", async () => {
      const copy = await import("../constants/copy");

      expect(copy.NON_CASHABLE_NOTICE).toBe(
        "앱 내 포인트는 현금 가치가 없으며 환전·출금할 수 없습니다"
      );
      expect(copy.NON_CASHABLE_NOTICE).toContain("현금 가치가 없으며");
    });

    it("AC-3[P0]: 챌린지 생성 화면과 결과 화면은 모두 NON_CASHABLE_NOTICE를 참조해야 함", () => {
      const newPageSource = readSource(NEW_PAGE_PATH);
      const resultPageSource = readSource(RESULT_PAGE_PATH);

      expect(newPageSource).toContain("NON_CASHABLE_NOTICE");
      expect(resultPageSource).toContain("NON_CASHABLE_NOTICE");
    });
  });

  // ============= AC-4: 베팅성 어휘 0건 전체 스캔 =============

  describe("AC-4: 전체 화면 텍스트 검사에서 베팅성 어휘 0건", () => {
    it("AC-4[P0]: 챌린지 관련 신규 화면·컴포넌트·카피 파일 전체에서 베팅성 어휘가 0건이어야 함", () => {
      const forbiddenTerms = ["걸다", "배팅", "베팅", "상금", "판돈", "환급"];
      const targetFiles = [
        FORM_PATH,
        RESULT_SUMMARY_PATH,
        NEW_PAGE_PATH,
        DETAIL_PAGE_PATH,
        RESULT_PAGE_PATH,
        COPY_PATH,
      ];

      const hits: string[] = [];
      for (const filePath of targetFiles) {
        const source = readSource(filePath);
        for (const term of forbiddenTerms) {
          if (source.includes(term)) {
            hits.push(`${path.relative(ROOT, filePath)}:${term}`);
          }
        }
      }

      expect(hits).toEqual([]);
      expect(hits.length).toBe(0);
    });
  });
});
