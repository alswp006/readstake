import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * 이 패킷(heal-1-02)의 화면 계약은 heal-2-02에서 대체됐다.
 *
 * heal-1-02는 Home(목표 설정)→Challenge(오늘 체크)→Result(진행률)→Ranking(배지) 4화면을 전제했지만,
 * heal-2-02가 같은 AC를 Home(오늘 체크)·Goal(목표 설정)·Stats(진행률)·Badges(배지) 4라우트로 재정의하면서
 * /challenge·/result·/ranking 라우트가 사라졌다. 두 계약은 동시에 만족시킬 수 없다.
 * 동일 AC(금전 UI 제거·금전 문구 0건·목표→체크→진행률→배지 흐름)의 최신 검증은
 * src/__tests__/packet-heal-2-02.test.ts에 있다.
 *
 * 여기서는 대체 사실만 고정한다: 후속 테스트가 실제로 존재하고, 옛 라우트가 부활하지 않았는지.
 */
describe("화면·문구에서 금전/경쟁적 금전이전 UX 제거 (heal-2-02에서 재정의됨)", () => {
  const projectRoot = process.cwd();

  it("superseded: packet-heal-2-02 test covers the same ACs", () => {
    const successorTest = path.join(projectRoot, "src", "__tests__", "packet-heal-2-02.test.ts");
    expect(fs.existsSync(successorTest)).toBe(true);
  });

  it("superseded: the old /challenge, /result, /ranking routes are not defined anymore", () => {
    const appContent = fs.readFileSync(path.join(projectRoot, "src", "App.tsx"), "utf-8");
    const definedRoutePaths = Array.from(appContent.matchAll(/path=["']([^"']+)["']/g)).map((m) => m[1]);

    ["/challenge", "/result", "/ranking"].forEach((removed) => {
      expect(definedRoutePaths).not.toContain(removed);
    });
    ["/", "/goal", "/stats", "/badges"].forEach((current) => {
      expect(definedRoutePaths).toContain(current);
    });
  });
});
