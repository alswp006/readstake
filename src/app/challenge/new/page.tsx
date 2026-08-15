// 챌린지 생성 화면 — 목표 분량/기간을 설정한다.

import { CHALLENGE_FORM_FIELDS, buildChallengeDraft } from "../../../components/ChallengeForm";
import {
  CREATE_CHALLENGE_CTA,
  GOAL_SETUP_DESCRIPTION,
  GOAL_SETUP_LABEL,
  NON_CASHABLE_NOTICE,
} from "../../../constants/copy";

export const CHALLENGE_NEW_PAGE_CONTENT = {
  title: "챌린지 만들기",
  goalSetupLabel: GOAL_SETUP_LABEL,
  goalSetupDescription: GOAL_SETUP_DESCRIPTION,
  fields: CHALLENGE_FORM_FIELDS,
  ctaLabel: CREATE_CHALLENGE_CTA,
  notice: NON_CASHABLE_NOTICE,
};

export { buildChallengeDraft };
