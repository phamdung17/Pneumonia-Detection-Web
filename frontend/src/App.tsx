import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/layout/PrivateRoute";

// Pages
import PredictPage from "./pages/Predict";
import HistoryPage from "./pages/History";
import HistoryDetailPage from "./pages/HistoryDetail";
import StatsPage from "./pages/Stats";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UsersPage from "./pages/admin/Users";
import NotFoundPage from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<Layout><PredictPage /></Layout>} />
        <Route path="/predict" element={<Layout><PredictPage /></Layout>} />
        <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
        <Route path="/history/:id" element={<Layout><HistoryDetailPage /></Layout>} />
        <Route path="/stats" element={<Layout><StatsPage /></Layout>} />
        <Route path="/profile" element={<Layout><div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">Hồ sơ người dùng</div></Layout>} />
        
        <Route 
          path="/admin/users" 
          element={
            <PrivateRoute roles={["admin"]}>
              <Layout><UsersPage /></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route path="/forbidden" element={<Layout><div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">Bạn không có quyền truy cập trang này.</div></Layout>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
