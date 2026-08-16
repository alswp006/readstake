import { Top, Paragraph } from "@toss/tds-mobile";
import ScreenScaffold from "../components/ScreenScaffold";
import Card from "../components/Card";

export default function Settings() {
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
      <Card testId="non-financial-notice">
        <Paragraph.Text typography="t7" color="grey500">
          본 서비스는 금전 보상이 없는 기록·습관 서비스예요. 배지와 연속 기록으로만 성취를 표시해요.
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
