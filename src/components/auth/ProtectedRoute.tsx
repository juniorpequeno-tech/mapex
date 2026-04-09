import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireMasterAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin, requireMasterAdmin }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin, isMasterAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.status === "inativo") return <Navigate to="/login" replace />;

  if (requireMasterAdmin && !isMasterAdmin) return <Navigate to="/" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
