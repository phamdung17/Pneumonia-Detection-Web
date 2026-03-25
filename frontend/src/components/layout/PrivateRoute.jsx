import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loading from '../common/Loading';
import Forbidden from '../../pages/Forbidden';
import { useAuthStore } from '../../stores/authStore';

export default function PrivateRoute({ roles = [] }) {
  const location = useLocation();
  const { user, isAuthenticated, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return <div className="mx-auto max-w-xl p-10"><Loading lines={4} /></div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Forbidden />;
  }

  return <Outlet />;
}
