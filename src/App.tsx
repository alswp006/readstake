import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import ChallengeDetail from "@/pages/ChallengeDetail";
import Result from "@/pages/Result";
import ProbePage from "@/pages/ProbePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/challenge/:id" element={<ChallengeDetail />} />
      <Route path="/result" element={<Result />} />
      <Route path="/points" element={<ProbePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
