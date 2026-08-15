// 챌린지 생성 폼 — 목표 분량과 기간만 입력받는다.

import { GOAL_SETUP_LABEL } from "../constants/copy";
import type { Challenge } from "../types/challenge";

export interface ChallengeFormValues {
  title: string;
  description: string;
  targetUnits: number; // 목표 분량 (페이지/챕터 수)
  startDate: string;
  endDate: string;
}

export interface ChallengeFormField {
  name: keyof ChallengeFormValues;
  label: string;
  type: "text" | "number" | "date";
}

export const CHALLENGE_FORM_FIELDS: ChallengeFormField[] = [
  { name: "title", label: "챌린지 제목", type: "text" },
  { name: "description", label: "챌린지 설명", type: "text" },
  { name: "targetUnits", label: GOAL_SETUP_LABEL, type: "number" },
  { name: "startDate", label: "시작일", type: "date" },
  { name: "endDate", label: "종료일", type: "date" },
];

export function buildChallengeDraft(
  values: ChallengeFormValues,
  createdBy: string
): Pick<Challenge, "title" | "description" | "startDate" | "endDate" | "createdBy"> {
  return {
    title: values.title,
    description: values.description,
    startDate: new Date(values.startDate),
    endDate: new Date(values.endDate),
    createdBy,
  };
}
