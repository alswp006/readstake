import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("비금전 챌린지 도메인 전환 (heal-2-02)", () => {
  const srcDir = path.resolve(process.cwd(), "src");
  const projectRoot = process.cwd();

  // ============================================================================
  // AC-1: 금융 용어 완전 제거 (grep 0건)
  // ============================================================================
  describe("AC-1: 금융 용어 완전 제거 (grep 0건)", () => {
    it("should have zero occurrences of financial keywords in src/ and lib/", () => {
      const financialKeywords = [
        "deposit",
        "stake",
        "escrow",
        "refund",
        "payout",
        "settlement",
        "prize",
        "예치금",
        "판돈",
        "정산",
        "환급",
      ];

      const allMatches: { keyword: string; files: string[] }[] = [];

      financialKeywords.forEach((keyword) => {
        const matches = findInFiles(srcDir, keyword);
        if (matches.length > 0) {
          allMatches.push({ keyword, files: matches });
        }
      });

      expect(allMatches).toEqual([]);
    });

    it("should not have 'amount' or 'balance' fields in domain types", () => {
      const forbiddenPatternsInTypes = [
        /type.*amount\s*:/i,
        /interface.*balance\s*:/i,
        /type.*Prize/i,
        /type.*Payout/i,
      ];

      const typesPath = path.join(srcDir, "lib", "types.ts");
      if (fs.existsSync(typesPath)) {
        const content = fs.readFileSync(typesPath, "utf-8");

        forbiddenPatternsInTypes.forEach((pattern) => {
          expect(content).not.toMatch(pattern);
        });
      }
    });
  });

  // ============================================================================
  // AC-2: 결제 SDK 제거 및 참가자 간 자산 이동 로직 없음
  // ============================================================================
  describe("AC-2: 결제 SDK 제거 및 참가자 간 자산 이동 로직 없음", () => {
    it("should not have payment SDK in package.json dependencies", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const paymentSdks = [
        "@apps-in-toss/payment",
        "@portone/browser-sdk",
        "iamport-react",
        "toss-payment-sdk",
      ];

      paymentSdks.forEach((sdk) => {
        expect(allDeps).not.toHaveProperty(sdk);
      });
    });

    it("should not have src/lib/payment/ directory", () => {
      const paymentDir = path.join(srcDir, "lib", "payment");
      expect(fs.existsSync(paymentDir)).toBe(false);
    });

    it("should not export inter-participant transfer functions", () => {
      const forbiddenFunctions = [
        "transferPoints",
        "sendReward",
        "withdrawFromEscrow",
        "settlePayment",
        "transferBalance",
      ];

      forbiddenFunctions.forEach((fn) => {
        const matches = findExportedFunction(srcDir, fn);
        expect(matches).toEqual([]);
      });
    });

    it("should not import from @apps-in-toss/payment or similar SDK", () => {
      const paymentImports = findImportsFrom(srcDir, [
        "@apps-in-toss/payment",
        "@portone/browser-sdk",
        "iamport",
      ]);

      expect(paymentImports).toEqual([]);
    });
  });

  // ============================================================================
  // AC-3: 실패 케이스에서 포인트·상태 차감 없음
  // ============================================================================
  describe("AC-3: 실패 케이스에서 포인트·상태 차감 없음", () => {
    it("should calculate completion: true only when unitsRead >= targetUnits", () => {
      const rulesPath = path.join(srcDir, "lib", "challenge", "rules.ts");
      if (!fs.existsSync(rulesPath)) {
        // Expected to fail in red phase - file doesn't exist yet
        expect(fs.existsSync(rulesPath)).toBe(true);
      } else {
        // Once implemented, test the logic
        const { calculateCompletion } = require(rulesPath);

        // Success cases
        expect(calculateCompletion(100, 100).completed).toBe(true);
        expect(calculateCompletion(150, 100).completed).toBe(true);

        // Failure cases
        expect(calculateCompletion(50, 100).completed).toBe(false);
        expect(calculateCompletion(0, 100).completed).toBe(false);
      }
    });

    it("should award points on completion, zero points (not negative) on failure", () => {
      const rulesPath = path.join(srcDir, "lib", "challenge", "rules.ts");
      if (!fs.existsSync(rulesPath)) {
        expect(fs.existsSync(rulesPath)).toBe(true);
      } else {
        const { calculateCompletion } = require(rulesPath);

        const successResult = calculateCompletion(100, 100);
        expect(successResult.completed).toBe(true);
        expect(successResult.points).toBeGreaterThan(0);

        const failureResult = calculateCompletion(50, 100);
        expect(failureResult.completed).toBe(false);
        expect(failureResult.points).toBe(0);
        expect(failureResult.points).toBeGreaterThanOrEqual(0); // No negative
      }
    });

    it("should have rules.ts without any state reduction logic on failure", () => {
      const rulesPath = path.join(srcDir, "lib", "challenge", "rules.ts");
      if (fs.existsSync(rulesPath)) {
        const content = fs.readFileSync(rulesPath, "utf-8");

        // Should NOT have penalty/reduction patterns
        expect(content).not.toMatch(/points\s*-=/i);
        expect(content).not.toMatch(/penalty|penalize/i);
        expect(content).not.toMatch(/forfeit|reduce|deduct.*failure/i);
      }
    });
  });

  // ============================================================================
  // AC-4: 포인트 환전·출금·양도 API 없음
  // ============================================================================
  describe("AC-4: 포인트 환전·출금·양도 API 없음", () => {
    it("should not have point withdrawal/cashout route handlers", () => {
      const forbiddenRoutes = [
        path.join(srcDir, "app", "api", "points", "withdraw"),
        path.join(srcDir, "app", "api", "points", "cashout"),
        path.join(srcDir, "app", "api", "points", "transfer"),
        path.join(srcDir, "app", "api", "rewards", "payout"),
      ];

      forbiddenRoutes.forEach((route) => {
        expect(fs.existsSync(route)).toBe(false);
      });
    });

    it("should not export cashout/withdrawal/transfer point functions", () => {
      const forbiddenFunctions = [
        "cashoutPoints",
        "withdrawPoints",
        "transferPoints",
        "convertPointsToCash",
        "redeemPoints",
        "exchangePoints",
      ];

      forbiddenFunctions.forEach((fn) => {
        const matches = findExportedFunction(srcDir, fn);
        expect(matches).toEqual([]);
      });
    });

    it("should not have any reward payout related endpoints", () => {
      const content = findInFilesContent(srcDir, /endpoint|route.*payout|route.*reward.*cash/i);
      expect(content).toEqual([]);
    });
  });

  // ============================================================================
  // AC-5: typecheck & build 통과 (dangling import 0건)
  // ============================================================================
  describe("AC-5: typecheck & build 통과", () => {
    it("should define Challenge type with non-financial fields only", () => {
      const typesPath = path.join(srcDir, "lib", "types.ts");
      if (!fs.existsSync(typesPath)) {
        expect(fs.existsSync(typesPath)).toBe(true);
      } else {
        const content = fs.readFileSync(typesPath, "utf-8");

        // Must have these fields
        expect(content).toContain("interface Challenge");
        expect(content).toMatch(/id\s*:/);
        expect(content).toMatch(/title\s*:/);
        expect(content).toMatch(/targetUnits\s*:/);
        expect(content).toMatch(/periodStart\s*:/);
        expect(content).toMatch(/periodEnd\s*:/);

        // Must NOT have these
        expect(content).not.toMatch(/amount\s*:/);
        expect(content).not.toMatch(/prize\s*:/i);
        expect(content).not.toMatch(/escrow\s*:/i);
      }
    });

    it("should define Participant type without escrow/balance", () => {
      const typesPath = path.join(srcDir, "lib", "types.ts");
      if (!fs.existsSync(typesPath)) {
        expect(fs.existsSync(typesPath)).toBe(true);
      } else {
        const content = fs.readFileSync(typesPath, "utf-8");

        // Must have these
        expect(content).toContain("interface Participant");
        expect(content).toMatch(/id\s*:/);
        expect(content).toMatch(/challengeId\s*:/);
        expect(content).toMatch(/userId\s*:/);
        expect(content).toMatch(/joinedAt\s*:/);

        // Must NOT have financial fields
        expect(content).not.toMatch(/escrowBalance\s*:/i);
        expect(content).not.toMatch(/stake\s*:/i);
        expect(content).not.toMatch(/pendingPayout\s*:/i);
        expect(content).not.toMatch(/balance\s*:/i);
      }
    });

    it("should define DailyProgress type for tracking units", () => {
      const typesPath = path.join(srcDir, "lib", "types.ts");
      if (!fs.existsSync(typesPath)) {
        expect(fs.existsSync(typesPath)).toBe(true);
      } else {
        const content = fs.readFileSync(typesPath, "utf-8");

        expect(content).toContain("interface DailyProgress");
        expect(content).toMatch(/participantId\s*:/);
        expect(content).toMatch(/date\s*:/);
        expect(content).toMatch(/unitsRead\s*:/);
      }
    });

    it("should not have unresolved imports in Challenge domain files", () => {
      const challengeFiles = [
        path.join(srcDir, "lib", "challenge", "rules.ts"),
        path.join(srcDir, "lib", "types.ts"),
      ];

      challengeFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf-8");

          // Should not import from removed payment module
          expect(content).not.toMatch(
            /import\s+{[^}]*}\s+from\s+['"].*\/payment/
          );
          expect(content).not.toMatch(
            /import\s+{[^}]*}\s+from\s+['"]@apps-in-toss\/payment/
          );
        }
      });
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function findInFiles(dir: string, keyword: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`\\b${keyword}\\b`, "gi");

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "__tests__") {
          walk(path.join(currentPath, entry.name));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const filePath = path.join(currentPath, entry.name);
        const content = fs.readFileSync(filePath, "utf-8");
        if (regex.test(content)) {
          results.push(filePath);
        }
      }
    });
  }

  walk(dir);
  return results;
}

