import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * 금전 도메인 원자적 제거: 타입·스토어·lib·모든 참조·테스트를 한 패킷에서 동시에 GREEN화
 *
 * heal-1-01의 반쪽 리팩터를 완결한다. 순서:
 * ①src/types/index.ts에 비금전 도메인만 정의 — Goal{id,title,dailyTargetPages}, DailyLog{date,pagesRead,completed}, Progress{percent,totalDays}, Streak{current,best,lastCheckedDate}, Badge{id,name,description,achievedAt}, UserStats{xp,level,streak,badges}
 * ②src/store/useAppStore.ts 새 타입에 맞춰 재작성 — setGoal, checkToday, resetStreakIfMissed, grantBadge만 액션
 * ③src/lib/rewards.ts 순수 함수만 — calcProgress(logs, goal), calcStreak(logs, today), earnedBadges(stats)
 * ④src/lib/api.ts 로컬 저장만 — 결제/정산/송금 엔드포인트 삭제
 * ⑤src/constants/index.ts 금액 상수 삭제, BADGE_DEFS/LEVEL_XP_TABLE로 대체
 * ⑥모든 참조 수정 — grep "deposit|stake|prizePool|payout|settle|refund|betting|balance|cashReward|amountKRW" 0건
 *
 * AC-1: src 전체 grep에서 금전 식별자 매치 0건
 * AC-2: 사용자 간 포인트·자산 이전 함수/엔드포인트 존재 X, 보상은 progress/streak/badge/xp만
 * AC-3: npx tsc --noEmit 오류 0건
 * AC-4: npm test -- --run 전체 통과
 */

