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
