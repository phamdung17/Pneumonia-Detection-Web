import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: Array<"admin" | "client">;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, isInitializing, hasInitialized } = useAuthStore();
  const location = useLocation();

  if (isInitializing || !hasInitialized) {
    return (
      <div className="flex h-screen items-center justify-center text-sm font-semibold text-slate-500">
        Dang khoi phuc phien dang nhap...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${location.pathname}`} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
