import { useNavigate } from "react-router-dom";
import { getStoredChallenges } from "@/lib/challenge";
import OnboardingNotice from "@/components/OnboardingNotice";

export default function Home() {
  const navigate = useNavigate();
  const challenges = getStoredChallenges();

  return (
    <div>
      <h1>챌린지</h1>
      <OnboardingNotice />
      <button
        type="button"
        data-testid="points-status-link"
        onClick={() => navigate("/points")}
      >
        내 포인트 현황 보기
      </button>
      {challenges.map((challenge) => (
        <section
          key={challenge.id}
          data-testid={`challenge-card-${challenge.id}`}
        >
          <h2>{challenge.title}</h2>
          <p>{challenge.challengeGoal}</p>
          <button
            type="button"
            data-testid={`join-btn-${challenge.id}`}
            onClick={() => navigate(`/challenge/${challenge.id}`)}
          >
            참여하기
          </button>
        </section>
      ))}
    </div>
  );
}
