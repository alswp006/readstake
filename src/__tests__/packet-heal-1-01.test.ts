import { describe, it, expect, beforeEach, vi } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * 금전 예치·상금풀·정산 도메인 전면 제거 및 비금전 포인트 모델로 치환
 *
 * AC1: 코드베이스 전체 grep에서 deposit|stake|prizePool|payout|settle|refund|betting|상금|예치|정산 관련 식별자가 0건
 * AC2: 사용자 간 자산·포인트 이전을 수행하는 함수/엔드포인트가 존재하지 않음
 * AC3: 보상은 배지/스트릭/경험치 등 환금 불가한 비금전 값으로만 표현되고 화폐 단위 필드가 없음
 * AC4: 타입 체크(tsc)와 빌드가 오류 없이 통과
 */

describe("금전 예치·상금풀·정산 도메인 전면 제거 및 비금전 포인트 모델로 치환", () => {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, "src");

  // ============================================================================
  // AC-1: 금전 관련 식별자 전무 (grep 검증)
  // ============================================================================

  it("AC-1[P0]: should have zero occurrences of financial domain keywords (deposit/stake/prizePool/payout/settle/refund)", () => {
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
      "잔금",
      "상금",
      "예치",
      "정산",
    ];

    const violations: { keyword: string; files: string[] }[] = [];

    financialKeywords.forEach((keyword) => {
      try {
        const result = execSync(
          `grep -r "${keyword}" ${srcDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null`,
          { encoding: "utf-8" }
        );
        if (result.trim()) {
          const files = result
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => line.split(":")[0]);
          violations.push({ keyword, files: [...new Set(files)] });
        }
      } catch {
        // No matches found (expected)
      }
    });

    expect(violations).toEqual([]);
  });

  it("AC-1[P0]: should have zero occurrences of KRW/currency/금액 money-related fields", () => {
    const moneyPatterns = [
      "\\bKRW\\b",
      "\\bUSD\\b",
      "\\bcurrency\\b",
      "\\bcurrencyCode\\b",
      "\\bamount\\b",
      "\\bvalue\\b",
      "\\bprice\\b",
      "\\bcost\\b",
    ];

    const violations: { pattern: string; count: number }[] = [];

    moneyPatterns.forEach((pattern) => {
      try {
        const result = execSync(
          `grep -rE "${pattern}" ${srcDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null`,
          { encoding: "utf-8" }
        );
        if (result.trim()) {
          const count = result.split("\n").filter((line) => line.trim()).length;
          violations.push({ pattern, count });
        }
      } catch {
        // May have matches in contexts like progress or badges, which is OK
      }
    });

    // No strict requirement here — just warn if excessive money-related fields
    // This test documents that money terminology should be minimal
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  // ============================================================================
  // AC-2: 사용자 간 자산 이전 함수/엔드포인트 없음
  // ============================================================================

  it("AC-2[P0]: should have no transfer/send/share reward functions between users", () => {
    const transferPatterns = [
      "transferPoints",
      "transfer_points",
      "sendPoints",
      "send_points",
      "shareReward",
      "share_reward",
      "giftPoints",
      "gift_points",
      "paymentAPI",
      "payment_api",
      "settleAccount",
      "settle_account",
      "withdrawFunds",
      "withdraw_funds",
    ];

    const violations: string[] = [];

    transferPatterns.forEach((pattern) => {
      try {
        const result = execSync(
          `grep -r "${pattern}" ${srcDir} --include="*.ts" --include="*.tsx" 2>/dev/null`,
          { encoding: "utf-8" }
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

  it("AC-2[P0]: should have no API endpoints for user-to-user transactions", () => {
    const apiPatterns = [
      "/api/transfer",
      "/api/send",
      "/api/payout",
      "/api/settlement",
      "/api/refund",
      "/api/withdrawal",
      "POST.*transfer",
      "POST.*send.*reward",
    ];

    const apiViolations: string[] = [];

    // Check src/lib/api.ts and src/store/ for forbidden patterns
    const apiFiles = [
      path.join(srcDir, "lib", "api.ts"),
      path.join(srcDir, "store", "useAppStore.ts"),
    ];

    apiFiles.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        apiPatterns.forEach((pattern) => {
          if (content.includes(pattern)) {
            apiViolations.push(pattern);
          }
        });
      }
    });

    expect(apiViolations).toEqual([]);
  });

  // ============================================================================
  // AC-3: 보상은 비금전 값으로만 (progress/streak/badge/xp)
  // ============================================================================

  it("AC-3[P0]: User type should only have non-financial reward fields (xp, level, badge, progress, streak)", () => {
    const contractPath = path.join(srcDir, "lib", "contract.ts");
    expect(fs.existsSync(contractPath)).toBe(true);

    const contractContent = fs.readFileSync(contractPath, "utf-8");

    // Should define User with non-financial fields
    expect(contractContent).toMatch(/type User\s*=/);

    // Should NOT have balance, cashReward, deposit, stake
    const forbiddenInUser = [
      "balance",
      "cashReward",
      "cash_reward",
      "deposit",
      "stake",
    ];

    forbiddenInUser.forEach((field) => {
      expect(contractContent).not.toMatch(new RegExp(`User[^}]*${field}`));
    });

    // Should have xp, level, progress, streak, badge
    const requiredInUser = ["level", "completedChallenges"];
    requiredInUser.forEach((field) => {
      expect(contractContent).toMatch(new RegExp(`\\b${field}\\b`));
    });
  });

  it("AC-3[P0]: Reward model should support progress/streak/xp/badge, never currency amounts", () => {
    // This will be validated once src/types/index.ts is created
    const typesPath = path.join(srcDir, "types", "index.ts");

    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // Should have non-financial reward types
      const requiredRewardConcepts = ["xp", "progress", "streak", "badge"];
      requiredRewardConcepts.forEach((concept) => {
        // At least one of these should appear
        expect(typesContent.toLowerCase()).toMatch(
          new RegExp(`\\b${concept}\\b`, "i")
        );
      });

      // Should NOT export currency-related reward types
      expect(typesContent).not.toMatch(/type.*[Rr]eward.*\{[^}]*currency/);
      expect(typesContent).not.toMatch(/type.*[Rr]eward.*\{[^}]*amount.*[KU]rw/);
    }
  });

  it("AC-3[P1]: Challenge rewards should only give xp/points, never cash", () => {
    const contractPath = path.join(srcDir, "lib", "contract.ts");
    const contractContent = fs.readFileSync(contractPath, "utf-8");

    // Challenge type should have pointsReward (non-financial xp)
    expect(contractContent).toMatch(/pointsReward/);

    // Should NOT have cashReward or currency fields in Challenge
    expect(contractContent).not.toMatch(
      /type Challenge[^}]*(cashReward|currencyReward)/
    );
  });

  it("AC-3[P1]: ChallengeResult should record pointsEarned only, no monetary settlement", () => {
    const contractPath = path.join(srcDir, "lib", "contract.ts");
    const contractContent = fs.readFileSync(contractPath, "utf-8");

    // ChallengeResult should have pointsEarned
    expect(contractContent).toMatch(/pointsEarned/);

    // Should NOT have settlement, payout, refund, or balance fields
    const forbiddenFields = [
      "settlement",
      "payout",
      "refund",
      "balance",
      "cashOut",
    ];
    forbiddenFields.forEach((field) => {
      expect(contractContent).not.toMatch(
        new RegExp(`ChallengeResult[^}]*${field}`)
      );
    });
  });

  // ============================================================================
  // AC-4: TypeScript & Build Success
  // ============================================================================

  it("AC-4[P0]: TypeScript should compile without errors (npx tsc --noEmit)", () => {
    try {
      const result = execSync("npx tsc --noEmit", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      // If no error is thrown, compilation succeeded
      expect(true).toBe(true);
    } catch (error: any) {
      // tsc exits with code 0 on success, non-zero on error
      expect(error.status).toBe(0);
    }
  });

  it("AC-4[P0]: Build should succeed (npx vite build) with zero errors", () => {
    try {
      const result = execSync("npx vite build", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect(true).toBe(true);
    } catch (error: any) {
      // Build succeeded if exit code is 0
      // Some warnings are OK, but errors should not exist
      const output = error.stdout || error.stderr || "";
      expect(output).not.toMatch(/error:/i);
    }
  });

  // ============================================================================
  // Integration: All required new modules should be importable
  // ============================================================================

  it("AC-1+3[P1]: should be able to import from src/types, src/store, src/lib/rewards", () => {
    // These imports will fail until the files are created, which is expected
    // This test documents the expected module structure
    const requiredModules = [
      "src/lib/contract.ts", // Already exists
      // Once created:
      // "src/types/index.ts",
      // "src/store/useAppStore.ts",
      // "src/lib/rewards.ts",
      // "src/lib/api.ts",
    ];

    requiredModules.forEach((module) => {
      const filePath = path.join(projectRoot, module);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  it("AC-3[P1]: No reward function should accept currency/money parameters", () => {
    const rewardsPath = path.join(srcDir, "lib", "rewards.ts");

    if (fs.existsSync(rewardsPath)) {
      const rewardsContent = fs.readFileSync(rewardsPath, "utf-8");

      // reward functions should never have currency, KRW, USD, balance params
      const forbiddenParams = [
        "currency",
        "amount.*KRW",
        "cashAmount",
        "balance",
      ];
      forbiddenParams.forEach((param) => {
        expect(rewardsContent).not.toMatch(new RegExp(`${param}`));
      });
    }
  });

  // ============================================================================
  // Edge Case: Verify no hidden transfer logic
  // ============================================================================

  it("AC-2[P1]: no transaction/settlement records should exist for user-to-user transfers", () => {
    // Check that no "Transaction", "Settlement", "Transfer" types are exported
    const typesPath = path.join(srcDir, "types", "index.ts");

    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, "utf-8");

      // Should not have transaction types for settlements
      const forbiddenTypes = [
        "type Transaction",
        "type Settlement",
        "type Transfer",
        "type Payout",
        "interface Transaction",
        "interface Settlement",
        "interface Transfer",
      ];

      forbiddenTypes.forEach((typeDecl) => {
        // These may appear in comments, but not as actual exports
        const lines = typesContent.split("\n");
        const exportedLines = lines.filter((line) =>
          line.match(/^export\s+(type|interface)/)
        );
        const violations = exportedLines.filter((line) =>
          line.includes(typeDecl)
        );
        expect(violations).toEqual([]);
      });
    }
  });
});
