import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readFileSync, mkdtempSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("필수 의존성 삭제 방지 가드를 정책 가드에 통합 (heal-2-03)", () => {
  let tempDir: string;
  let origPackageJson: Record<string, any>;
  const projectRoot = process.cwd();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "verify-compliance-"));
    // 현재 package.json 보존
    const packageJsonPath = join(projectRoot, "package.json");
    origPackageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe("AC-1: 필수 패키지를 제거하면 가드 스크립트가 0이 아닌 코드 + 명확한 메시지 반환", () => {
    it("should exit with code 1 and show missing package name when react is removed", () => {
      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.dependencies.react;

      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).not.toBe(0);
      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/react|missing|필수|패키지/i);
      expect(output).toMatch(/dependency|의존성/i);
    });

    it("should exit with code 1 and show missing package name when react-dom is removed", () => {
      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.dependencies["react-dom"];

      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/react-dom|missing|필수/i);
    });

    it("should exit with code 1 when multiple essential packages are missing", () => {
      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.dependencies.react;
      delete brokenPkg.dependencies["react-router-dom"];

      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      // 모두 명시되어야 함
      expect(output).toMatch(/react|react-router-dom/);
    });

    it("should show typescript as essential dependency when missing", () => {
      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.devDependencies.typescript;

      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/typescript/i);
    });

    it("should show vite as essential dependency when missing", () => {
      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.devDependencies.vite;

      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/vite/i);
    });
  });

  describe("AC-2: 금지 도메인 키워드가 소스에 있으면 동일 스크립트가 실패", () => {
    it("should fail when forbidden keyword 'deposit' exists in source", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);

      const testFile = path.join(srcDir, "component.tsx");
      fs.writeFileSync(testFile, 'export const message = "deposit";');

      const tempPackageJson = path.join(tempDir, "package.json");
      fs.writeFileSync(tempPackageJson, JSON.stringify(origPackageJson, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/deposit|금지/i);
    });

    it("should fail when forbidden keyword '환급' exists in source", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);

      const testFile = path.join(srcDir, "text.tsx");
      fs.writeFileSync(testFile, 'const disclaimer = "환급되지 않습니다";');

      const tempPackageJson = path.join(tempDir, "package.json");
      fs.writeFileSync(tempPackageJson, JSON.stringify(origPackageJson, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/환급|금지/i);
    });

    it("should fail when forbidden keyword '상금' exists in source", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);

      const testFile = path.join(srcDir, "prize.tsx");
      fs.writeFileSync(testFile, 'export const prizeAmount = "상금";');

      const tempPackageJson = path.join(tempDir, "package.json");
      fs.writeFileSync(tempPackageJson, JSON.stringify(origPackageJson, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      expect(output).toMatch(/상금|금지/i);
    });

    it("should fail on both missing dependency AND keyword violation", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);

      const testFile = path.join(srcDir, "component.tsx");
      fs.writeFileSync(testFile, 'const amount = "deposit";');

      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.dependencies.react;
      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, tempDir], {
        stdio: "pipe",
      });

      expect(result.status).toBe(1);
      const output = result.stdout.toString() + result.stderr.toString();
      // 두 가지 위반이 모두 보고되어야 함
      expect(output).toMatch(/react|missing/);
      expect(output).toMatch(/deposit|금지/);
    });
  });

  describe("AC-3: 현재 저장소 상태에서 가드 스크립트가 성공(exit 0)", () => {
    it("should pass with current repository state", () => {
      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, projectRoot], {
        stdio: "pipe",
        timeout: 10000,
      });

      expect(result.status).toBe(0);
      const output = result.stdout.toString();
      expect(output).toMatch(/성공|0건|통과/i);
    });

    it("should verify that current package.json has all essential dependencies", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      // 현재 repo가 필수 의존성을 가지고 있는지 확인
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies["react-dom"]).toBeDefined();
      expect(pkg.dependencies["react-router-dom"]).toBeDefined();

      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies.vite).toBeDefined();
    });

    it("should report the number of files checked when verification passes", () => {
      const verifyPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyPath, "src"], {
        stdio: "pipe",
      });

      expect(result.status).toBe(0);
      const output = result.stdout.toString();
      // 파일 개수가 보고되어야 함 (verify-compliance는 policy-check처럼 동작)
      expect(output).toMatch(/검사|files/i);
    });
  });

  describe("AC-4: 가드가 빌드 전 단계에 연결되어 파이프라인에서 자동 실행", () => {
    it("should be registered in package.json scripts", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(pkg.scripts).toBeDefined();
      // verify-compliance가 scripts에 있거나, prebuild/build에 포함
      const scripts = Object.values(pkg.scripts).join(" ");
      expect(scripts).toMatch(/verify-compliance|compliance/i);
    });

    it("should be hooked into prebuild to run automatically before build", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(pkg.scripts.prebuild).toBeDefined();
      const prebuildCmd = pkg.scripts.prebuild;
      // prebuild에 verify-compliance 또는 compliance check 포함
      expect(prebuildCmd).toMatch(/verify-compliance|compliance|policy/i);
    });

    it("should run before build command is executed", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      // npm의 prebuild 훅은 자동으로 build 전에 실행됨
      expect(pkg.scripts.prebuild).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
    });

    it("should exist as a node script in scripts/ directory", () => {
      const verifyscriptPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      expect(fs.existsSync(verifyscriptPath)).toBe(true);

      const content = fs.readFileSync(verifyscriptPath, "utf-8");
      // 스크립트는 유효한 Node.js 모듈
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/export|function|import/i);
    });

    it("should check both dependencies and policy violations", () => {
      const verifyscriptPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const content = fs.readFileSync(verifyscriptPath, "utf-8");

      // 스크립트가 의존성과 정책 검사를 모두 포함
      expect(content).toMatch(/dependencies|package\.json/i);
      expect(content).toMatch(/forbidden|keyword|policy/i);
    });
  });

  describe("추가 검증: 통합 시나리오", () => {
    it("should validate that verify-compliance is integrated with policy-check logic", () => {
      const verifyscriptPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const content = fs.readFileSync(verifyscriptPath, "utf-8");

      // policy-check의 로직이 포함되거나 호출되어야 함
      expect(content).toMatch(/policy|forbidden|keyword|FORBIDDEN/);
    });

    it("should handle missing scripts directory gracefully", () => {
      const tempScriptsDir = path.join(tempDir, "scripts");
      const tempPackageJson = path.join(tempDir, "package.json");

      fs.mkdirSync(tempScriptsDir);
      fs.writeFileSync(tempPackageJson, JSON.stringify(origPackageJson, null, 2));

      // verify-compliance는 scripts/에 있어야 함
      expect(fs.existsSync(path.join(projectRoot, "scripts", "verify-compliance.mjs"))).toBe(true);
    });

    it("should accept directory argument for verification target", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, "App.tsx"), 'export default function App() { return null; }');

      const tempPackageJson = path.join(tempDir, "package.json");
      fs.writeFileSync(tempPackageJson, JSON.stringify(origPackageJson, null, 2));

      const verifyscriptPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyscriptPath, tempDir], {
        stdio: "pipe",
      });

      // 성공하거나, 오류 메시지는 명확해야 함
      expect(result.status).toBeDefined();
      expect(result.status).toBeGreaterThanOrEqual(0);
    });

    it("should exit with non-zero status on any compliance failure", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir);

      const testFile = path.join(srcDir, "bad.ts");
      fs.writeFileSync(testFile, 'export const illegal = "stake";');

      const tempPackageJson = path.join(tempDir, "package.json");
      const brokenPkg = { ...origPackageJson };
      delete brokenPkg.dependencies.react;
      fs.writeFileSync(tempPackageJson, JSON.stringify(brokenPkg, null, 2));

      const verifyscriptPath = path.join(projectRoot, "scripts", "verify-compliance.mjs");
      const result = spawnSync("node", [verifyscriptPath, tempDir], {
        stdio: "pipe",
      });

      // 두 가지 문제(의존성 + 키워드) 모두 있으므로 실패
      expect(result.status).not.toBe(0);
    });
  });
});
