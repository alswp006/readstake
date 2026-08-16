import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { EmptyState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";
import { updateStreak } from "../lib/rewards";
import type { Streak } from "../types";

function computeStreak(completedAtList: string[]): Streak {
  const sorted = [...completedAtList].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let streak: Streak = { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
  sorted.forEach((completedAt) => {
    streak = updateStreak(streak, completedAt);
  });
  return streak;
}

export default function Result() {
  const navigate = useNavigate();
  const { user, results } = useAppStore();

  if (!user || results.length === 0) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>기록</Top.TitleParagraph>} />}>
        <EmptyState
          title="아직 완독 기록이 없어요"
          description="오늘 읽은 분량을 체크하면 여기 쌓여요"
          action={
            <Button display="block" onClick={() => navigate("/challenge")}>
              오늘 기록하러 가기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  const streak = computeStreak(results.map((result) => result.completedAt));
  const totalCompleted = user.completedChallenges;

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>기록</Top.TitleParagraph>} />}>
      <Card testId="progress-card">
        <Paragraph.Text typography="t3" fontWeight="bold">
          완독 {totalCompleted}회
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          연속 {streak.currentStreak}일째 기록 중이에요
        </Paragraph.Text>
      </Card>
      <Button display="block" data-testid="view-badges-button" onClick={() => navigate("/ranking")}>
        배지 보러 가기
      </Button>
    </ScreenScaffold>
  );
}
