import { useNavigate, useLocation } from "react-router-dom";
import { calculateChallengeReward } from "@/lib/challenge";
import { badgeCatalog } from "@/lib/points";
import OnboardingNotice from "@/components/OnboardingNotice";

interface ResultState {
  challengeId?: string;
  completed?: boolean;
  streak?: number;
  badgesEarned?: string[];
}

function toSafeStreak(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as ResultState;

  const streak = toSafeStreak(state.streak);
  const completed = state.completed === true;
  const badgesEarned = Array.isArray(state.badgesEarned)
    ? state.badgesEarned.filter((id): id is string => typeof id === "string")
    : [];

  const reward = calculateChallengeReward({
    participantId: "me",
    completed,
    streak,
    badgesEarned,
  });

  return (
    <div>
      <h1>결과</h1>
      <OnboardingNotice />
      <p data-testid="result-points">{reward.pointsAwarded}P 획득</p>
      <p data-testid="result-streak">연속 {streak}일 달성</p>
      <ul data-testid="result-badges">
        {reward.badgesUnlocked.length === 0 ? (
          <li>아직 획득한 뱃지가 없어요</li>
        ) : (
          reward.badgesUnlocked.map((badgeId) => {
            const badge = badgeCatalog.find((b) => b.id === badgeId);
            return <li key={badgeId}>{badge ? badge.name : badgeId}</li>;
          })
        )}
      </ul>
      <button type="button" data-testid="result-home-btn" onClick={() => navigate("/")}>
        홈으로
      </button>
    </div>
  );
}
