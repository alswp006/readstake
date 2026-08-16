import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { EmptyState, LoadingState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";
import { calcProgress } from "../lib/rewards";

export default function Stats() {
  const navigate = useNavigate();
  const { goals, logs, stats, loading, error } = useAppStore();
  const activeGoal = goals[0];

  if (loading && logs.length === 0) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>진행률</Top.TitleParagraph>} />}>
        <LoadingState lines={4} />
      </ScreenScaffold>
    );
  }

  if (logs.length === 0) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>진행률</Top.TitleParagraph>} />}>
        {error && (
          <Paragraph.Text typography="t7" color="red500">
            {error}
          </Paragraph.Text>
        )}
        <EmptyState
          title="아직 쌓인 기록이 없어요"
          description="오늘 읽은 분량을 체크하면 여기에 진행률이 그려져요"
          action={
            <Button display="block" onClick={() => navigate("/")}>
              오늘 기록하러 가기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  const progress = activeGoal ? calcProgress(logs, activeGoal) : { percent: 0, totalDays: logs.length };
  const completedCount = logs.filter((log) => log.completed).length;

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>진행률</Top.TitleParagraph>} />}>
      <Card testId="progress-card">
        <Paragraph.Text typography="st9" color="grey600">
          완독한 날
        </Paragraph.Text>
        <Paragraph.Text typography="t2" fontWeight="bold">
          {completedCount}일
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          기록한 {progress.totalDays}일 중 달성률 {progress.percent}%
        </Paragraph.Text>
        <div style={{ marginTop: 12 }}>
          <ProgressBar percent={progress.percent} testId="stats-progress-bar" />
        </div>
        <Paragraph.Text typography="t6" color="grey600">
          연속 기록 지금 {stats.streak.current}일 · 최고 {stats.streak.best}일
        </Paragraph.Text>
      </Card>

      <Card testId="level-card">
        <Paragraph.Text typography="st9" color="grey600">
          레벨
        </Paragraph.Text>
        <Paragraph.Text typography="t4" fontWeight="bold">
          레벨 {stats.level}
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          경험치 {stats.xp} · 모은 배지 {stats.badges.length}개
        </Paragraph.Text>
      </Card>

      <Button display="block" data-testid="view-badges-button" onClick={() => navigate("/badges")}>
        배지 보관함 열기
      </Button>
    </ScreenScaffold>
  );
}
