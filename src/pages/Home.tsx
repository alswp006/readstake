import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { EmptyState, LoadingState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";
import { calcProgress } from "../lib/rewards";

export default function Home() {
  const navigate = useNavigate();
  const { goals, logs, stats, loading, error, checkToday } = useAppStore();
  const activeGoal = goals[0];
  const [checkMessage, setCheckMessage] = useState("");

  async function handleCheck() {
    if (!activeGoal) return;
    const log = await checkToday(activeGoal.dailyTargetPages);
    setCheckMessage(log.completed ? "오늘 기록을 남겼어요" : "기록했어요. 내일 이어서 채워요");
  }

  if (!activeGoal) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>오늘의 기록</Top.TitleParagraph>} />}>
        {loading ? (
          <LoadingState lines={4} />
        ) : (
          <EmptyState
            title="하루 목표부터 정해요"
            description="읽을 분량을 정하면 오늘 체크로 기록이 쌓여요"
            action={
              <Button display="block" onClick={() => navigate("/goal")}>
                목표 정하기
              </Button>
            }
          />
        )}
      </ScreenScaffold>
    );
  }

  const progress = calcProgress(logs, activeGoal);
  const completedCount = logs.filter((log) => log.completed).length;

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>오늘의 기록</Top.TitleParagraph>} />}>
      <Card testId="progress-summary">
        <Paragraph.Text typography="st9" color="grey600">
          연속 기록
        </Paragraph.Text>
        <Paragraph.Text typography="t2" fontWeight="bold">
          {stats.streak.current}일째
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          완독 {completedCount}회 · 달성률 {progress.percent}%
        </Paragraph.Text>
        <div style={{ marginTop: 12 }}>
          <ProgressBar percent={progress.percent} testId="home-progress-bar" />
        </div>
      </Card>

      <Card>
        <Paragraph.Text typography="st9" color="grey600">
          오늘 목표
        </Paragraph.Text>
        <Paragraph.Text typography="t4" fontWeight="bold">
          {activeGoal.title} {activeGoal.dailyTargetPages}쪽
        </Paragraph.Text>
        {error && (
          <Paragraph.Text typography="t7" color="red500">
            {error}
          </Paragraph.Text>
        )}
        {checkMessage && (
          <Paragraph.Text typography="t7" color="blue500">
            {checkMessage}
          </Paragraph.Text>
        )}
        <div style={{ marginTop: 12 }}>
          <Button
            display="block"
            data-testid="today-check-button"
            loading={loading || undefined}
            onClick={handleCheck}
          >
            오늘 분량 다 읽었어요
          </Button>
        </div>
      </Card>

      <Button display="block" variant="weak" color="dark" onClick={() => navigate("/stats")}>
        진행률 자세히 보기
      </Button>
      <Button display="block" variant="weak" color="dark" onClick={() => navigate("/goal")}>
        목표 바꾸기
      </Button>
      <Button display="block" variant="weak" color="dark" onClick={() => navigate("/settings")}>
        설정
      </Button>
    </ScreenScaffold>
  );
}
