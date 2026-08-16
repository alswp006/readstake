import type { ReactNode } from "react";
import PageShell from "./PageShell";

type ScreenScaffoldProps = {
  top?: ReactNode;
  bottom?: ReactNode;
  children: ReactNode;
};

export default function ScreenScaffold({ top, bottom, children }: ScreenScaffoldProps) {
  return (
    <PageShell>
      {top}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {children}
      </div>
      {bottom}
    </PageShell>
  );
}
