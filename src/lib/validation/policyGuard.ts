// 정책 가드 — 사행성/금융 취급 키워드 사전 차단
// 이 파일은 금지 키워드 사전의 단일 출처(source of truth)다.
// scripts/policy-lint.mjs가 이 파일을 직접 import해 소스/문안/SPEC 전체를 스캔한다.

export type PolicyCategory = "gambling" | "financial";

export interface PolicyViolation {
  keyword: string;
  category: PolicyCategory;
  context: string;
}

export const GAMBLING_KEYWORDS: string[] = ["배팅", "베팅", "판돈", "도박", "추첨경품"];

export const FINANCIAL_KEYWORDS: string[] = [
  "예치금",
  "송금",
  "출금",
  "환전",
  "정산",
  "에스크로",
  "선불충전",
];

const KEYWORD_ENTRIES: Array<{ keyword: string; category: PolicyCategory }> = [
  ...GAMBLING_KEYWORDS.map((keyword) => ({ keyword, category: "gambling" as const })),
  ...FINANCIAL_KEYWORDS.map((keyword) => ({ keyword, category: "financial" as const })),
];

// 텍스트를 줄 단위로 검사해 검출된 키워드마다 위반 정보를 반환한다.
// 부분 문자열 매칭이므로 "도박장" 같은 합성어에서도 "도박"을 검출한다.
export function getPolicyViolations(text: string | null | undefined): PolicyViolation[] {
  if (!text) return [];

  const violations: PolicyViolation[] = [];

  for (const line of text.split("\n")) {
    for (const { keyword, category } of KEYWORD_ENTRIES) {
      if (line.includes(keyword)) {
        violations.push({ keyword, category, context: line.trim() });
      }
    }
  }

  return violations;
}

export function validatePolicyKeywords(text: string | null | undefined): boolean {
  return getPolicyViolations(text).length > 0;
}
