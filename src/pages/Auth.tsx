import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandHeader } from "@/components/Brand";
import { swalSuccess, swalError } from "@/lib/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite") || "";
  const { user, role, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">(inviteToken ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [token, setToken] = useState(inviteToken);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(role === "admin" ? "/admin" : "/portal", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      // Auto-create admin account if it doesn't exist yet
      if (
        email === "admin@gmail.com" &&
        password === "Admin@123" &&
        (error.message?.toLowerCase().includes("invalid") || error.message?.toLowerCase().includes("credentials"))
      ) {
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { full_name: "System Admin" },
          },
        });
        if (signErr) return swalError("Login failed", signErr.message);
        const { error: again } = await supabase.auth.signInWithPassword({ email, password });
        if (again) return swalError("Login failed", again.message);
        return swalSuccess("Welcome Admin", "Default admin account created.");
      }
      return swalError("Login failed", error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (token) {
      // Validate invite first
      const { data: validData, error: vErr } = await supabase.rpc("validate_invite", { _token: token });
      if (vErr || !validData || !validData[0]?.valid) {
        setBusy(false);
        return swalError("Invalid invite", "This invite token is invalid or expired.");
      }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: fullName },
      },
    });
    if (error) {
      setBusy(false);
      return swalError("Signup failed", error.message);
    }
    // Sign in immediately (auto-confirm enabled)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInErr && token) {
      await supabase.rpc("consume_invite", { _token: token });
    }
    setBusy(false);
    swalSuccess("Account created", "Welcome to Dutch Trails!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandHeader />
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Employee Personal Files</CardTitle>
            <CardDescription className="text-center">
              Employee File's
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up (Invite)</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="le">Email</Label>
                    <Input id="le" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="lp">Password</Label>
                    <Input id="lp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Login
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Default admin: <b>admin@gmail.com</b> / <b>Admin@123</b>
                  </p>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="tk">Invite Token (Optional)</Label>
                    <Input id="tk" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste invite token (optional)" />
                  </div>
                  <div>
                    <Label htmlFor="sn">Full Name</Label>
                    <Input id="sn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="se">Email</Label>
                    <Input id="se" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="sp">Password</Label>
                    <Input id="sp" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-4">
          <Link to="/" className="underline">← Home</Link>
        </p>
      </div>
    </div>
  );
}