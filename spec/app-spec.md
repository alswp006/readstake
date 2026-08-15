# 도메인 스펙 — 완독 챌린지 (비금전 모델)

## 개요
저장만 하고 읽지 않는 뉴스레터/아티클을 "완독 챌린지"로 강제한다. 참가자는 금전을 걸지 않는다.
완독 여부는 AI 퀴즈로 검증하고, 성공자는 앱 내부 전용 뱃지·포인트만 얻는다.
실패자에게는 어떤 차감이나 불이익도 발생하지 않는다.

## 엔티티

### Challenge
- `id`, `title`, `description`, `startDate`, `endDate`, `maxParticipants`, `createdBy`, `status`
- 금전 관련 필드는 일체 없다.

### Participant
- `id`, `userId`, `challengeId`, `joinedAt`, `completionRate`(0~1), `status`(active/completed/failed/withdrew)
- 금전 관련 필드는 일체 없다.

### DailyProgress
- `participantId`, `date`, `pagesRead`, `chaptersCompleted`
- 참가자의 일별 읽기 진행을 기록. `completionRate` 산정의 근거 데이터.

### RewardPoint
- `id`, `userId`, `pointAmount`, `awardedAt`, `source`, `nonRefundable`(항상 true)
- 앱 내부 전용 비현금성 포인트. 현금화·인출·타인 양도가 불가능하다.

### Badge
- `id`, `participantId`, `challengeId`, `label`, `awardedAt`
- 완독 성공 시에만 발급되는 시각적 성취 표식.

### RankingEntry
- `rank`, `participantId`, `userId`, `completionRate`, `pointsEarned`
- 달성률·포인트 기준 순위. 현금 우위 구조 없음.

## 규칙

### 포인트 지급
- 고정 규칙(`POINT_RULES`)으로만 지급한다. 동적 계산식(총 포인트 풀, 참가자 수 등에 따른 배분)은 없다.
- 지급 함수는 지급 대상 본인의 상태만 참조하며, 타인의 상태나 전체 풀 잔액을 참조하지 않는다.
- 완독 성공: `challenge_completion` 규칙에 따라 고정 500포인트 + 완독 뱃지 지급.
- 완독 실패: 포인트 0, 뱃지 없음. 상태(`status`)만 `failed`로 바뀔 뿐 기존 포인트·뱃지는 그대로 유지된다.

### 완독 판정
- `completionRate`가 100%(1)에 도달하면 완료, 아니면 실패로 판정한다.
- 실패 판정은 어떠한 데이터 차감·불이익도 동반하지 않는다. 실패자의 기존 포인트·뱃지는 그대로 유지되고 상태값만 바뀐다.

### 포인트 정책 (`REWARD_POINT_POLICY`)
- `nonRefundable`, `nonCashable`, `nonTransferable`: 항상 true
- `redemptionEnabled`, `cashoutEnabled`: 항상 false
- 현금화·인출·양도 API는 존재하지 않는다.

## 배제된 개념 (이 스펙에서 명시적으로 제외)
아래와 같은 개념·필드·함수·SDK 연동은 이 도메인에 존재하지 않는다:
- 금전적 자산을 걸고·모으고·나눠 갖는 모든 개념(참가비 성격의 자산, 참가자 풀 자산의 회수·재분배)
- 참가자 간 자산/포인트 이체 로직(`transferBetweenParticipants`, `transferPoints`, `transferFunds` 등)
- 결제·이체 SDK 호출(토스페이 등 외부 결제 연동)
