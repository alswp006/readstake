#!/usr/bin/env node
// 정책 자가검증: 사행성/금전 표현이 소스에 섞여 들어오면 빌드를 막는다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "src");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_DIR_NAMES = new Set(["__tests__", "node_modules"]);

const FORBIDDEN_WORDS = [
  "예치",
  "상금",
  "배팅",
  "베팅",
  "도박",
  "환급",
  "정산",
  "송금",
  "충전",
  "캐시백",
  "원금",
  "잔금",
];

const FORBIDDEN_IDENTIFIERS = [
  "deposit",
  "stake",
  "payout",
  "prizePool",
  "wager",
  "settlement",
  "refund",
  "betting",
  "cashback",
  "cashReward",
  "balance",
];

const CURRENCY_PATTERN = /₩|\d[\d,]*\s*원(?!\w)/;

// camelCase 경계까지 잡되(예: depositAmount), 무관한 단어의 부분 문자열(예: readstake)은 피한다.
// (정규식 'i' 플래그는 lookaround 문자 클래스까지 대소문자를 접어버려 경계 판정을 무너뜨리므로
// 직접 인접 문자를 검사한다.)
function findForbiddenIdentifier(line) {
  for (const word of FORBIDDEN_IDENTIFIERS) {
    const pattern = new RegExp(word, "gi");
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const before = line[match.index - 1];
      const after = line[match.index + match[0].length];
      const precededByLetter = before !== undefined && /[a-zA-Z]/.test(before);
      const followedByLowercase = after !== undefined && /[a-z]/.test(after);
      if (!precededByLetter && !followedByLowercase) return word;
    }
  }
  return null;
}

function listSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) return [];
      return listSourceFiles(fullPath);
    }
    return SCAN_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

function findLineMatch(content, matcher) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const found = typeof matcher === "string" ? lines[i].includes(matcher) : matcher.test(lines[i]);
    if (found) return { line: i + 1, text: lines[i].trim() };
  }
  return null;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const violations = [];

  FORBIDDEN_WORDS.forEach((word) => {
    const match = findLineMatch(content, word);
    if (match) violations.push({ file: filePath, rule: `단어 "${word}"`, ...match });
  });

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const word = findForbiddenIdentifier(lines[i]);
    if (word) {
      violations.push({ file: filePath, rule: `금지 식별자 "${word}"`, line: i + 1, text: lines[i].trim() });
      break;
    }
  }

  const currencyMatch = findLineMatch(content, CURRENCY_PATTERN);
  if (currencyMatch) violations.push({ file: filePath, rule: "KRW 금액 표기", ...currencyMatch });

  return violations;
}

function main() {
  const files = listSourceFiles(srcDir);
  const violations = files.flatMap(checkFile);

  if (violations.length > 0) {
    console.log(`정책 위반 ${violations.length}건 발견:`);
    violations.forEach((violation) => {
      const relativePath = path.relative(projectRoot, violation.file);
      console.log(`  - ${relativePath}:${violation.line} [${violation.rule}] ${violation.text}`);
    });
    process.exit(1);
  }

  console.log(`정책 자가검증 통과 (검사 파일 ${files.length}개)`);
  process.exit(0);
}

main();
