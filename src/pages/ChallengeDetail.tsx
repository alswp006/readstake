import { useNavigate, useParams } from "react-router-dom";
import { seedChallenges } from "@/lib/challenge";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const challenge = seedChallenges.find((c) => c.id === id);

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
    </div>
  );
}
