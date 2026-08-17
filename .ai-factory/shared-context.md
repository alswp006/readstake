# Shared Context (auto-generated — do NOT modify)


## Proven Patterns (from "MealBudgetPlanner" — adapt, don't copy)
  DB: interface MonthlyBudget{month:string;amount:number;createdAt:number;updatedAt:number} key mbp_budget_v1; interface MealRecord{id,date,mealType,categor
  DB: key mbp_meals_v1: MealRecord[]; key mbp_budget_v1: Record<string,MonthlyBudget>; key mbp_checkins_v1: DailyCheckIn[]; key mbp_flags_v1: AppFlags

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  components/
  lib/
    challenge.ts
    db.ts
    points.ts
    schema.ts
  pages/
  types/
    index.ts

### Exports (src/lib/)
- challenge.ts: export function calculateChallengeReward(input: ChallengeInput): RewardOutput; export function updateProgress( challenge: Challenge, daysCompleted: number, currentStreak: number ): Challenge; export function awardBadge(challenge: Challenge, badgeId: string): Challenge; export function createChallenge( id: string, title: string, challengeGoal: string, targetDays: number ): Challenge; export const seedChallenges: Challenge[] = [ createChallenge( "ch_morning_run", "Morning Runner", "Run 5km every morning
- db.ts: export const challengeStore =; export const participantStore =; export const pointsSystemStore =; export const badgeStore =
- points.ts: export const POINTS_ARE_NON_REDEEMABLE = true as const; export function createPointsSystem(userId: string): PointsSystem; export function awardPoints( system: PointsSystem, amount: number, reason: string ): PointsSystem; export function calculateCurrentStreak(history: DailyProgress[]): number; export function calculateProgress( completed: number, target: number ):; export function addBadge( badgesEarned: string[], badgeId: string ): string[]; export function hasBadge(badgesEarned: string[], badgeId: string): boolean; export const badgeCatalog: BadgeDefinition[] = [
- schema.ts: export interface TableSchema; export const challengesSchema: TableSchema =; export const participantsSchema: TableSchema =; export const pointsSystemSchema: TableSchema =; export const badgesSchema: TableSchema =; export const allSchemas: TableSchema[] = [ challengesSchema, participantsSchema, pointsSystemSchema, badgesSchema, ]

### Module Dependencies (import graph)
  lib/challenge.ts → imports: types, lib/points
  lib/db.ts → imports: types, lib/schema
  lib/points.ts → imports: types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-1-01: 금전 예치·재분배 도메인을 비금전 챌린지 모델로 치환 (files: spec/app-spec.md, src/types/index.ts, src/lib/schema.ts, src/lib/db.ts, src/lib/challenge.ts, src/lib/points.ts, migrations/)

## Available exports from existing files
// src/lib/challenge.ts
export function calculateChallengeReward(input: ChallengeInput): RewardOutput {
export function updateProgress(
export function awardBadge(challenge: Challenge, badgeId: string): Challenge {
export function createChallenge(
export const seedChallenges: Challenge[] = [

// src/lib/db.ts
export const challengeStore = {
export const participantStore = {
export const pointsSystemStore = {
export const badgeStore = {

// src/lib/points.ts
export const POINTS_ARE_NON_REDEEMABLE = true as const;
export function createPointsSystem(userId: string): PointsSystem {
export function awardPoints(
export function calculateCurrentStreak(history: DailyProgress[]): number {
export function calculateProgress(
export function addBadge(
export function hasBadge(badgesEarned: string[], badgeId: string): boolean {
export const badgeCatalog: BadgeDefinition[] = [

// src/lib/schema.ts
export interface TableSchema {
export const challengesSchema: TableSchema = {
export const participantsSchema: TableSchema = {
export const pointsSystemSchema: TableSchema = {
export const badgesSchema: TableSchema = {
export const allSchemas: TableSchema[] = [

// src/types/index.ts
export interface Challenge {
export interface Participant {
export interface PointsSystem {
export interface PointsHistoryEntry {
export interface BadgeDefinition {
export interface DailyProgress {
export interface ChallengeInput {
export interface RewardOutput {

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(5), testing(1), ui(4)

Key lessons (verify against actual code before applying):
- [deploy] 빌드 불안정 — 의존성 버전 고정, 빌드 전 typecheck 필수 (60%)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60%)
- [ui] 온보딩/인증 가드는 현재 경로가 목적지 경로와 같으면 리다이렉트를 건너뛰고, 상태 로딩 중에는 리다이렉트를 보류하라 — 그렇지 않으면 무한 루프나 초기 크래시로 전 라우트가 타임아웃된다. (60%)
- [testing] 화면 구현 패킷을 돌리기 전에 플랫폼 SDK·결제/광고 컴포넌트·UI 라이브러리·스토리지 API를 감싼 공유 테스트 목 하네스를 먼저 확정하고, 에이전트가 임시 디버그 테스트 파일을 만들지 못하게 막아라. (60%)
- [ui] 라우팅으로 진입하는 모든 화면은 location.state·조회 결과가 없거나 손상돼도 크래시 없이 빈 상태를 렌더해야 하고, 알 수 없는 경로는 홈으로 리다이렉트해 스모크 타임아웃을 없애라. (60%)