import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { swalSuccess, swalError, swalConfirm, swalToast } from "@/lib/sweetalert";
import { QrCode, UserPlus, Check, X, Eye, Copy, Trash2, IdCard, Plus, Loader2, Palette, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { DynamicIdCard } from "@/components/DynamicIdCard";
import {
  DEFAULT_ID_CARD_TEMPLATE,
  IdCardTemplateConfig,
  loadPublishedTemplate,
  subscribeToTemplateChanges,
} from "@/lib/id-card-template";

interface Employee {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface Invite {
  id: string;
  token: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [cardTemplate, setCardTemplate] = useState<IdCardTemplateConfig>(DEFAULT_ID_CARD_TEMPLATE);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("Employee@123");
  const [addBusy, setAddBusy] = useState(false);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !addName || !addPassword) {
      return swalError("Missing fields", "Please fill in all fields.");
    }
    setAddBusy(true);
    try {
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false } }
      );

      const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
        email: addEmail,
        password: addPassword,
        options: {
          data: { full_name: addName }
        }
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("No user returned from signup");

      const { error: insertError } = await tempSupabase.from("employees").insert({
        user_id: signUpData.user.id,
        full_name: addName,
        email: addEmail,
        status: "draft"
      });

      if (insertError) throw insertError;

      swalSuccess("Success", `Employee account created!\nEmail: ${addEmail}\nPassword: ${addPassword}`);
      setAddOpen(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("Employee@123");
      load();
    } catch (err: any) {
      swalError("Failed to add employee", err.message);
    } finally {
      setAddBusy(false);
    }
  };

  const load = async () => {
    const { data: emps } = await supabase
      .from("employees")
      .select("id,user_id,full_name,email,designation,department,status,submitted_at,approved_at,created_at")
      .order("created_at", { ascending: false });
    const { data: invs } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    setEmployees(emps ?? []);
    setInvites(invs ?? []);
    const tmpl = await loadPublishedTemplate();
    setCardTemplate(tmpl);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-dashboard-employees")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload) => {
          load();
        }
      )
      .subscribe();

    const unsubTemplate = subscribeToTemplateChanges((newT) => {
      setCardTemplate(newT);
    });

    return () => {
      supabase.removeChannel(channel);
      unsubTemplate();
    };
  }, []);

  const generateInvite = async () => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("invites")
      .insert({ token, created_by: user?.id });
    if (error) return swalError("Failed", error.message);
    const url = `${window.location.origin}/auth?invite=${token}`;
    const qr = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    setQrToken(url);
    setQrUrl(qr);
    load();
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`;
    await navigator.clipboard.writeText(url);
    swalToast.fire({ icon: "success", title: "Invite link copied" });
  };

  const showQr = async (token: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`;
    const qr = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    setQrToken(url);
    setQrUrl(qr);
  };

  const deleteInvite = async (id: string) => {
    const c = await swalConfirm("Delete invite?", "This invite link will stop working.");
    if (!c.isConfirmed) return;
    await supabase.from("invites").delete().eq("id", id);
    load();
  };

  const approve = async (emp: Employee) => {
    const c = await swalConfirm("Approve this personal file?", emp.full_name || emp.email || "");
    if (!c.isConfirmed) return;
    const { data: { user } } = await supabase.auth.getUser();
    const code = `DT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const { error } = await supabase
      .from("employees")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        employee_code: code,
      })
      .eq("id", emp.id);
    if (error) return swalError("Failed", error.message);
    // stop active timer
    await supabase
      .from("work_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("employee_id", emp.id)
      .is("ended_at", null);
    swalSuccess("Approved", `Employee code: ${code}`);
    load();
  };

  const reject = async (emp: Employee) => {
    const c = await swalConfirm("Reject this submission?", "Employee can edit and resubmit.");
    if (!c.isConfirmed) return;
    await supabase
      .from("employees")
      .update({ status: "rejected" })
      .eq("id", emp.id);
    load();
  };

  const pending = employees.filter((e) => e.status === "submitted");
  const approved = employees.filter((e) => e.status === "approved");
  const others = employees.filter((e) => !["submitted", "approved"].includes(e.status));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Manage employee personal files for Employee File's</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Link to="/admin/id-card-designer">
              <Button variant="outline" className="gap-2 w-full sm:w-auto border-emerald-600/30 hover:border-emerald-600">
                <Palette className="h-4 w-4 text-emerald-600" /> <span>ID Card Designer</span>
              </Button>
            </Link>
            <Button onClick={() => setAddOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> <span>Add Employee</span>
            </Button>
            <Button onClick={generateInvite} className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" /> <span className="truncate">Generate Invite QR</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Pending Approval" value={pending.length} accent="warning" />
          <StatCard label="Approved" value={approved.length} accent="success" />
          <StatCard label="Active Invites" value={invites.filter(i => !i.used_at).length} accent="info" />
        </div>

        <Tabs defaultValue="pending">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="other">Other ({others.length})</TabsTrigger>
              <TabsTrigger value="invites">Invites ({invites.length})</TabsTrigger>
              <TabsTrigger value="id-template">ID Card Template</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="pending">
            <EmployeeTable rows={pending} actions={(e) => (
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={() => approve(e)}><Check className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => reject(e)}><X className="h-4 w-4" /> Reject</Button>
              </div>
            )} />
          </TabsContent>
          <TabsContent value="approved">
            <EmployeeTable rows={approved} actions={(e) => (
              <div className="flex gap-2">
                <Link to={`/id-card/${e.id}`}><Button size="sm" variant="outline"><IdCard className="h-4 w-4" /> ID Card</Button></Link>
              </div>
            )} />
          </TabsContent>
          <TabsContent value="other">
            <EmployeeTable rows={others} />
          </TabsContent>
          <TabsContent value="invites">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="bg-muted/50"><tr>
                    <th className="text-left p-3">Token</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Expires</th>
                    <th className="text-right p-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {invites.map(i => (
                      <tr key={i.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{i.token.slice(0, 12)}…</td>
                        <td className="p-3">{i.used_at ? <Badge variant="secondary">Used</Badge> : new Date(i.expires_at) < new Date() ? <Badge variant="destructive">Expired</Badge> : <Badge>Active</Badge>}</td>
                        <td className="p-3">{new Date(i.expires_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => showQr(i.token)}><QrCode className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => copyLink(i.token)}><Copy className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteInvite(i.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invites.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No invites yet</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="id-template" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5 text-emerald-600" /> Active Global ID Card Template
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    All employee ID cards currently render using this design format.
                  </p>
                </div>
                <Link to="/admin/id-card-designer">
                  <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold">
                    <Sparkles className="h-4 w-4" /> Open Designer Studio
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
                  <div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Template Style</div>
                    <div className="font-semibold text-foreground text-sm mt-0.5">{cardTemplate.templateName}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Header Title</div>
                    <div className="font-semibold text-foreground text-sm mt-0.5">{cardTemplate.headerTitle}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Signatory Authority</div>
                    <div className="font-semibold text-foreground text-sm mt-0.5">{cardTemplate.signatoryTitle} ({cardTemplate.signatoryOrg})</div>
                  </div>
                </div>

                <div className="overflow-x-auto flex justify-center py-4 bg-muted/10 rounded-xl border">
                  <DynamicIdCard
                    emp={{
                      id: "preview-id",
                      employee_code: "DT-PREVIEW",
                      full_name: "Kasun Malinda Silva",
                      nic: "199423801290",
                      designation: "Senior Safari Tour Lead",
                      department: "Eco Trails & Guiding",
                      date_of_birth: "1994-08-25",
                      gender: "Male",
                      created_at: new Date().toISOString(),
                      approved_at: new Date().toISOString(),
                      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                    }}
                    template={cardTemplate}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!qrUrl} onOpenChange={(o) => !o && setQrUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite QR Code</DialogTitle>
          </DialogHeader>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4">
              <img src={qrUrl} alt="Invite QR" className="rounded-lg border max-w-full h-auto" />
              <p className="text-xs text-muted-foreground break-all text-center">{qrToken}</p>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button onClick={async () => { await navigator.clipboard.writeText(qrToken); swalToast.fire({ icon: "success", title: "Link copied" }); }}>
                  <Copy className="h-4 w-4" /> Copy Link
                </Button>
                <a href={qrUrl} download="invite-qr.png">
                  <Button variant="outline">Download</Button>
                </a>
                <Button variant="outline" onClick={() => {
                  if (navigator.share) navigator.share({ url: qrToken, title: "Dutch Trails Invite" });
                  else { navigator.clipboard.writeText(qrToken); swalToast.fire({ icon: "info", title: "Link copied — share it" }); }
                }}>Share</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="add_name">Full Name</Label>
              <Input
                id="add_name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="add_email">Email</Label>
              <Input
                id="add_email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="add_password">Initial Password</Label>
              <Input
                id="add_password"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addBusy}>
                {addBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "warning" | "success" | "info" }) {
  const colors = {
    warning: "from-amber-500/20 to-amber-500/5 text-amber-700",
    success: "from-emerald-500/20 to-emerald-500/5 text-emerald-700",
    info: "from-blue-500/20 to-blue-500/5 text-blue-700",
  } as const;
  return (
    <Card className={`bg-gradient-to-br ${colors[accent]}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="text-xs sm:text-sm font-medium opacity-80">{label}</div>
        <div className="text-2xl sm:text-4xl font-bold mt-1 sm:mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmployeeTable({ rows, actions }: { rows: Employee[]; actions?: (e: Employee) => React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/50"><tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Designation</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Submitted</th>
            <th className="text-right p-3">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.full_name || "—"}</td>
                <td className="p-3 text-muted-foreground">{e.email}</td>
                <td className="p-3">{e.designation || "—"}</td>
                <td className="p-3"><StatusBadge status={e.status} /></td>
                <td className="p-3 text-muted-foreground">{e.submitted_at ? new Date(e.submitted_at).toLocaleString() : "—"}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <Link to={`/admin/employee/${e.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link>
                    {actions?.(e)}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records</td></tr>}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", submitted: "secondary", approved: "default", rejected: "destructive",
  };
  return <Badge variant={map[status] || "outline"} className="capitalize">{status}</Badge>;
}