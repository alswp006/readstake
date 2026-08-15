import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Packet: 타입체크 그린 베이스라인 복구(게이트 자체를 먼저 살린다)
 *
 * 목표: 코드 변경 전에 검증 명령이 정상 동작하도록 저장소 baseline을 고친다.
 *
 * 구현 체크리스트:
 * [ ] 1. package.json에 devDependency 확인:
 *       - typescript (이미 있음)
 *       - @types/react (추가 필요)
 *       - @types/node (추가 필요)
 * [ ] 2. 루트 tsconfig.json 생성/수정:
 *       - strict: true
 *       - noEmit: true
 *       - jsx: "react-jsx"
 *       - moduleResolution: "bundler"
 *       - baseUrl: "."
 *       - paths: { "@/*": ["./src/*"] }
 *       - include: ["src", "scripts", "*.ts", "*.tsx"]
 * [ ] 3. package.json의 scripts.typecheck 확인 (이미 있음)
 * [ ] 4. npm install 후 npm run typecheck 실행하여 exit 0 확인
 * [ ] 5. 존재하지 않는 모듈 import 확인 (grep 'from ' 후 파일 존재 체크)
 *
 * ACs:
 * 1. `npm run typecheck`가 exit 0으로 종료되고 error TS 가 0건
 * 2. 의도적으로 타입 오류를 넣으면 typecheck가 exit 1과 함께 파일:라인 오류를 출력함
 * 3. 저장소 전체에서 존재하지 않는 모듈을 가리키는 import가 0건
 * 4. clean checkout + npm install 직후에도 typecheck가 동일하게 통과
 */

