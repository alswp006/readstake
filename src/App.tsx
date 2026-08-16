import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Goal from "./pages/Goal";
import Stats from "./pages/Stats";
import Badges from "./pages/Badges";
import Settings from "./pages/Settings";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const { loadGoals } = useAppStore();

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        }
      />
      <Route
        path="/goal"
        element={
          <ErrorBoundary>
            <Goal />
          </ErrorBoundary>
        }
      />
      <Route
        path="/stats"
        element={
          <ErrorBoundary>
            <Stats />
          </ErrorBoundary>
        }
      />
      <Route
        path="/badges"
        element={
          <ErrorBoundary>
            <Badges />
          </ErrorBoundary>
        }
      />
      <Route
        path="/settings"
        element={
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