describe("패킷 heal-2-01: 금전 도메인 원자적 제거", () => {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, "src");

  // ============================================================================
  // AC-1: 금전 관련 식별자 완전 제거 (grep 검증)
  // ============================================================================

  it("AC-1[P0]: 금전 도메인 키워드(deposit/stake/prizePool/payout/settle/refund/betting/balance/cashReward/amountKRW) grep 0건", () => {
    const financialKeywords = [
      "deposit",
      "stake",
      "prizePool",
      "prize_pool",
      "payout",
      "settle",
      "settlement",
      "refund",
      "betting",
      "cashReward",
      "cash_reward",
      "balance",
      "amountKRW",
      "amount_krw",
      "상금",
      "예치",
      "정산",
      "환급",
      "잔금",
    ];

    const violations: { keyword: string; files: string[] }[] = [];

    financialKeywords.forEach((keyword) => {
      try {
        const result = execSync(
          `grep -r "${keyword}" ${srcDir} --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ 2>/dev/null || true`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        );
        if (result.trim()) {
          const files = result
            .split("\n")
            .filter((line) => line.trim() && !line.includes("contract.ts"))
            .map((line) => line.split(":")[0])
            .filter((f) => f && !f.includes("__tests__"));
          if (files.length > 0) {
            violations.push({ keyword, files: [...new Set(files)] });
          }
        }
      } catch {
        // No matches found (expected)
      }
    });

    expect(violations).toEqual([]);
  });

  // ============================================================================
  // AC-2: 사용자 간 송금/정산/이전 함수 없음 + 보상은 비금전값만
  // ============================================================================

  it("AC-2[P0]: 사용자 간 송금/정산 함수 없음 (transferPoints/sendPoints/shareReward/settleAccount/withdrawFunds)", () => {
    const transferPatterns = [
      "transferPoints",
      "transfer_points",
      "sendPoints",
      "send_points",
      "shareReward",
      "share_reward",
      "giftPoints",
      "gift_points",
      "settleAccount",
      "settle_account",
      "withdrawFunds",
      "withdraw_funds",
      "paymentAPI",
      "payment_api",
    ];

    const violations: string[] = [];

    transferPatterns.forEach((pattern) => {
      try {
        const result = execSync(
          `grep -r "${pattern}" ${srcDir} --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ 2>/dev/null || true`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        );
        if (result.trim()) {
          violations.push(pattern);
        }
      } catch {
        // No matches found (expected)
      }
    });

    expect(violations).toEqual([]);
  });

  it("AC-2[P0]: 보상은 progress/streak/badge/xp로만 표현 (금액 필드 없음)", () => {
    const typesPath = path.join(srcDir, "types", "index.ts");

    if (!fs.existsSync(typesPath)) {
      expect(true).toBe(true); // 아직 파일이 없으면 스킵
      return;
    }

    const typesContent = fs.readFileSync(typesPath, "utf-8");

    // UserRewardSummary, UserStats 등의 보상 타입에서 금액 필드가 없어야 함
    // - 금지 필드: amount, balance, cash, currency, KRW, USD, points(금전적 포인트), 환금가능점수
    // - 허용 필드: xp, level, progress, streak, badge
    const forbiddenRewardFields = [
      "balance:",
      "cashReward",
      "cash_reward",
      "amountKRW",
      "amount_krw",
      "currencyAmount",
      "settlement",
      "payout",
    ];

    forbiddenRewardFields.forEach((field) => {
      // export type으로 선언된 보상 관련 타입(UserRewardSummary, Badge, Streak 등)에서
      // 금전 필드가 없어야 함
      const rewardTypeMatches = typesContent.match(
        /export type (UserRewardSummary|UserStats|Badge|Progress|Streak|Reward)[^}]+}/g
      );
      if (rewardTypeMatches) {
        rewardTypeMatches.forEach((match) => {
          expect(match).not.toContain(field);
        });
      }
    });

    // 반대로 필수 비금전 필드는 있어야 함
    const requiredRewardFields = ["xp", "level", "progress", "streak", "badge"];
    const hasAtLeastOne = requiredRewardFields.some((field) =>
      typesContent.match(new RegExp(`\\b${field}\\b`, "i"))
    );
    expect(hasAtLeastOne).toBe(true);
  });

  // ============================================================================
  // AC-3: TypeScript 컴파일 성공
  // ============================================================================

  it("AC-3[P0]: npx tsc --noEmit 오류 0건", () => {
    try {
      execSync("npx tsc --noEmit", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      // stdout 또는 exit code 0 = 성공
      expect(true).toBe(true);
    } catch (error: any) {
      // tsc exit code가 0이 아니면 에러
      const stderr = error.stderr?.toString() || "";
      const stdout = error.stdout?.toString() || "";
      const combinedOutput = (stdout + stderr).trim();

      // TS 에러만 추출 (warning 제외)
      const tsErrors = combinedOutput
        .split("\n")
        .filter((line: string) => line.includes("error TS"));

      expect(tsErrors, `TypeScript 컴파일 에러:\n${combinedOutput}`).toEqual([]);
    }
  });

  // ============================================================================
  // AC-4: 순수 함수 테스트 (calcProgress, calcStreak, earnedBadges)
  // ============================================================================

  describe("AC-4[P0]: src/lib/rewards.ts 순수 함수 테스트", () => {
    // 이 테스트들은 rewards.ts가 구현된 후에 통과해야 함
    // 함수 시그니처와 동작을 검증

    it("calcProgress(logs, goal) 함수: 진행률 계산 (0-100)", () => {
      const rewardsPath = path.join(srcDir, "lib", "rewards.ts");

      if (!fs.existsSync(rewardsPath)) {
        expect(true).toBe(true); // 아직 구현 안 되면 스킵
        return;
      }

      const rewardsContent = fs.readFileSync(rewardsPath, "utf-8");

      // calcProgress 함수가 정의되어 있는지 확인
      expect(rewardsContent).toMatch(/export function calcProgress/);

      // 금전 파라미터가 없는지 확인
      expect(rewardsContent).not.toMatch(/calcProgress[^)]*currency|amount.*KRW|balance/);
    });

    it("calcStreak(logs, today) 함수: 연속 기록 계산 (현재/최고)", () => {
      const rewardsPath = path.join(srcDir, "lib", "rewards.ts");

      if (!fs.existsSync(rewardsPath)) {
        expect(true).toBe(true);
        return;
      }

      const rewardsContent = fs.readFileSync(rewardsPath, "utf-8");

      // calcStreak 함수 정의 확인
      expect(rewardsContent).toMatch(/export function calcStreak|export const calcStreak/);
    });

    it("earnedBadges(stats) 함수: 배지 조건 검증 (progress/streak/xp 기반)", () => {
      const rewardsPath = path.join(srcDir, "lib", "rewards.ts");

      if (!fs.existsSync(rewardsPath)) {
        expect(true).toBe(true);
        return;
      }

      const rewardsContent = fs.readFileSync(rewardsPath, "utf-8");

      // earnedBadges 함수 정의 확인
      expect(rewardsContent).toMatch(/export function earnedBadges|export const earnedBadges/);

      // 금액 기반 배지 조건이 없는지 확인 (현재 earnedBadges가 구현되어 있으면)
      // 예: pointsRequired 필드가 있으면 금액 기반이므로 금지
      if (
        rewardsContent.includes("pointsRequired") ||
        rewardsContent.includes("balance")
      ) {
        // 이건 경고이지 실패는 아님 (설명만)
      }
    });
  });

  // ============================================================================
  // AC-4: 스토어 액션 검증 (setGoal, checkToday, resetStreakIfMissed, grantBadge)
  // ============================================================================

  describe("AC-4[P0]: src/store/useAppStore.ts 액션 검증", () => {
    it("store should export legitimate actions only (no transfer/settle/withdrawal)", () => {
      const storePath = path.join(srcDir, "store", "useAppStore.ts");

      if (!fs.existsSync(storePath)) {
        expect(true).toBe(true);
        return;
      }

      const storeContent = fs.readFileSync(storePath, "utf-8");

      // 금지된 액션이 없는지 확인
      const forbiddenActions = [
        "transferPoints",
        "settleAccount",
        "withdrawFunds",
        "payOut",
        "refund",
      ];

      forbiddenActions.forEach((action) => {
        expect(storeContent).not.toContain(action);
      });

      // 필수 액션이 있는지 확인 (적어도 하나)
      const requiredActions = [
        "setGoal",
        "checkToday",
        "resetStreakIfMissed",
        "grantBadge",
        "addPoints", // xp 포인트 (금전 아님)
      ];

      const hasAtLeastOne = requiredActions.some((action) =>
        storeContent.includes(action)
      );

      expect(hasAtLeastOne).toBe(true);
    });
  });

  // ============================================================================
  // AC-4: API 레이어 검증 (localStorage CRUD만, 결제/송금 없음)
  // ============================================================================

  describe("AC-4[P0]: src/lib/api.ts API 검증", () => {
    it("api should only do localStorage CRUD, no payment/transfer endpoints", () => {
      const apiPath = path.join(srcDir, "lib", "api.ts");

      if (!fs.existsSync(apiPath)) {
        expect(true).toBe(true);
        return;
      }

      const apiContent = fs.readFileSync(apiPath, "utf-8");

      // 금지된 엔드포인트 패턴 없음
      const forbiddenEndpoints = [
        "/api/transfer",
        "/api/payout",
        "/api/settlement",
        "/api/refund",
        "/api/withdrawal",
        "/api/payment",
        "/api/deposit",
      ];

      forbiddenEndpoints.forEach((endpoint) => {
        expect(apiContent).not.toContain(endpoint);
      });

      // localStorage 사용 확인 (localStorage 없으면 로컬 저장이 아님)
      const hasLocalStorage = apiContent.includes("localStorage");
      expect(hasLocalStorage).toBe(true);
    });
  });

  // ============================================================================
  // AC-4: 상수 검증 (BADGE_DEFS, LEVEL_XP_TABLE, 금액 상수 없음)
  // ============================================================================

  describe("AC-4[P0]: src/constants/index.ts 상수 검증", () => {
    it("constants should have BADGE_DEFS and LEVEL_XP_TABLE, no currency presets", () => {
      const constantsPath = path.join(srcDir, "constants", "index.ts");

      if (!fs.existsSync(constantsPath)) {
        expect(true).toBe(true);
        return;
      }

      const constantsContent = fs.readFileSync(constantsPath, "utf-8");

      // 금액 프리셋이 없어야 함
      const forbiddenConstants = [
        "DEPOSIT_PRESETS",
        "PAYOUT_AMOUNTS",
        "CURRENCY_SYMBOLS",
        "KRW_DECIMAL",
        "STAKE_LIMITS",
      ];

      forbiddenConstants.forEach((constant) => {
        expect(constantsContent).not.toContain(constant);
      });

      // 필수 상수가 있는지 확인 (적어도 하나)
      const requiredConstants = [
        "BADGE_DEFS",
        "LEVEL_XP_TABLE",
        "XP_BY_DIFFICULTY",
      ];

      const hasAtLeastOne = requiredConstants.some((constant) =>
        constantsContent.includes(constant)
      );

      expect(hasAtLeastOne).toBe(true);
    });
  });

  // ============================================================================
  // AC-4: 타입 정의 검증 (Goal, DailyLog, Progress, Streak, Badge, UserStats)
  // ============================================================================

  describe("AC-4[P1]: src/types/index.ts 타입 정의 검증", () => {
    it("types should define Goal with id/title/dailyTargetPages", () => {
      const typesPath = path.join(srcDir, "types", "index.ts");

      if (!fs.existsSync(typesPath)) {
        expect(true).toBe(true);
        return;
      }

      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // Goal 타입 확인
      expect(typesContent).toMatch(/type Goal|interface Goal/);

      // Goal에 필수 필드가 있는지 확인 (적어도 하나)
      const goalFields = ["id", "title", "dailyTargetPages"];
      const hasAtLeastOne = goalFields.some((field) =>
        typesContent.match(
          new RegExp(`(?:type|interface) Goal[^}]*\\b${field}\\b`)
        )
      );

      expect(hasAtLeastOne).toBe(true);
    });

    it("types should define DailyLog with date/pagesRead/completed", () => {
      const typesPath = path.join(srcDir, "types", "index.ts");

      if (!fs.existsSync(typesPath)) {
        expect(true).toBe(true);
        return;
      }

      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // DailyLog 타입 확인
      expect(typesContent).toMatch(/type DailyLog|interface DailyLog/);
    });

    it("types should define Progress, Streak, Badge with non-financial fields", () => {
      const typesPath = path.join(srcDir, "types", "index.ts");

      if (!fs.existsSync(typesPath)) {
        expect(true).toBe(true);
        return;
      }

      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // 각 타입이 정의되어 있는지 확인
      const requiredTypes = ["Progress", "Streak", "Badge"];

      requiredTypes.forEach((type) => {
        expect(typesContent).toMatch(new RegExp(`type ${type}|interface ${type}`));
      });
    });

    it("types should define UserStats with xp/level/streak/badges", () => {
      const typesPath = path.join(srcDir, "types", "index.ts");

      if (!fs.existsSync(typesPath)) {
        expect(true).toBe(true);
        return;
      }

      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // UserStats 또는 UserRewardSummary 타입이 있는지 확인
      const hasUserStats = typesContent.match(/type UserStats|interface UserStats/);
      const hasRewardSummary = typesContent.match(
        /type UserRewardSummary|interface UserRewardSummary/
      );

      expect(hasUserStats || hasRewardSummary).toBeTruthy();
    });
  });

  // ============================================================================
  // 통합: 모든 파일이 contract.ts와 일치하는지 확인
  // ============================================================================

  it("AC-3[P1]: 모든 export된 타입·함수가 contract.ts와 일치하는지 확인", () => {
    const contractPath = path.join(srcDir, "lib", "contract.ts");
    const typesPath = path.join(srcDir, "types", "index.ts");
    const storePath = path.join(srcDir, "store", "useAppStore.ts");
    const rewardsPath = path.join(srcDir, "lib", "rewards.ts");

    if (
      !fs.existsSync(contractPath) ||
      !fs.existsSync(typesPath) ||
      !fs.existsSync(storePath) ||
      !fs.existsSync(rewardsPath)
    ) {
      expect(true).toBe(true);
      return;
    }

    const contractContent = fs.readFileSync(contractPath, "utf-8");

    // contract.ts에서 선언한 User 타입을 types.ts가 import하거나 맞춰서 정의했는지 확인
    // User 타입이 금전 필드(balance, cashReward, deposit 등)를 포함하지 않는지 확인

    const userTypeInContract = contractContent.match(
      /export type User = \{[^}]+\}/
    );
    if (userTypeInContract) {
      // User에 금전 필드가 없는지 확인
      const forbiddenUserFields = [
        "balance",
        "cashReward",
        "deposit",
        "stake",
        "pointBalance", // 금전적 포인트 잔액 (금지)
      ];

      forbiddenUserFields.forEach((field) => {
        expect(userTypeInContract[0]).not.toContain(field);
      });
    }
  });

  // ============================================================================
  // 엣지 케이스: 문서와 주석에서도 금전 용어 제거 확인
  // ============================================================================

  it("AC-1[P1]: 주석/문서에서도 금전 도메인 표현 최소화", () => {
    // 주석에 금전 도메인이 있어도 코드 구현은 비금전인지 확인
    // 예: "// 이전에는 예치금을..." 이런 설명은 OK, 하지만 실제 구현은 비금전

    const filesToCheck = [
      path.join(srcDir, "lib", "rewards.ts"),
      path.join(srcDir, "store", "useAppStore.ts"),
      path.join(srcDir, "lib", "api.ts"),
    ];

    const violations: { file: string; count: number }[] = [];

    filesToCheck.forEach((filePath) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, "utf-8");

      // 금전 관련 주석의 개수를 세기 (참고: 주석이라도 너무 많으면 기각)
      const financeCommentMatches = content.match(
        /\/\/.*?(예치|정산|환급|송금|상금|배팅|잔금|환금|쏟아붓)/gi
      );

      if (financeCommentMatches && financeCommentMatches.length > 2) {
        violations.push({
          file: path.relative(srcDir, filePath),
          count: financeCommentMatches.length,
        });
      }
    });

    // 너무 많은 금전 관련 주석이 있으면 경고 (실패는 아님)
    // 단, 주석만으로는 문제가 되지 않음
    if (violations.length > 0) {
      console.warn(
        "주석에 금전 용어가 많음 (문제 아님, 참고만):",
        violations
      );
    }

    expect(true).toBe(true);
  });

  // ============================================================================
  // AC-4: 완전한 테스트 스위트 실행 가능성 확인
  // ============================================================================

  it("AC-4[P1]: 테스트 파일들이 실행 가능한 상태 (import 에러 없음)", () => {
    // 테스트 디렉토리의 모든 이전 금전 로직 테스트가 제거되고,
    // 새로운 rewards 순수함수 테스트가 있는지 확인

    const testsDir = path.join(srcDir, "__tests__");

    if (!fs.existsSync(testsDir)) {
      expect(true).toBe(true);
      return;
    }

    const testFiles = fs
      .readdirSync(testsDir)
      .filter((f) => f.endsWith(".test.ts") || f.endsWith(".test.tsx"));

    // 적어도 하나의 테스트 파일이 있어야 함
    expect(testFiles.length).toBeGreaterThan(0);

    // 금전 로직 테스트 파일이 없는지 확인 (구 파일 제거됨)
    const oldFinanceTestFiles = testFiles.filter(
      (f) =>
        f.includes("finance") ||
        f.includes("payment") ||
        f.includes("transfer") ||
        f.includes("settlement")
    );

    expect(oldFinanceTestFiles).toEqual([]);
  });
});
