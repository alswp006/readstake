import { useNavigate } from "react-router-dom";
import { Top, Paragraph, Button } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { EmptyState } from "../components/StateView";
import { useAppStore } from "../store/useAppStore";
import { BADGE_DEFS } from "../constants";

export default function Badges() {
  const navigate = useNavigate();
  const { stats } = useAppStore();
  const earnedIds = new Set(stats.badges.map((badge) => badge.id));
  const upcoming = BADGE_DEFS.filter((def) => !earnedIds.has(def.id));

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>배지 보관함</Top.TitleParagraph>} />}>
      <Paragraph.Text typography="t5" color="grey700">
        연속 기록과 완독으로 모은 배지예요
      </Paragraph.Text>

      <div data-testid="badge-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stats.badges.length === 0 ? (
          <EmptyState
            title="아직 받은 배지가 없어요"
            description="오늘 분량을 채우면 첫 배지가 열려요"
            action={
              <Button display="block" onClick={() => navigate("/")}>
                오늘 기록하러 가기
              </Button>
            }
          />
        ) : (
          stats.badges.map((badge) => (
            <Card key={badge.id} testId="badge-item">
              <Paragraph.Text typography="t5" fontWeight="bold">
                {badge.name}
              </Paragraph.Text>
              <Paragraph.Text typography="t6" color="grey600">
                {badge.description}
              </Paragraph.Text>
              {badge.achievedAt && (
                <Paragraph.Text typography="t7" color="grey500">
                  {badge.achievedAt} 달성
                </Paragraph.Text>
              )}
            </Card>
          ))
        )}
      </div>

      {upcoming.length > 0 && (
        <div data-testid="upcoming-badge-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Paragraph.Text typography="st9" color="grey600">
            다음 배지
          </Paragraph.Text>
          {upcoming.map((def) => (
            <Card key={def.id} testId="upcoming-badge-item">
              <Paragraph.Text typography="t6" color="grey700" fontWeight="medium">
                {def.name}
              </Paragraph.Text>
              <Paragraph.Text typography="t7" color="grey500">
                {def.description}
              </Paragraph.Text>
            </Card>
          ))}
        </div>
      )}
    </ScreenScaffold>
  );
}
