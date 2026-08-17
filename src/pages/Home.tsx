import { useNavigate } from "react-router-dom";
import { seedChallenges } from "@/lib/challenge";
import OnboardingNotice from "@/components/OnboardingNotice";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>챌린지</h1>
      <OnboardingNotice />
      {seedChallenges.map((challenge) => (
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
