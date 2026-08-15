// 정책 가드 — 사행성/금융 취급 키워드 사전 차단
// 금지 키워드 사전의 단일 출처(source of truth)는 scripts/policy-dictionary.json이다.
// scripts/policy-lint.mjs는 이 파일의 getPolicyViolations를 직접 import해 소스/문안/SPEC 전체를 스캔한다.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PolicyCategory = "gambling" | "financial";

export interface PolicyViolation {
  keyword: string;
  category: PolicyCategory;
  context: string;
}

interface PolicyDictionary {
  gamblingKeywords: string[];
  financialKeywords: string[];
  // 금지 키워드를 부정문("~할 수 없습니다")으로 언급하는 정책 고지문 등,
  // 실제 위반이 아닌 승인된 문구. 자기참조성 오탐(false positive)을 막는다.
  allowlist: string[];
}

const DICTIONARY_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../scripts/policy-dictionary.json"
);

const dictionary: PolicyDictionary = JSON.parse(readFileSync(DICTIONARY_PATH, "utf-8"));

export const GAMBLING_KEYWORDS: string[] = dictionary.gamblingKeywords;

export const FINANCIAL_KEYWORDS: string[] = dictionary.financialKeywords;

const ALLOWLIST: string[] = dictionary.allowlist;

const KEYWORD_ENTRIES: Array<{ keyword: string; category: PolicyCategory }> = [
  ...GAMBLING_KEYWORDS.map((keyword) => ({ keyword, category: "gambling" as const })),
  ...FINANCIAL_KEYWORDS.map((keyword) => ({ keyword, category: "financial" as const })),
];

// 승인된 고지 문구를 줄에서 제거한 뒤 키워드를 검사해, 같은 줄의 다른 위반은
// 계속 검출하면서 승인된 문구 자체는 오탐 처리하지 않는다.
function stripAllowlisted(line: string): string {
  return ALLOWLIST.reduce((result, phrase) => result.split(phrase).join(""), line);
}

// 텍스트를 줄 단위로 검사해 검출된 키워드마다 위반 정보를 반환한다.
// 부분 문자열 매칭이므로 금지어를 포함한 합성어에서도 위반이 검출된다.
export function getPolicyViolations(text: string | null | undefined): PolicyViolation[] {
  if (!text) return [];

  const violations: PolicyViolation[] = [];

  for (const line of text.split("\n")) {
    const checkLine = stripAllowlisted(line);
    for (const { keyword, category } of KEYWORD_ENTRIES) {
      if (checkLine.includes(keyword)) {
        violations.push({ keyword, category, context: line.trim() });
      }
    }
  }

  return violations;
}

export function validatePolicyKeywords(text: string | null | undefined): boolean {
  return getPolicyViolations(text).length > 0;
}
