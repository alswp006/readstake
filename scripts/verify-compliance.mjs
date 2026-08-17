#!/usr/bin/env node
/**
 * 통합 준수 가드 — 한 번 실행으로 두 축을 검증한다.
 *
 *   1) 플랫폼 필수 의존성 보존: package.json에서 프레임워크 코어/플랫폼 패키지가
 *      사라졌는지 확인한다. 의존성이 조용히 지워지면 빌드는 통과해도 앱은 흰 화면이 된다.
 *   2) 정책 키워드 스캔: 금전 이동/보관/정산을 암시하는 표현과 결제 SDK import가
 *      다시 들어왔는지 확인한다. 규칙은 policy-check.mjs에서 그대로 가져와 쓴다.
 *
 * 사용법:
 *   node scripts/verify-compliance.mjs [대상경로]
 *     - 대상경로가 package.json을 가진 프로젝트 루트면 그 package.json을 검사한다.
 *     - src 같은 하위 디렉터리를 주면 위로 올라가며 package.json을 찾는다.
 *     - 소스 스캔 대상은 대상경로/src (없으면 대상경로 자체).
 */
import fs from "node:fs";
import path from "node:path";
import { scanDirectory, ALLOWLIST_FILENAME } from "./policy-check.mjs";

/**
 * 프레임워크 코어 — 하나라도 빠지면 앱이 빌드/구동되지 않는다. 항상 필수.
 * field는 권장 위치이며, 검사 자체는 dependencies/devDependencies 어디에 있어도 인정한다.
 */
const ESSENTIAL_DEPENDENCIES = [
  { name: "react", field: "dependencies", reason: "프레임워크 코어" },
  { name: "react-dom", field: "dependencies", reason: "프레임워크 코어" },
  { name: "react-router-dom", field: "dependencies", reason: "라우팅" },
  { name: "typescript", field: "devDependencies", reason: "타입체크" },
  { name: "vite", field: "devDependencies", reason: "빌드 도구" },
  { name: "@vitejs/plugin-react", field: "devDependencies", reason: "빌드 도구" },
  { name: "vitest", field: "devDependencies", reason: "테스트 러너" },
];

/**
 * 플랫폼 패키지(TDS 계열 + 앱스인토스 SDK) — "삭제 방지" 대상.
 * 이미 선언돼 있거나 소스가 import하고 있으면 필수로 승격된다. 아직 도입 전이면
 * 경고만 남긴다(도입 패킷이 넣기 전까지 가드가 파이프라인을 막지 않도록).
 */
const PLATFORM_DEPENDENCIES = [
  { name: "@toss/tds-mobile", field: "dependencies", reason: "TDS 컴포넌트" },
  { name: "@toss/tds-icons", field: "dependencies", reason: "TDS 아이콘" },
  { name: "@apps-in-toss/web-framework", field: "dependencies", reason: "앱스인토스 SDK" },
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "__tests__"]);
// 테스트는 금지 import를 문자열 픽스처로 들고 있다 — 사용 판정에서 제외한다.
const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;

function findPackageJson(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, "package.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function resolveScanDir(targetDir) {
  const srcDir = path.join(targetDir, "src");
  if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) return srcDir;
  return targetDir;
}

function declaredVersion(pkg, name) {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
}

function listSourceFiles(rootDir) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (
        entry.isFile() &&
        SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
        !TEST_FILE_PATTERN.test(entry.name)
      ) {
        results.push(fullPath);
      }
    }
  }
  walk(rootDir);
  return results;
}

/** 소스가 실제로 import하는 패키지 이름 집합(하위 경로 import 포함). */
function collectImportedPackages(scanDir, candidates) {
  const imported = new Set();
  const files = listSourceFiles(scanDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const { name } of candidates) {
      if (imported.has(name)) continue;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(from|import|require\\()\\s*['"]${escaped}(/[^'"]*)?['"]`);
      if (pattern.test(content)) imported.add(name);
    }
  }
  return imported;
}

function checkDependencies(packageJsonPath, scanDir) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const missing = [];
  const warnings = [];
  let checked = 0;

  for (const entry of ESSENTIAL_DEPENDENCIES) {
    checked += 1;
    if (!declaredVersion(pkg, entry.name)) {
      missing.push(entry);
    }
  }

  const importedPlatform = collectImportedPackages(scanDir, PLATFORM_DEPENDENCIES);
  for (const entry of PLATFORM_DEPENDENCIES) {
    const declared = declaredVersion(pkg, entry.name);
    const used = importedPlatform.has(entry.name);
    if (declared) {
      // 이미 들어와 있는 플랫폼 패키지는 지워지면 안 된다 → 다음 실행부터 필수.
      checked += 1;
      continue;
    }
    if (used) {
      checked += 1;
      missing.push({ ...entry, reason: `${entry.reason} — 소스가 import 중` });
    } else {
      warnings.push(entry);
    }
  }

  return { pkg, missing, warnings, checked };
}

function main() {
  const target = path.resolve(process.argv[2] ?? ".");

  if (!fs.existsSync(target)) {
    console.log(`verify-compliance: 대상 경로가 없습니다 (${target})`);
    process.exit(1);
  }

  const packageJsonPath = findPackageJson(target);
  if (!packageJsonPath) {
    console.log(
      `verify-compliance: package.json을 찾지 못해 의존성(dependency) 검사를 할 수 없습니다 (${target})`
    );
    process.exit(1);
  }

  const scanDir = resolveScanDir(target);

  let depResult;
  try {
    depResult = checkDependencies(packageJsonPath, scanDir);
  } catch (error) {
    console.log(`verify-compliance: package.json을 읽지 못했습니다 — ${error.message}`);
    process.exit(1);
  }

  const { report, scannedCount } = scanDirectory(scanDir);

  const depFailed = depResult.missing.length > 0;
  const policyFailed = report.length > 0;

  if (depFailed) {
    console.log("필수 의존성(dependency)이 package.json에서 빠졌습니다:\n");
    for (const entry of depResult.missing) {
      console.log(`  - ${entry.name} (${entry.field}) — ${entry.reason}`);
    }
    console.log(
      `\n총 ${depResult.missing.length}개 필수 패키지가 없습니다. npm install ${depResult.missing
        .map((entry) => entry.name)
        .join(" ")} 로 되돌리세요.\n`
    );
  }

  if (policyFailed) {
    console.log("정책 위반이 발견되어 빌드를 중단합니다:\n");
    for (const { file, violations } of report) {
      for (const violation of violations) {
        console.log(`  - ${file}: ${violation}`);
      }
    }
    console.log(
      `\n총 ${report.length}개 파일에서 위반이 발견됐습니다. 고지 문구 등 정당한 예외는 ${ALLOWLIST_FILENAME}에 명시적으로 등록하세요.\n`
    );
  }

  if (depFailed || policyFailed) {
    process.exit(1);
  }

  for (const entry of depResult.warnings) {
    console.log(
      `verify-compliance: 안내 — ${entry.name}(${entry.reason})는 아직 package.json에 없습니다. 추가되면 이후부터 삭제 가드가 걸립니다.`
    );
  }

  console.log(
    `verify-compliance: 통과 — 필수 의존성 ${depResult.checked}개 확인, 정책 위반 0건 (${scannedCount}개 파일 검사)`
  );
  process.exit(0);
}

main();
