import { Component, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import ChallengeDetail from "@/pages/ChallengeDetail";
import Result from "@/pages/Result";
import ProbePage from "@/pages/ProbePage";

/**
 * 홈("/")에 도달할 때마다 히스토리에 자리를 하나 더 채워 둔다. SPA 히스토리 스택보다
 * 뒤로가기를 더 많이 누르면 앱 진입 이전의 빈 화면으로 빠져나가 버리는 문제를 막는다.
 */
function useHomeBackGuard() {
  useEffect(() => {
    const armGuard = () => {
      if (window.location.pathname === "/") {
        window.history.pushState(null, "", window.location.href);
      }
    };
    armGuard();
    window.addEventListener("popstate", armGuard);
    return () => window.removeEventListener("popstate", armGuard);
  }, []);
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>화면을 불러오지 못했어요</h1>
          <p>잠시 문제가 생겼어요. 홈으로 돌아가 다시 시도해 주세요.</p>
          <button type="button" onClick={() => window.location.assign("/")}>
            홈으로 돌아가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useHomeBackGuard();

  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/challenge/:id" element={<ChallengeDetail />} />
        <Route path="/result" element={<Result />} />
        <Route path="/points" element={<ProbePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteErrorBoundary>
  );
}
