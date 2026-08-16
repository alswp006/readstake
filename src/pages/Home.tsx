import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";

const GOAL_STORAGE_KEY = "reading_daily_goal";

function loadStoredGoal(): string {
  try {
    return localStorage.getItem(GOAL_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(loadStoredGoal);

  function handleSubmit() {
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, goal);
    } catch {
      // localStorage 접근 불가 시 조용히 무시 (프라이버시 모드 등)
    }
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
            하루 목표
          </Paragraph.Text>
          <input
            data-testid="goal-input"
            placeholder="예: 20쪽"
            value={goal}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setGoal(event.target.value)}
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
