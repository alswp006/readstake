import { useNavigate, useParams } from "react-router-dom";
import {
  calculateChallengeReward,
  getStoredChallenges,
  updateProgress,
  awardBadge,
} from "@/lib/challenge";
import { challengeStore } from "@/lib/db";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const challenge = getStoredChallenges().find((c) => c.id === id);

  if (!challenge) {
    return (
      <div>
        <p>챌린지를 찾을 수 없어요.</p>
        <button type="button" onClick={() => navigate("/")}>
          홈으로
        </button>
      </div>
    );
  }

  const nextStreak = challenge.streak + 1;
  const completed = nextStreak >= challenge.targetDays;

  const handleVerify = () => {
    const reward = calculateChallengeReward({
      participantId: "me",
      completed,
      streak: nextStreak,
      badgesEarned: challenge.badgesEarned,
    });

    let updated = updateProgress(challenge, nextStreak, nextStreak);
    reward.badgesUnlocked.forEach((badgeId) => {
      updated = awardBadge(updated, badgeId);
    });
    challengeStore.upsert(updated);

    navigate("/result", {
      state: {
        challengeId: challenge.id,
        completed,
        streak: nextStreak,
        badgesEarned: challenge.badgesEarned,
      },
    });
  };

  return (
    <div>
      <h1>{challenge.title}</h1>
      <p>{challenge.challengeGoal}</p>
      <button type="button" data-testid="verify-btn" onClick={handleVerify}>
        인증하기
      </button>
      <button type="button" data-testid="challenge-home-btn" onClick={() => navigate("/")}>
        홈으로
      </button>
    </div>
  );
}
