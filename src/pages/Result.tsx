import { useLocation } from "react-router-dom";
import { calculateChallengeReward } from "@/lib/challenge";
import { badgeCatalog } from "@/lib/points";

interface ResultState {
  challengeId?: string;
  completed?: boolean;
  streak?: number;
  badgesEarned?: string[];
}

const MOCK_RANKING = [
  { name: "지우", streak: 21 },
  { name: "하늘", streak: 14 },
  { name: "도윤", streak: 9 },
];

export default function Result() {
  const location = useLocation();
  const state = (location.state ?? {}) as ResultState;

  const streak = state.streak ?? 0;
  const completed = state.completed ?? false;
  const badgesEarned = state.badgesEarned ?? [];

  const reward = calculateChallengeReward({
    participantId: "me",
    completed,
    streak,
    badgesEarned,
  });

  const ranking = [...MOCK_RANKING, { name: "나", streak }].sort(
    (a, b) => b.streak - a.streak
  );

  return (
    <div>
      <h1>결과</h1>
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
      <section data-testid="result-ranking">
        <h2>랭킹</h2>
        <ol>
          {ranking.map((entry, index) => (
            <li key={entry.name}>
              {index + 1}위 · {entry.name} · 연속 {entry.streak}일
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
