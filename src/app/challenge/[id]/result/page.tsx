// 완독 리포트 화면 — 달성률·연속 기록·뱃지를 보여주고 비환금 고지를 노출한다.

import { buildResultSummary } from "../../../../components/ResultSummary";
import type { StreakInfo } from "../../../../components/ResultSummary";
import { NON_CASHABLE_NOTICE, RESULT_REPORT_TITLE } from "../../../../constants/copy";
import type { ChallengeCompletionResult } from "../../../../types/challenge";

export function buildResultPageContent(outcome: ChallengeCompletionResult, streak: StreakInfo) {
  return {
    title: RESULT_REPORT_TITLE,
    summary: buildResultSummary(outcome, streak),
    notice: NON_CASHABLE_NOTICE,
  };
}
