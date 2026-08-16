import { useEffect, useState, type ChangeEvent } from "react";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { useAppStore } from "../store/useAppStore";

export default function Settings() {
  const { goals, loadGoals, setGoal, loading, error } = useAppStore();
  const activeGoal = goals[0];
  const [pages, setPages] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (goals.length === 0) {
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPages(activeGoal ? String(activeGoal.dailyTargetPages) : "");
  }, [activeGoal]);

  async function handleSave() {
    const target = Number(pages);
    if (!target || target <= 0) return;
    await setGoal({ id: "daily-reading", title: activeGoal?.title ?? "매일 읽기", dailyTargetPages: target });
    setSaved(true);
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>설정</Top.TitleParagraph>} />}>
      <Card>
        <Paragraph.Text typography="t5" fontWeight="bold">
          리드스테이크
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="grey600">
          매일의 독서 습관을 기록으로 남겨요
        </Paragraph.Text>
      </Card>
      <Card>
        <div data-testid="settings-goal-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Paragraph.Text typography="st9" color="grey700" fontWeight="medium">
            하루 목표 쪽수
          </Paragraph.Text>
          <input
            data-testid="settings-goal-input"
            placeholder="예: 20"
            value={pages}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setPages(event.target.value);
              setSaved(false);
            }}
            style={{
              height: 52,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e8eb",
              fontSize: 16,
            }}
          />
          {error && (
            <Paragraph.Text typography="t7" color="red500">
              {error}
            </Paragraph.Text>
          )}
          {saved && !loading && (
            <Paragraph.Text typography="t7" color="blue500">
              목표를 저장했어요
            </Paragraph.Text>
          )}
          <Button display="block" data-testid="settings-goal-save-button" onClick={handleSave} loading={loading}>
            목표 저장
          </Button>
        </div>
      </Card>
      <Card testId="non-financial-notice">
        <Paragraph.Text typography="t7" color="grey500">
          본 서비스는 금전 보상이 없는 기록·습관 서비스예요. 배지와 연속 기록으로만 성취를 표시해요.
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
