import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Goal from "./pages/Goal";
import Stats from "./pages/Stats";
import Badges from "./pages/Badges";
import Settings from "./pages/Settings";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const { loadGoals } = useAppStore();

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/goal" element={<Goal />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
