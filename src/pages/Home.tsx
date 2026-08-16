import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { useAppStore } from "../store/useAppStore";

export default function Home() {
  const navigate = useNavigate();
  const { goals, setGoal } = useAppStore();
  const [pages, setPages] = useState(() => (goals[0] ? String(goals[0].dailyTargetPages) : ""));

  function handleSubmit() {
    setGoal({ id: "daily-reading", title: "매일 읽기", dailyTargetPages: Number(pages) || 0 });
    navigate("/challenge");
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>오늘도 한 걸음</Top.TitleParagraph>} />}>
      <Paragraph.Text typography="t5" color="grey700">
        하루에 읽을 분량을 정하면 기록이 쌓여요
      </Paragraph.Text>
      <Card>
        <div data-testid="goal-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Paragraph.Text typography="st9" color="grey700" fontWeight="medium">
            하루 목표 쪽수
          </Paragraph.Text>
          <input
            data-testid="goal-input"
            placeholder="예: 20"
            value={pages}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPages(event.target.value)}
            style={{
              height: 52,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e8eb",
              fontSize: 16,
            }}
          />
          <Button display="block" data-testid="goal-submit-button" onClick={handleSubmit}>
            목표 저장하고 시작하기
          </Button>
        </div>
      </Card>
    </ScreenScaffold>
  );
}
