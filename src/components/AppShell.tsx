import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandHeader } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user, role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14 sm:h-16 gap-2">
          <Link to={role === "admin" ? "/admin" : user ? "/portal" : "/"}>
            <BrandHeader />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">
                  {user.email} · <span className="capitalize font-medium">{role}</span>
                </span>
                <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={async () => { await signOut(); navigate("/auth"); }}>
                  <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="container py-4 sm:py-8 px-3 sm:px-6">{children}</main>
    </div>
  );
}