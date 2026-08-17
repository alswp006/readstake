import { describe, it, expect } from "vitest";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import fs from "fs";
import path from "path";

/**
 * Packet: 결제·정산 관련 화면과 카피를 비금전 UI로 전환
 *
 * Contract for the Coder (files that must be created):
 * - src/App.tsx: default export `App`. Routes:
 *     "/"              -> Home (src/pages/Home.tsx)
 *     "/challenge/:id" -> ChallengeDetail (src/pages/ChallengeDetail.tsx)
 *     "/result"        -> Result (src/pages/Result.tsx)
 *     "*"              -> redirect to "/"
 * - src/pages/Home.tsx: default export. Renders <OnboardingNotice /> and,
 *   for each challenge in `seedChallenges` (src/lib/challenge.ts), a card
 *   with data-testid={`challenge-card-${challenge.id}`} showing
 *   challenge.title, plus a button data-testid={`join-btn-${challenge.id}`}
 *   with visible text "참여하기" that calls navigate(`/challenge/${id}`).
 * - src/pages/ChallengeDetail.tsx: default export. Reads :id via useParams,
 *   looks the challenge up in `seedChallenges`, renders the challenge title
 *   and challengeGoal, and a button data-testid="verify-btn" with visible
 *   text "인증하기" that navigates to "/result" (react-router `state` may
 *   carry challengeId/completed/streak).
 * - src/pages/Result.tsx: default export. Renders a personal-achievement
 *   summary — data-testid="result-points" (earned points, unit "P"),
 *   data-testid="result-streak" (streak days), data-testid="result-badges"
 *   (badge list) — and a non-monetary ranking section
 *   data-testid="result-ranking".
 * - src/components/OnboardingNotice.tsx: default export. Renders a node
 *   data-testid="onboarding-notice" containing the exact disclosure
 *   sentence: "본 서비스는 금전 예치·보상이 없는 습관 형성 서비스이며
 *   포인트는 현금으로 교환되지 않습니다."
 *
 * AC-1: 결제/충전/환급/정산 관련 라우트와 컴포넌트가 존재하지 않고 참조도 남아있지 않다
 * AC-2: 모든 화면 텍스트에 금액 단위·상금·환급·배팅 표현이 없다
 * AC-3: 온보딩 또는 약관 영역에 비금전·비환금 고지 문구가 렌더링된다
 * AC-4: 주요 플로우(참여→인증→결과) 클릭 경로에 404/깨진 링크가 없다
 */

const FORBIDDEN_COPY_PATTERN =
  /(₩|원화|KRW|상금|환급|배팅|베팅|도박|예치금|정산|충전)/;

async function loadApp() {
  const mod = await import("@/App");
  return mod.default;
}

async function loadOnboardingNotice() {
  const mod = await import("@/components/OnboardingNotice");
  return mod.default;
}

