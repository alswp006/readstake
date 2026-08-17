const DISCLOSURE_TEXT =
  "본 서비스는 금전 예치·보상이 없는 습관 형성 서비스이며 포인트는 현금으로 교환되지 않습니다.";

export default function OnboardingNotice() {
  return (
    <aside
      role="note"
      aria-label="비금전 안내"
      data-testid="onboarding-notice"
      style={{
        background: "#F2F4F6",
        borderRadius: 12,
        padding: "12px 16px",
        margin: "12px 0",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#4E5968" }}>
        {DISCLOSURE_TEXT}
      </p>
    </aside>
  );
}
