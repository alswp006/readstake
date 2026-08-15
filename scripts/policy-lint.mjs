#!/usr/bin/env node
// 정책 린트 — 사행성/금융 취급 키워드 사전을 소스·문안·SPEC 전체에서 스캔한다.
// 1건이라도 검출되면 non-zero exit. package.json의 prebuild 단계에서 실행된다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPolicyViolations } from "../src/lib/validation/policyGuard.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = ["src", "spec"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".json"]);
const EXCLUDE_DIR_NAMES = new Set(["node_modules", "__tests__"]);

// 금지 키워드 사전의 단일 출처 파일 — 자기 자신을 스캔 대상에서 제외한다.
const EXCLUDE_FILES = new Set([path.join(ROOT, "src", "lib", "validation", "policyGuard.ts")]);

function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(entry)) continue;
      collectFiles(fullPath, files);
      continue;
    }

    if (EXCLUDE_FILES.has(fullPath)) continue;
    if (SCAN_EXTENSIONS.has(path.extname(entry))) files.push(fullPath);
  }
  return files;
}

function scan() {
  const files = SCAN_DIRS.map((dir) => path.join(ROOT, dir))
    .filter((dir) => {
      try {
        return statSync(dir).isDirectory();
      } catch {
        return false;
      }
    })
    .flatMap((dir) => collectFiles(dir));

  const violationLines = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const relativePath = path.relative(ROOT, file);
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const violations = getPolicyViolations(line);
      for (const violation of violations) {
        violationLines.push(
          `${relativePath}:${index + 1}: found forbidden keyword '${violation.keyword}' (${violation.category}) in line: '${violation.context}'`
        );
      }
    });
  }

  return { files, violationLines };
}

const { files, violationLines } = scan();

if (violationLines.length > 0) {
  console.error(`policy-lint: ${violationLines.length}건의 정책 위반이 발견됐습니다.\n`);
  for (const line of violationLines) {
    console.error(line);
  }
  process.exit(1);
}

console.log(`policy-lint: 통과 (${files.length}개 파일 스캔, 위반 0건)`);
process.exit(0);