describe("결제·정산 관련 화면과 카피를 비금전 UI로 전환", () => {
  // ==========================================================================
  // AC-1: 결제/충전/환급/정산 라우트·컴포넌트 부재 및 무참조
  // ==========================================================================
  describe("AC-1: 결제/충전/환급/정산 라우트·컴포넌트 부재", () => {
    it("src 디렉터리에 payment/charge/deposit/refund/settlement 관련 파일이 존재하지 않는다", () => {
      const srcDir = path.resolve(process.cwd(), "src");
      const bannedNamePattern = /(payment|checkout|charge|deposit|refund|settlement|정산|충전|환급|결제)/i;

      const offending: string[] = [];
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === "__tests__") continue;
            walk(fullPath);
          } else if (bannedNamePattern.test(entry.name)) {
            offending.push(path.relative(srcDir, fullPath));
          }
        }
      }
      walk(srcDir);

      expect(offending).toEqual([]);
    });

    it("App은 결제/충전/환급/정산 경로를 정의하지 않고, 해당 경로 접근 시 홈으로 리다이렉트된다", async () => {
      const App = await loadApp();
      const bannedPaths = ["/payment", "/deposit", "/charge", "/refund", "/settlement"];

      for (const bannedPath of bannedPaths) {
        const { container, unmount } = render(
          React.createElement(
            MemoryRouter,
            { initialEntries: [bannedPath] },
            React.createElement(App)
          )
        );
        expect(container.textContent).not.toMatch(FORBIDDEN_COPY_PATTERN);
        expect(screen.getByTestId("onboarding-notice")).toBeInTheDocument();
        unmount();
      }
    });
  });

  // ==========================================================================
  // AC-2: 화면 텍스트 내 금액/상금/환급/배팅 표현 부재
  // ==========================================================================
  describe("AC-2: 화면 텍스트에 금액·상금·환급·배팅 표현 없음", () => {
    it("홈 화면 렌더 텍스트에 금지 표현이 없다", async () => {
      const App = await loadApp();
      const { container } = render(
        React.createElement(MemoryRouter, { initialEntries: ["/"] }, React.createElement(App))
      );

      expect(container.textContent).not.toMatch(FORBIDDEN_COPY_PATTERN);
      expect(container.textContent!.length).toBeGreaterThan(0);
    });

    it("챌린지 상세·결과 화면 렌더 텍스트에 금지 표현이 없다", async () => {
      const App = await loadApp();

      const detail = render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/challenge/ch_morning_run"] },
          React.createElement(App)
        )
      );
      expect(detail.container.textContent).not.toMatch(FORBIDDEN_COPY_PATTERN);
      detail.unmount();

      const result = render(
        React.createElement(MemoryRouter, { initialEntries: ["/result"] }, React.createElement(App))
      );
      expect(result.container.textContent).not.toMatch(FORBIDDEN_COPY_PATTERN);
      expect(result.getByTestId("result-points").textContent).toMatch(/P/);
    });
  });

  // ==========================================================================
  // AC-3: 비금전·비환금 고지 문구
  // ==========================================================================
  describe("AC-3: 비금전·비환금 고지 문구 렌더링", () => {
    it("OnboardingNotice는 지정된 고지 문구를 정확히 렌더링한다", async () => {
      const OnboardingNotice = await loadOnboardingNotice();
      render(React.createElement(OnboardingNotice));

      const notice = screen.getByTestId("onboarding-notice");
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toContain(
        "본 서비스는 금전 예치·보상이 없는 습관 형성 서비스이며 포인트는 현금으로 교환되지 않습니다"
      );
    });

    it("홈 화면에 OnboardingNotice가 포함되어 렌더링된다", async () => {
      const App = await loadApp();
      render(
        React.createElement(MemoryRouter, { initialEntries: ["/"] }, React.createElement(App))
      );

      const notice = screen.getByTestId("onboarding-notice");
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toContain("현금으로 교환되지 않습니다");
    });
  });

  // ==========================================================================
  // AC-4: 참여 -> 인증 -> 결과 플로우에 404/깨진 링크 없음
  // ==========================================================================
  describe("AC-4: 참여→인증→결과 플로우에 깨진 링크 없음", () => {
    it("홈에서 참여하기를 누르면 챌린지 상세로, 인증하기를 누르면 결과로 이동하며 어디에도 404가 없다", async () => {
      const App = await loadApp();
      render(
        React.createElement(MemoryRouter, { initialEntries: ["/"] }, React.createElement(App))
      );

      expect(document.body.textContent).not.toMatch(/404/);

      const joinButton = screen.getByTestId("join-btn-ch_morning_run");
      fireEvent.click(joinButton);

      const verifyButton = await screen.findByTestId("verify-btn");
      expect(document.body.textContent).not.toMatch(/404/);
      fireEvent.click(verifyButton);

      const points = await screen.findByTestId("result-points");
      expect(points).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/404/);
    });

    it("정의되지 않은 임의 경로는 크래시 없이 홈(온보딩 고지 포함)으로 리다이렉트된다", async () => {
      const App = await loadApp();
      render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/some/unknown/route"] },
          React.createElement(App)
        )
      );

      expect(document.body.textContent).not.toMatch(/404/);
      expect(screen.getByTestId("onboarding-notice")).toBeInTheDocument();
    });
  });
});