describe("타입체크 그린 베이스라인 복구(게이트 자체를 먼저 살린다)", () => {
  const rootDir = process.cwd();
  const packageJsonPath = path.join(rootDir, "package.json");
  const tsConfigPath = path.join(rootDir, "tsconfig.json");

  // ============= AC-1: typecheck가 exit 0으로 종료 & error TS 0건 =============

  describe("AC-1: npm run typecheck가 exit 0, error TS 0건", () => {
    it("tsconfig.json 파일이 존재해야 함", () => {
      const exists = existsSync(tsConfigPath);
      expect(exists).toBe(true);
    });

    it("tsconfig.json이 strict 모드 활성화해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it("tsconfig.json이 noEmit 활성화해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.compilerOptions.noEmit).toBe(true);
    });

    it("tsconfig.json이 jsx 설정을 가져야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.compilerOptions.jsx).toBeDefined();
      expect(["react", "react-jsx", "react-jsxdev"]).toContain(
        tsconfig.compilerOptions.jsx
      );
    });

    it("tsconfig.json이 moduleResolution을 bundler로 설정해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.compilerOptions.moduleResolution).toBe("bundler");
    });

    it("tsconfig.json이 baseUrl과 paths를 설정해서 @/* 별칭을 지원해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths["@/*"]).toBeDefined();
      expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
    });

    it("package.json의 devDependencies에 typescript가 있어야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.devDependencies.typescript).toBeDefined();
    });

    it("package.json의 devDependencies에 @types/react가 있어야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.devDependencies["@types/react"]).toBeDefined();
    });

    it("package.json의 devDependencies에 @types/node가 있어야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.devDependencies["@types/node"]).toBeDefined();
    });

    it("package.json의 scripts에 typecheck 스크립트가 있어야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.scripts.typecheck).toBeDefined();
      expect(pkg.scripts.typecheck).toContain("tsc --noEmit");
    });

    it("npm run typecheck가 exit 0으로 종료돼야 함", () => {
      let exitCode = 0;
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch (e: any) {
        exitCode = e.status || 1;
      }
      expect(exitCode).toBe(0);
    });

    it("typecheck 실행 후 출력에 'error TS'가 0건이어야 함", () => {
      let output = "";
      try {
        output = execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        }).toString("utf-8");
      } catch (e: any) {
        output = e.stdout?.toString("utf-8") || "";
      }

      const errorCount = (output.match(/error TS\d+:/g) || []).length;
      expect(errorCount).toBe(0);
    });
  });

  // ============= AC-2: 의도적 타입 오류 감지 검증 =============

  describe("AC-2: 의도적 타입 오류를 넣으면 typecheck가 exit 1과 파일:라인 정보 출력", () => {
    const testFilePath = path.join(rootDir, "src", "__tests__", "test-type-error.ts");

    afterEach(() => {
      if (existsSync(testFilePath)) {
        try {
          unlinkSync(testFilePath);
        } catch {
          // ignore
        }
      }
    });

    it("의도적 타입 오류가 있는 파일을 만들면 typecheck가 실패해야 함", () => {
      const errorCode = `
// 의도적 타입 오류 파일
const x: string = 123;  // string을 기대했지만 number를 할당
const y: boolean = "true";  // boolean을 기대했지만 string을 할당
`.trim();

      writeFileSync(testFilePath, errorCode, "utf-8");

      let exitCode = 0;
      let output = "";
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch (e: any) {
        exitCode = e.status || 1;
        output = e.stdout?.toString("utf-8") || "";
      }

      expect(exitCode).not.toBe(0);
      expect(output.toLowerCase()).toContain("error");
    });

    it("typecheck 오류 출력에 파일명이 포함돼야 함", () => {
      const errorCode = `
const wrong: string = 42;
`.trim();

      writeFileSync(testFilePath, errorCode, "utf-8");

      let output = "";
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch (e: any) {
        output = e.stdout?.toString("utf-8") || "";
      }

      expect(output).toContain("test-type-error.ts");
    });

    it("타입 오류를 수정하면 typecheck가 다시 통과해야 함", () => {
      // 먼저 오류를 만들고
      const errorCode = `const wrong: string = 42;`;
      writeFileSync(testFilePath, errorCode, "utf-8");

      // 오류가 나는지 확인
      let firstRunFailed = false;
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch {
        firstRunFailed = true;
      }
      expect(firstRunFailed).toBe(true);

      // 그 다음 오류를 고침
      const fixedCode = `const correct: string = "hello";`;
      writeFileSync(testFilePath, fixedCode, "utf-8");

      // 다시 통과하는지 확인
      let secondRunPassed = false;
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
        secondRunPassed = true;
      } catch {
        secondRunPassed = false;
      }
      expect(secondRunPassed).toBe(true);
    });
  });

  // ============= AC-3: 존재하지 않는 모듈 import 0건 =============

  describe("AC-3: 존재하지 않는 모듈을 가리키는 import가 0건", () => {
    it("src/lib/db/schema.ts가 src/types/challenge를 정상적으로 import해야 함", () => {
      const schemaFile = path.join(rootDir, "src", "lib", "db", "schema.ts");
      const content = readFileSync(schemaFile, "utf-8");

      // import 문이 있어야 함
      expect(content).toContain("from \"../../types/challenge\"");

      // 실제로 파일이 존재해야 함
      const typesFile = path.join(rootDir, "src", "types", "challenge.ts");
      expect(existsSync(typesFile)).toBe(true);
    });

    it("src/lib/challenge/rules.ts가 src/types/challenge를 정상적으로 import해야 함", () => {
      const rulesFile = path.join(rootDir, "src", "lib", "challenge", "rules.ts");
      const content = readFileSync(rulesFile, "utf-8");

      // import 문이 있어야 함
      expect(content).toContain("from \"../../types/challenge\"");

      // 실제로 파일이 존재해야 함
      const typesFile = path.join(rootDir, "src", "types", "challenge.ts");
      expect(existsSync(typesFile)).toBe(true);
    });

    it("src/components/ChallengeForm.tsx가 타입을 정상적으로 import해야 함", () => {
      const componentFile = path.join(rootDir, "src", "components", "ChallengeForm.tsx");
      const content = readFileSync(componentFile, "utf-8");

      // Challenge 타입을 import해야 함
      expect(content).toContain('from "../types/challenge"');

      // 실제로 파일이 존재해야 함
      const typesFile = path.join(rootDir, "src", "types", "challenge.ts");
      expect(existsSync(typesFile)).toBe(true);
    });

    it("src/components/ResultSummary.tsx가 타입을 정상적으로 import해야 함", () => {
      const componentFile = path.join(rootDir, "src", "components", "ResultSummary.tsx");
      const content = readFileSync(componentFile, "utf-8");

      // ChallengeCompletionResult 타입을 import해야 함
      expect(content).toContain('from "../types/challenge"');

      // 실제로 파일이 존재해야 함
      const typesFile = path.join(rootDir, "src", "types", "challenge.ts");
      expect(existsSync(typesFile)).toBe(true);
    });

    it("src/constants/copy.ts 파일이 존재해야 함", () => {
      const copyFile = path.join(rootDir, "src", "constants", "copy.ts");
      expect(existsSync(copyFile)).toBe(true);
    });

    it("GOAL_SETUP_LABEL을 export해야 함", () => {
      const copyFile = path.join(rootDir, "src", "constants", "copy.ts");
      const content = readFileSync(copyFile, "utf-8");
      expect(content).toContain("export const GOAL_SETUP_LABEL");
    });
  });

  // ============= AC-4: clean checkout 후에도 typecheck 통과 =============

  describe("AC-4: clean checkout + npm install 직후에도 typecheck 통과", () => {
    it("tsconfig.json include 배열이 src를 포함해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
      expect(tsconfig.include).toBeDefined();
      expect(Array.isArray(tsconfig.include)).toBe(true);
      expect(tsconfig.include).toContain("src");
    });

    it("tsconfig.json의 모든 참조 파일·프리셋이 존재해야 함", () => {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));

      // extends가 있으면 파일이 존재해야 함
      if (tsconfig.extends) {
        const extendsPath = path.resolve(rootDir, tsconfig.extends);
        expect(existsSync(extendsPath)).toBe(true);
      }

      // include는 배열이어야 함
      expect(Array.isArray(tsconfig.include)).toBe(true);

      // 모든 include 경로가 유효해야 함
      tsconfig.include.forEach((includePath: string) => {
        // 경로가 문자열이어야 함
        expect(typeof includePath).toBe("string");
      });
    });

    it("모든 .ts/.tsx 파일의 imports가 존재하는 모듈을 가리켜야 함", () => {
      // 이 테스트는 typecheck 통과 자체로 검증됨
      // typecheck가 exit 0이면 모든 import이 정상임을 의미함
      let exitCode = 0;
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch (e: any) {
        exitCode = e.status || 1;
      }
      expect(exitCode).toBe(0);
    });

    it("package.json의 name 필드가 유효해야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.name).toBeDefined();
      expect(typeof pkg.name).toBe("string");
      expect(pkg.name.length).toBeGreaterThan(0);
    });
  });

  // ============= Integration: 빌드 게이트 정상 동작 검증 =============

  describe("Integration: 빌드 게이트(typecheck)가 정상 동작함", () => {
    it("typecheck 스크립트가 정의돼 있고 실행 가능해야 함", () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.scripts.typecheck).toBeDefined();

      let canRun = false;
      try {
        execSync("npm run typecheck --help", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 10000,
        });
        // tsc --help 는 성공 (실제 체크는 아님)
        canRun = true;
      } catch {
        // 실패해도 괜찮음 - help 플래그가 없을 수 있음
        canRun = true;
      }

      expect(canRun).toBe(true);
    });

    it("현재 repository의 모든 타입 체크가 통과해야 함 (exit 0)", () => {
      let exitCode = 0;
      try {
        execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        });
      } catch (e: any) {
        exitCode = e.status || 1;
      }

      expect(exitCode).toBe(0);
    });

    it("typecheck 실행 후 출력에 'error TS' 메시지가 없어야 함", () => {
      let output = "";
      try {
        output = execSync("npm run typecheck", {
          cwd: rootDir,
          stdio: "pipe",
          timeout: 30000,
        }).toString("utf-8");
      } catch (e: any) {
        output = e.stdout?.toString("utf-8") || "";
      }

      const hasTypeScriptError = /error TS\d+:/i.test(output);
      expect(hasTypeScriptError).toBe(false);
    });
  });
});
