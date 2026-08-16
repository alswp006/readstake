import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  testId?: string;
};

export default function Card({ children, testId }: CardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        backgroundColor: "var(--background-normal-a, #fff)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {children}
    </div>
  );
}
