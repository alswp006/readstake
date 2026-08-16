import { Component, type ReactNode } from "react";
import { Paragraph, Button } from "@toss/tds-mobile";
import PageShell from "./PageShell";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageShell>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 20px 24px",
            }}
          >
            <Paragraph.Text typography="t4" fontWeight="bold">
              화면을 불러오지 못했어요
            </Paragraph.Text>
            <div style={{ marginTop: 8, marginBottom: 20 }}>
              <Paragraph.Text typography="t6" color="grey600">
                처음 화면으로 돌아가 다시 시도해 주세요
              </Paragraph.Text>
            </div>
            <Button
              display="block"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              처음으로
            </Button>
          </div>
        </PageShell>
      );
    }
    return this.props.children;
  }
}
