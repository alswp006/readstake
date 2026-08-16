import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
};

export function EmptyState({ title, description, action, testId }: EmptyStateProps) {
  return (
    <div data-testid={testId ?? "empty-state"} style={{ textAlign: "center", padding: "48px 20px" }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>{title}</p>
      {description && <p style={{ color: "#8b95a1", marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  );
}

type LoadingStateProps = {
  lines?: number;
  testId?: string;
};

export function LoadingState({ lines = 3, testId }: LoadingStateProps) {
  return (
    <div
      data-testid={testId ?? "loading-state"}
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          style={{
            height: 16,
            borderRadius: 8,
            backgroundColor: "#f2f4f6",
            width: index === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}
