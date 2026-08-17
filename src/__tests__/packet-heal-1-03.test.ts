import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

describe("정책 준수 자체검증 가드 추가", () => {
  let tempDir: string;
  const projectRoot = process.cwd();

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "policy-check-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe("AC-1: npm run build 실행 시 policy-check가 먼저 돌고 위반 0건으로 통과", () => {
    it("package.json의 prebuild 스크립트에 policy-check가 포함되어 있다", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.prebuild).toBeDefined();
      expect(packageJson.scripts.prebuild).toContain("policy-check");
    });

    it("정상 소스 코드는 policy-check를 통과한다", () => {
      const cleanFile = path.join(tempDir, "clean.ts");
      fs.writeFileSync(cleanFile, 'export const greeting = "Hello, World!";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(0);
      expect(result.stderr.toString()).toBe("");
    });
  });

  describe("AC-2: 금지 키워드를 소스에 일부러 넣으면 policy-check가 exit code 1로 실패", () => {
    it("deposit 키워드 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(testFile, 'const payment = "deposit";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      expect(result.stdout.toString() + result.stderr.toString()).toMatch(/deposit|금지된 키워드/i);
    });

    it("stake 키워드 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(testFile, 'const betAmount = stake;');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("payout 키워드 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(testFile, 'const result = payout();');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("한글 금지 키워드(도박) 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(testFile, 'const activity = "도박";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("한글 금지 키워드(배팅) 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(testFile, 'const bet = "배팅";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("결제 SDK import 감지 시 exit code 1 반환", () => {
      const testFile = path.join(tempDir, "bad.ts");
      fs.writeFileSync(
        testFile,
        'import { createOneTimePurchaseOrder } from "@apps-in-toss/web-framework";'
      );

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });
  });

  describe("AC-3: allowlist 없이는 어떤 금지 키워드도 통과하지 못한다", () => {
    it("allowlist 파일 없이 금지 키워드가 있으면 exit code 1", () => {
      const testFile = path.join(tempDir, "disclosure.ts");
      fs.writeFileSync(testFile, 'export const text = "현금으로 환급되지 않습니다";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("allowlist 파일이 있으면 허가된 파일은 통과한다", () => {
      const testFile = path.join(tempDir, "disclosure.ts");
      const allowlistFile = path.join(tempDir, ".policy-allowlist");

      fs.writeFileSync(
        testFile,
        'export const disclaimer = "현금으로 환급되지 않습니다";'
      );
      fs.writeFileSync(
        allowlistFile,
        JSON.stringify({
          files: ["disclosure.ts"],
          reason: "고지 문구에 포함된 필수 표현",
        })
      );

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(0);
    });

    it("allowlist에 없는 파일은 금지 키워드로 실패한다", () => {
      const file1 = path.join(tempDir, "allowed.ts");
      const file2 = path.join(tempDir, "notAllowed.ts");
      const allowlistFile = path.join(tempDir, ".policy-allowlist");

      fs.writeFileSync(file1, 'export const text = "현금으로 환급되지 않습니다";');
      fs.writeFileSync(file2, 'export const text2 = "환급 정책";');
      fs.writeFileSync(
        allowlistFile,
        JSON.stringify({
          files: ["allowed.ts"],
          reason: "고지 문구만 허용",
        })
      );

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      expect(result.stdout.toString() + result.stderr.toString()).toMatch(/notAllowed/);
    });
  });

  describe("추가 검증: 복합 시나리오", () => {
    it("여러 파일 중 하나라도 금지 키워드가 있으면 실패한다", () => {
      fs.writeFileSync(path.join(tempDir, "clean1.ts"), 'export const a = 1;');
      fs.writeFileSync(path.join(tempDir, "clean2.ts"), 'export const b = 2;');
      fs.writeFileSync(path.join(tempDir, "bad.ts"), 'export const c = "deposit";');

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("금지 키워드가 주석이나 문자열이 아닌 코드에 있어도 감지한다", () => {
      const testFile = path.join(tempDir, "code.ts");
      fs.writeFileSync(testFile, `
        // 이 함수는 안전합니다
        function process() {
          const amount = parseDeposit();
          return amount;
        }
      `);

      const policyCheckPath = path.join(projectRoot, "scripts", "policy-check.mjs");
      const result = spawnSync("node", [policyCheckPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
    });

    it("README에 설계 불변식이 기록되어 있다", () => {
      const readmePath = path.join(projectRoot, "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);

      const content = fs.readFileSync(readmePath, "utf-8");
      expect(content).toMatch(/금전\s*(이동|보관|정산).*하지\s*않는/i);
    });
  });
});
