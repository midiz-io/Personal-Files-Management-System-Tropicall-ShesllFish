import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/Brand";
import { Loader2, Building2, ShieldCheck, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === "admin" ? "/admin" : "/portal", { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-emerald-100/40">
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center"><BrandLogo size={96} /></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Employee Personal Files
          </h1>
          <p className="text-xl font-semibold text-emerald-800">Employee File's</p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A secure portal for Employee File's to digitize, manage and verify
            employee personal files with digital identity cards.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <Feat icon={<Building2 className="h-8 w-8 text-emerald-600" />} title="Admin Managed" desc="Single admin manages all employee onboarding via secure invite QR codes." />
          <Feat icon={<Clock className="h-8 w-8 text-emerald-600" />} title="Live Tracking" desc="Real-time processing duration timer that persists across sessions." />
          <Feat icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />} title="Verifiable IDs" desc="Each approved employee gets a QR-verifiable digital identity card." />
        </div>
      </div>
    </div>
  );
};

function Feat({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-2">
      {icon}
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default Index;
