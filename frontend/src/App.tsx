import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/layout/PrivateRoute";

import PredictPage from "./pages/Predict";
import HistoryPage from "./pages/History";
import HistoryDetailPage from "./pages/HistoryDetail";
import StatsPage from "./pages/Stats";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UsersPage from "./pages/admin/Users";
import PendingApprovalsPage from "./pages/admin/PendingApprovals";
import NotFoundPage from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={<Layout><PrivateRoute roles={["admin", "doctor", "technician"]}><PredictPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/predict"
          element={<Layout><PrivateRoute roles={["admin", "doctor", "technician"]}><PredictPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/history"
          element={<Layout><PrivateRoute roles={["admin", "doctor", "technician"]}><HistoryPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/history/:id"
          element={<Layout><PrivateRoute roles={["admin", "doctor", "technician"]}><HistoryDetailPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/stats"
          element={<Layout><PrivateRoute roles={["admin", "doctor"]}><StatsPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/profile"
          element={<Layout><PrivateRoute roles={["admin", "doctor", "technician"]}><div className="flex h-[60vh] flex-col items-center justify-center text-slate-400">Ho so nguoi dung</div></PrivateRoute></Layout>}
        />
        <Route
          path="/admin/users"
          element={<Layout><PrivateRoute roles={["admin"]}><UsersPage /></PrivateRoute></Layout>}
        />
        <Route
          path="/admin/approvals"
          element={<Layout><PrivateRoute roles={["admin"]}><PendingApprovalsPage /></PrivateRoute></Layout>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
