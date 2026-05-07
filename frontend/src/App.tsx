import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/layout/PrivateRoute";
import HistoryDetailPage from "./pages/HistoryDetail";
import HistoryPage from "./pages/History";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import PredictPage from "./pages/Predict";
import ProfilePage from "./pages/Profile";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import StatsPage from "./pages/Stats";
import AdminAuditPage from "./pages/admin/AuditLogs";
import AdminDashboardPage from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/Users";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <PredictPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/predict"
          element={
            <PrivateRoute>
              <Layout>
                <PredictPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <Layout>
                <HistoryPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <PrivateRoute>
              <Layout>
                <HistoryDetailPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Layout>
                <StatsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={["admin"]}>
              <Layout>
                <AdminDashboardPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={["admin"]}>
              <Layout>
                <UsersPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <PrivateRoute roles={["admin"]}>
              <Layout>
                <AdminAuditPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/forbidden"
          element={
            <Layout>
              <div className="flex h-[60vh] flex-col items-center justify-center text-slate-400">
                Bạn không có quyền truy cập trang này.
              </div>
            </Layout>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
