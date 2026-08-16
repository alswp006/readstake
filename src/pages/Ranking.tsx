import { Top, Paragraph } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";
import { useAppStore } from "../store/useAppStore";

export default function Ranking() {
  const { stats } = useAppStore();

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>명예의 기록</Top.TitleParagraph>} />}>
      <Paragraph.Text typography="t5" color="grey700">
        완독률과 연속 기록으로만 성취를 매겨요
      </Paragraph.Text>

      <div data-testid="ranking-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Card>
          <Paragraph.Text typography="t5" fontWeight="bold">
            레벨 {stats.level}
          </Paragraph.Text>
          <Paragraph.Text typography="t6" color="grey600">
            최고 연속 {stats.streak.best}일
          </Paragraph.Text>
        </Card>
      </div>

      <div data-testid="badge-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stats.badges.length === 0 ? (
          <Card>
            <Paragraph.Text typography="t6" color="grey600">
              꾸준히 기록하면 배지를 받아요
            </Paragraph.Text>
          </Card>
        ) : (
          stats.badges.map((badge) => (
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
