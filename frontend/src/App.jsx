import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/layout/PrivateRoute';
import Batch from './pages/Batch';
import Forbidden from './pages/Forbidden';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Predict from './pages/Predict';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Stats from './pages/Stats';
import Audit from './pages/admin/Audit';
import Users from './pages/admin/Users';

function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/predict" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/predict" element={<Predict />} />
        <Route path="/batch" element={<Batch />} />
        <Route path="/history" element={<History />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/history/:id" element={<HistoryDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute roles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/audit" element={<Audit />} />
        </Route>
      </Route>

      <Route path="/403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
