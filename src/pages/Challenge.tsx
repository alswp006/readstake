import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { EmptyState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";

export default function Challenge() {
  const navigate = useNavigate();
  const { challenges, completeChallenge, error, loadChallenges } = useAppStore();
  const todayChallenge = challenges[0];

  useEffect(() => {
    if (challenges.length === 0) {
      loadChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheck() {
    if (!todayChallenge) return;
    await completeChallenge(todayChallenge.id);
    navigate("/result");
  }

  if (!todayChallenge) {
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
          {todayChallenge.title}
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          {todayChallenge.description}
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
