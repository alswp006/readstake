import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pointsSystemStore } from "@/lib/db";
import { awardPoints, createPointsSystem } from "@/lib/points";
import type { PointsSystem } from "@/types";
import OnboardingNotice from "@/components/OnboardingNotice";

const USER_ID = "me";
const CHECK_IN_POINTS = 10;
const NOTE_MAX_LENGTH = 200;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

export default function ProbePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [system, setSystem] = useState<PointsSystem | null>(null);
  const [note, setNote] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setSystem(pointsSystemStore.get(USER_ID) ?? null);
    setLoading(false);
  }, []);

  const handleCheckIn = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    const base = system ?? createPointsSystem(USER_ID);
    const updated = awardPoints(base, CHECK_IN_POINTS, trimmed);
    const saved = pointsSystemStore.upsert(updated);
    if (!saved) {
      setSaveError(true);
      return;
    }
    setSaveError(false);
    setSystem(updated);
    setNote("");
  };

  if (loading) {
    return (
      <div>
        <h1>포인트 현황</h1>
        <p data-testid="probe-loading">포인트 정보를 불러오는 중이에요</p>
      </div>
    );
  }

  const totalPoints = system?.totalPoints ?? 0;
  const history = system?.history ?? [];

  return (
    <div>
      <h1>포인트 현황</h1>
      <button type="button" data-testid="probe-home-btn" onClick={() => navigate("/")}>
        홈으로
      </button>
      <OnboardingNotice />
      <p data-testid="probe-total-points">{totalPoints}P 보유 중</p>

      <section>
        <h2>기록</h2>
        {history.length === 0 ? (
          <p data-testid="probe-empty">
            아직 기록한 진행이 없어요. 오늘 한 일을 남겨보세요.
          </p>
        ) : (
          <ul data-testid="probe-history">
            {[...history].reverse().map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`}>
                {formatDate(entry.timestamp)} · {entry.reason} · +
                {entry.amount}P
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <label htmlFor="probe-note">오늘 한 일</label>
        <input
          id="probe-note"
          data-testid="probe-note-input"
          type="text"
          placeholder="예: 30분 러닝 완료"
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          data-testid="probe-checkin-btn"
          onClick={handleCheckIn}
          disabled={!note.trim()}
        >
          기록하고 {CHECK_IN_POINTS}P 받기
        </button>
        {saveError && (
          <p data-testid="probe-save-error">
            저장에 실패했어요. 기기 저장 공간을 확인하고 다시 시도해 주세요.
          </p>
        )}
      </section>
    </div>
  );
}
