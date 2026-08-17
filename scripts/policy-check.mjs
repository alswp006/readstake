#!/usr/bin/env node
// 정책 준수 자체검증 가드: 소스에 금전 이동/보관/정산을 암시하는 표현이나
// 결제 SDK 사용이 재도입되지 않았는지 빌드 시점에 스캔한다.
import fs from "fs";
import path from "path";

const FORBIDDEN_KEYWORDS = [
  "사행성",
  "베팅",
  "배팅",
  "도박",
  "예치금",
  "deposit",
  "stake",
  "payout",
  "재분배",
  "유사수신",
  "선불충전",
  "환급",
  "정산",
  "송금",
  "상금",
];

const FORBIDDEN_IMPORT_NAMES = [
  "createOneTimePurchaseOrder",
  "createSubscriptionPurchaseOrder",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "__tests__"]);
const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;
const ALLOWLIST_FILENAME = ".policy-allowlist";

function keywordPattern(keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 코드 식별자 안에 섞여 있어도(parseDeposit, betAmount 등) 잡아내기 위해
  // 경계 없이 대소문자 무시 부분 문자열로 매칭한다.
  return new RegExp(escaped, "i");
}

const KEYWORD_PATTERNS = FORBIDDEN_KEYWORDS.map((keyword) => ({
  keyword,
  pattern: keywordPattern(keyword),
}));

function listFiles(rootDir) {
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ALLOWLIST_FILENAME) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (SCAN_EXTENSIONS.has(path.extname(entry.name)) && !TEST_FILE_PATTERN.test(entry.name)) {
          results.push(fullPath);
        }
      }
    }
  }
  walk(rootDir);
  return results;
}

function loadAllowlist(rootDir) {
  const allowlistPath = path.join(rootDir, ALLOWLIST_FILENAME);
  if (!fs.existsSync(allowlistPath)) {
    return new Set();
  }
  const parsed = JSON.parse(fs.readFileSync(allowlistPath, "utf-8"));
  const files = Array.isArray(parsed.files) ? parsed.files : [];
  return new Set(files.map((file) => file.split(path.sep).join("/")));
}

function findImportViolations(content) {
  const violations = [];
  const importLines = content.match(/^\s*import\s+.*$/gm) ?? [];
  for (const line of importLines) {
    for (const name of FORBIDDEN_IMPORT_NAMES) {
      if (line.includes(name)) {
        violations.push(`결제 SDK import 금지: ${name}`);
      }
    }
  }
  return violations;
}

function findKeywordViolations(content) {
  const violations = [];
  for (const { keyword, pattern } of KEYWORD_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`금지된 키워드: ${keyword}`);
    }
  }
  return violations;
}

function main() {
  const targetDir = path.resolve(process.argv[2] ?? "src");

  if (!fs.existsSync(targetDir)) {
    console.log(`policy-check: 대상 경로가 없어 건너뜁니다 (${targetDir})`);
    process.exit(0);
  }

  const allowlist = loadAllowlist(targetDir);
  const files = listFiles(targetDir);

  const report = [];

  for (const filePath of files) {
    const relPath = path.relative(targetDir, filePath).split(path.sep).join("/");
    if (allowlist.has(relPath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const violations = [...findKeywordViolations(content), ...findImportViolations(content)];

    if (violations.length > 0) {
      report.push({ file: relPath, violations });
    }
  }

  if (report.length > 0) {
    console.log("정책 위반이 발견되어 빌드를 중단합니다:\n");
    for (const { file, violations } of report) {
      for (const violation of violations) {
        console.log(`  - ${file}: ${violation}`);
      }
    }
    console.log(
      `\n총 ${report.length}개 파일에서 위반이 발견됐습니다. 고지 문구 등 정당한 예외는 ${ALLOWLIST_FILENAME}에 명시적으로 등록하세요.`
    );
    process.exit(1);
  }

  console.log(`policy-check: 위반 0건 (${files.length}개 파일 검사)`);
  process.exit(0);
}

main();
