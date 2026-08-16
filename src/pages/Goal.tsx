import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { useAppStore } from "../store/useAppStore";

export default function Goal() {
  const navigate = useNavigate();
  const { goals, setGoal, loading, error } = useAppStore();
  const activeGoal = goals[0];
  const [pages, setPages] = useState(() => (activeGoal ? String(activeGoal.dailyTargetPages) : ""));
  const [invalid, setInvalid] = useState(false);

  async function handleSubmit() {
    const target = Number(pages);
    if (!Number.isFinite(target) || target <= 0) {
      setInvalid(true);
      return;
    }
    await setGoal({
      id: activeGoal?.id ?? "daily-reading",
      title: activeGoal?.title ?? "매일 읽기",
      dailyTargetPages: target,
    });
    navigate("/");
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>하루 목표 정하기</Top.TitleParagraph>} />}>
      <Paragraph.Text typography="t5" color="grey700">
        오늘 읽을 분량을 정해두면 체크 한 번으로 기록이 쌓여요
      </Paragraph.Text>

      <Card>
        <div data-testid="goal-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Paragraph.Text typography="st9" color="grey700" fontWeight="medium">
            하루 목표 쪽수
          </Paragraph.Text>
          <input
            data-testid="goal-input"
            inputMode="numeric"
            placeholder="예: 20"
            value={pages}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setPages(event.target.value);
              setInvalid(false);
            }}
            style={{
              height: 52,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e8eb",
              fontSize: 16,
            }}
          />
          {invalid && (
            <Paragraph.Text typography="t7" color="red500">
              하루에 읽을 쪽수를 1 이상으로 적어 주세요
            </Paragraph.Text>
          )}
          {error && (
            <Paragraph.Text typography="t7" color="red500">
              {error}
            </Paragraph.Text>
          )}
          <Button
            display="block"
            data-testid="goal-submit-button"
            loading={loading || undefined}
            onClick={handleSubmit}
          >
            목표 저장하기
          </Button>
        </div>
      </Card>

      <Card>
        <Paragraph.Text typography="t7" color="grey600">
          목표는 언제든 바꿀 수 있어요. 연속으로 채운 날이 쌓이면 배지를 받아요
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
