🇺🇸 [English](./README.md)

# 챌린지 게이미피케이션 앱

목표 기반 챌린지에 참여하고 매일 완료 여부를 기록하는 앱. 연속 기록(스트릭)을
추적하고, 챌린지를 완주하면 포인트와 배지를 준다.

## 설계 불변식

**이 앱은 금전 이동·보관·정산을 하지 않는다.** 참여에 돈을 걸지 않고, 참가자
사이에 금액을 재분배하지 않으며, 포인트는 현금·상품권 등 어떤 외부 자산으로도
교환되지 않는다(`POINTS_ARE_NON_REDEEMABLE`, `src/lib/points.ts` 참고). 자세한
내용은 `spec/app-spec.md`를 참고한다.

이 불변식이 깨지는 걸 막기 위해 `npm run build` 실행 시
`scripts/policy-check.mjs`가 `prebuild` 단계에서 소스 전체를 스캔해 금지
키워드(예치금·배팅·도박·환급·정산 등)와 결제 SDK import를 찾으면 빌드를
중단시킨다. 고지 문구처럼 정당한 예외가 필요하면 스캔 대상 디렉터리에
`.policy-allowlist` 파일을 두고 해당 파일 경로를 명시적으로 등록해야 한다.

## 명령어

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run policy-check
npm run build        # prebuild(policy-check) → tsc → vite build
```
