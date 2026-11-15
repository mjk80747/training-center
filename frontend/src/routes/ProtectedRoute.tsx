import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession, type UserRole } from '../store/auth';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const location = useLocation();
  const user = getAuthSession();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
