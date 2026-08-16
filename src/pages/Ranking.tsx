import { Top, Paragraph } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { useAppStore } from "../store/useAppStore";
import { updateStreak, checkEarnedBadges } from "../lib/rewards";
import type { Streak, Badge, LeaderboardEntry } from "../types";

function computeStreak(completedAtList: string[]): Streak {
  const sorted = [...completedAtList].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let streak: Streak = { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
  sorted.forEach((completedAt) => {
    streak = updateStreak(streak, completedAt);
  });
  return streak;
}

export default function Ranking() {
  const { user, results } = useAppStore();
  const streak = computeStreak(results.map((result) => result.completedAt));
  const badges: Badge[] = checkEarnedBadges(streak, results.length);
  const entries: LeaderboardEntry[] = user
    ? [{ userId: user.id, userName: user.name, points: user.points, level: user.level }]
    : [];

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>명예의 기록</Top.TitleParagraph>} />}>
      <Paragraph.Text typography="t5" color="grey700">
        완독률과 연속 기록으로만 순위를 매겨요
      </Paragraph.Text>

      <div data-testid="ranking-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.length === 0 ? (
          <Card>
            <Paragraph.Text typography="t6" color="grey600">
              아직 순위에 오른 기록이 없어요
            </Paragraph.Text>
          </Card>
        ) : (
          entries.map((entry, index) => (
            <Card key={entry.userId}>
              <Paragraph.Text typography="t5" fontWeight="bold">
                {index + 1}위 · {entry.userName}
              </Paragraph.Text>
              <Paragraph.Text typography="t6" color="grey600">
                레벨 {entry.level}
              </Paragraph.Text>
            </Card>
          ))
        )}
      </div>

      <div data-testid="badge-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {badges.length === 0 ? (
          <Card>
            <Paragraph.Text typography="t6" color="grey600">
              꾸준히 기록하면 배지를 받아요
            </Paragraph.Text>
          </Card>
        ) : (
          badges.map((badge) => (
            <Card key={badge.id}>
              <Paragraph.Text typography="t5" fontWeight="bold">
                {badge.name}
              </Paragraph.Text>
              <Paragraph.Text typography="t6" color="grey600">
                {badge.description}
              </Paragraph.Text>
            </Card>
          ))
        )}
      </div>
    </ScreenScaffold>
  );
}
