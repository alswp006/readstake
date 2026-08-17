/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 챌린지 엔티티. heal-1-02 UI에서 표시/관리 (구현: 패킷 heal-1-01) */
export type Challenge = { id: string; name: string; description: string; targetPoints: number; startDate: string; endDate: string; status: 'active' | 'completed' | 'draft' };

/** 사용자 포인트 현황. heal-1-02 결과 화면에서 표시 (구현: 패킷 heal-1-01) */
export type UserPoints = { userId: string; totalPoints: number; currentRank: number; lastUpdatedAt: string };

/** 챌린지별 진행상황. heal-1-02에서 UI 갱신에 사용 (구현: 패킷 heal-1-01) */
export type ChallengeProgress = { challengeId: string; userId: string; pointsEarned: number; completedAt?: string; status: 'pending' | 'completed' };

/** heal-1-02의 challenge/[id]/page.tsx에서 상세 조회 (구현: 패킷 heal-1-01) */
export type getChallengeByIdFn = (id: string) => Promise<Challenge | null>;

/** heal-1-02의 챌린지 목록 페이지에서 조회 (구현: 패킷 heal-1-01) */
export type listChallengesFn = (filters?: { status?: string; limit?: number }) => Promise<Challenge[]>;

/** heal-1-02의 result/page.tsx에서 포인트 표시 (구현: 패킷 heal-1-01) */
export type getUserPointsFn = (userId: string) => Promise<UserPoints | null>;

/** heal-1-02 UI에서 챌린지 완료 기록 (구현: 패킷 heal-1-01) */
export type recordChallengeCompletionFn = (userId: string, challengeId: string, pointsEarned: number) => Promise<void>;

/** heal-1-02에서 포인트 계산/표시용 (구현: 패킷 heal-1-01) */
export type calculatePointsFn = (challengeId: string) => number;

/** heal-1-02에서 포인트 UI 포맷팅 (예: '1,250 점') (구현: 패킷 heal-1-01) */
export type formatPointsDisplayFn = (points: number) => string;

/** 정책 위반 사항. heal-1-03/heal-2-03 검증 결과 타입 (구현: 패킷 heal-1-03) */
export type PolicyViolation = { code: string; message: string; severity: 'error' | 'warning'; context?: Record<string, any> };

/** 정책 준수 검증. heal-2-03에서 통합 검증에 포함 (구현: 패킷 heal-1-03) */
export type validatePoliciesFn = () => Promise<PolicyViolation[]>;

/** 통합 준수 검증 결과. CI/CD 워크플로우에서 사용 (구현: 패킷 heal-2-03) */
export type ComplianceCheckResult = { passed: boolean; violations: PolicyViolation[]; timestamp: string };

/** .github/workflows/ci.yml에서 호출. 정책+의존성 통합 검증 (구현: 패킷 heal-2-03) */
export type verifyComplianceFn = () => Promise<ComplianceCheckResult>;
