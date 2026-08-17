# Shared Context (auto-generated — do NOT modify)


## Proven Patterns (from "MealBudgetPlanner" — adapt, don't copy)
  DB: interface MonthlyBudget{month:string;amount:number;createdAt:number;updatedAt:number} key mbp_budget_v1; interface MealRecord{id,date,mealType,categor
  DB: key mbp_meals_v1: MealRecord[]; key mbp_budget_v1: Record<string,MonthlyBudget>; key mbp_checkins_v1: DailyCheckIn[]; key mbp_flags_v1: AppFlags
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(5), testing(1), ui(4)

Key lessons (verify against actual code before applying):
- [deploy] 빌드 불안정 — 의존성 버전 고정, 빌드 전 typecheck 필수 (60%)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60%)
- [ui] 온보딩/인증 가드는 현재 경로가 목적지 경로와 같으면 리다이렉트를 건너뛰고, 상태 로딩 중에는 리다이렉트를 보류하라 — 그렇지 않으면 무한 루프나 초기 크래시로 전 라우트가 타임아웃된다. (60%)
- [testing] 화면 구현 패킷을 돌리기 전에 플랫폼 SDK·결제/광고 컴포넌트·UI 라이브러리·스토리지 API를 감싼 공유 테스트 목 하네스를 먼저 확정하고, 에이전트가 임시 디버그 테스트 파일을 만들지 못하게 막아라. (60%)
- [ui] 라우팅으로 진입하는 모든 화면은 location.state·조회 결과가 없거나 손상돼도 크래시 없이 빈 상태를 렌더해야 하고, 알 수 없는 경로는 홈으로 리다이렉트해 스모크 타임아웃을 없애라. (60%)