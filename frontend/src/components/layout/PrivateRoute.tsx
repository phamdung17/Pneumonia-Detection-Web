import React from "react";
import { useLocation } from "react-router-dom";
import AccessGate from "./AccessGate";
import { useAuthStore, UserRole } from "../../stores/authStore";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, isBootstrapping } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="py-16 text-center text-slate-400">Dang khoi tao phien dang nhap...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <AccessGate
        mode="login"
        title="Can dang nhap de mo trang nay"
        description={`Trang ${location.pathname} yeu cau tai khoan hop le de truy cap du lieu that.`}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <AccessGate mode="forbidden" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