function findExportedFunction(dir: string, functionName: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(
    `export\\s+(async\\s+)?function\\s+${functionName}\\b|export\\s+(const|let)\\s+${functionName}\\s*[=:]`
  );

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "__tests__") {
          walk(path.join(currentPath, entry.name));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const filePath = path.join(currentPath, entry.name);
        const content = fs.readFileSync(filePath, "utf-8");
        if (regex.test(content)) {
          results.push(filePath);
        }
      }
    });
  }

  walk(dir);
  return results;
}

function findImportsFrom(dir: string, modules: string[]): string[] {
  const results: string[] = [];
  const regexes = modules.map((m) => new RegExp(`from\\s+['"]${m}`));

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "__tests__") {
          walk(path.join(currentPath, entry.name));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const filePath = path.join(currentPath, entry.name);
        const content = fs.readFileSync(filePath, "utf-8");
        if (regexes.some((r) => r.test(content))) {
          results.push(filePath);
        }
      }
    });
  }

  walk(dir);
  return results;
}

function findInFilesContent(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "__tests__") {
          walk(path.join(currentPath, entry.name));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const filePath = path.join(currentPath, entry.name);
        const content = fs.readFileSync(filePath, "utf-8");
        if (pattern.test(content)) {
          results.push(filePath);
        }
      }
    });
  }

  walk(dir);
  return results;
}
