import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function RequireRole({ role, children }: { role: "admin" | "employee"; children: ReactNode }) {
  const { user, role: userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (userRole && userRole !== role) {
      navigate(userRole === "admin" ? "/admin" : "/portal", { replace: true });
    }
  }, [user, userRole, loading, role, navigate]);

  if (loading || !user || userRole !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}