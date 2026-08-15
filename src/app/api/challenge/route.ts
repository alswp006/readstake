// 챌린지 생성 API — 사행성/금융 취급 키워드가 포함된 입력을 서버 단계에서 거부한다.

import { getPolicyViolations } from "../../../lib/validation/policyGuard";

export interface CreateChallengeRequestBody {
  title: string;
  description: string;
}

export interface PolicyRejection {
  error: string;
  keywords: string[];
  fields: Array<"title" | "description">;
}

// 정책 위반 여부만 판정하는 순수 함수 — Request/Response 없이 단위 테스트 가능
export function validateChallengeInput(body: CreateChallengeRequestBody): PolicyRejection | null {
  const violations = [
    ...getPolicyViolations(body.title).map((v) => ({ ...v, field: "title" as const })),
    ...getPolicyViolations(body.description).map((v) => ({ ...v, field: "description" as const })),
  ];

  if (violations.length === 0) return null;

  const keywords = [...new Set(violations.map((v) => v.keyword))];
  const fields = [...new Set(violations.map((v) => v.field))];

  console.warn(`POLICY_VIOLATION: Challenge rejected - keywords=[${keywords.join(", ")}]`);

  return {
    error: `챌린지 ${fields.join("/")}에 금지된 키워드가 포함되어 있습니다: ${keywords.join(", ")}`,
    keywords,
    fields,
  };
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Partial<CreateChallengeRequestBody>;
  const title = body.title ?? "";
  const description = body.description ?? "";

  const rejection = validateChallengeInput({ title, description });
  if (rejection) {
    return Response.json(rejection, { status: 400 });
  }

  return Response.json({ title, description }, { status: 201 });
}
