import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { EmptyState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";

export default function Challenge() {
  const navigate = useNavigate();
  const { goals, checkToday, error, loadGoals } = useAppStore();
  const activeGoal = goals[0];

  useEffect(() => {
    if (goals.length === 0) {
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheck() {
    if (!activeGoal) return;
    await checkToday(activeGoal.dailyTargetPages);
    navigate("/result");
  }

  if (!activeGoal) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>오늘의 기록</Top.TitleParagraph>} />}>
        <EmptyState
          title="아직 목표가 없어요"
          description="먼저 하루에 읽을 분량을 정해요"
          action={
            <Button display="block" onClick={() => navigate("/")}>
              목표 정하러 가기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>오늘의 기록</Top.TitleParagraph>} />}>
      <Card>
        <Paragraph.Text typography="t4" fontWeight="bold">
          {activeGoal.title}
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          하루 목표 {activeGoal.dailyTargetPages}쪽
        </Paragraph.Text>
      </Card>
      {error && (
        <Paragraph.Text typography="t6" color="red500">
          {error}
        </Paragraph.Text>
      )}
      <Button display="block" data-testid="today-check-button" onClick={handleCheck}>
        오늘 완독 체크
      </Button>
    </ScreenScaffold>
  );
}
