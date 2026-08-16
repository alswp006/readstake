type ProgressBarProps = {
  /** 0~100 사이 진행률 */
  percent: number;
  testId?: string;
};

export default function ProgressBar({ percent, testId }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      data-testid={testId}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height: 8, borderRadius: 4, backgroundColor: "#f2f4f6", overflow: "hidden" }}
    >
      <div style={{ width: `${clamped}%`, height: "100%", backgroundColor: "#3182f6" }} />
    </div>
  );
}
