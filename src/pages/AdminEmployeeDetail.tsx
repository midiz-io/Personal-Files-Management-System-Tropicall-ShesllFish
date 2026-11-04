import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { swalSuccess, swalError, swalConfirm } from "@/lib/sweetalert";
import { Check, X, IdCard, Loader2, ArrowLeft, Pen, FileText, Upload, Plus, Trash } from "lucide-react";
import { fetchTotalSeconds, formatHMS } from "@/lib/timer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalSec, setTotalSec] = useState(0);
  const [sigOpen, setSigOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("employees").select("*").eq("id", id).single();
    setEmp(data);
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        nic: data.nic ?? "",
        date_of_birth: data.date_of_birth ?? "",
        gender: data.gender ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        emergency_contact_name: data.emergency_contact_name ?? "",
        emergency_contact_phone: data.emergency_contact_phone ?? "",
        designation: data.designation ?? "",
        department: data.department ?? "",
        branch: data.branch ?? "",
        date_of_joining: data.date_of_joining ?? "",
        photo_url: data.photo_url ?? "",
        nic_copy_url: data.nic_copy_url ?? "",
        certificates_url: data.certificates_url ?? "",
        bank_passbook_url: data.bank_passbook_url ?? "",
        gs_certificate_url: data.gs_certificate_url ?? "",
        bank_name: data.bank_name ?? "",
        bank_account_no: data.bank_account_no ?? "",
        bank_branch: data.bank_branch ?? "",
        epf_number: data.epf_number ?? "",
        etf_number: data.etf_number ?? "",
        // New columns
        religion: data.religion ?? "",
        marital_status: data.marital_status ?? "",
        spouse_name: data.spouse_name ?? "",
        children: Array.isArray(data.children) ? data.children : [],
        bank_account_holder: data.bank_account_holder ?? "",
        section: data.section ?? "",
        employment_conditions: data.employment_conditions ?? "",
        salary: data.salary ?? "",
        training_from: data.training_from ?? "",
        training_to: data.training_to ?? "",
        permanent_date: data.permanent_date ?? "",
        retirement_date: data.retirement_date ?? "",
        telephone: data.telephone ?? "",
        chk_cv: !!data.chk_cv,
        chk_nic_copy: !!data.chk_nic_copy,
        chk_birth_certificate: !!data.chk_birth_certificate,
        chk_gs_copy: !!data.chk_gs_copy,
        chk_edu_al: !!data.chk_edu_al,
        chk_edu_ol: !!data.chk_edu_ol,
        chk_edu_degree: !!data.chk_edu_degree,
        chk_edu_post_graduate: !!data.chk_edu_post_graduate,
        chk_prof_nvq: !!data.chk_prof_nvq,
        chk_prof_vta_naita: !!data.chk_prof_vta_naita,
        chk_prof_other: !!data.chk_prof_other,
        previous_employments: Array.isArray(data.previous_employments) ? data.previous_employments : [],
      });
    }
    const { total } = await fetchTotalSeconds(id);
    setTotalSec(total);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`employee-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees", filter: `id=eq.${id}` },
        (payload) => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (emp?.status !== "submitted") return;
    const t = window.setInterval(() => setTotalSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [emp?.status]);

  const approve = async () => {
    const c = await swalConfirm("Approve this personal file?");
    if (!c.isConfirmed) return;
    const { data: { user } } = await supabase.auth.getUser();
    const code = `DT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    await supabase.from("employees").update({
      status: "approved", approved_at: new Date().toISOString(),
      approved_by: user?.id, employee_code: code,
    }).eq("id", id!);
    await supabase.from("work_sessions").update({ ended_at: new Date().toISOString() })
      .eq("employee_id", id!).is("ended_at", null);
    swalSuccess("Approved", `Employee code: ${code}`);
    load();
  };

  const reject = async () => {
    const c = await swalConfirm("Reject this submission?");
    if (!c.isConfirmed) return;
    await supabase.from("employees").update({ status: "rejected" }).eq("id", id!);
    load();
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      date_of_joining: form.date_of_joining || null,
      training_from: form.training_from || null,
      training_to: form.training_to || null,
      permanent_date: form.permanent_date || null,
      retirement_date: form.retirement_date || null,
    };
    const { error } = await supabase.from("employees").update(payload).eq("id", id!);
    setSaving(false);
    if (error) return swalError("Save failed", error.message);
    swalSuccess("Saved", "Employee details updated successfully.");
    setIsEditing(false);
    load();
  };

  const upload = async (bucket: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${emp.user_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await upload("employee-photos", f);
      setForm((prev: any) => ({ ...prev, photo_url: url }));
    } catch (err: any) {
      swalError("Upload failed", err.message);
    }
  };

  const handleDoc = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await upload("employee-docs", f);
      setForm((prev: any) => ({ ...prev, [key]: url }));
    } catch (err: any) {
      swalError("Upload failed", err.message);
    }
  };

  const addChild = () => {
    setForm((prev: any) => ({
      ...prev,
      children: [...prev.children, { name: "", dob: "" }]
    }));
  };

  const removeChild = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      children: prev.children.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateChild = (idx: number, key: string, val: string) => {
    setForm((prev: any) => {
      const copy = [...prev.children];
      copy[idx] = { ...copy[idx], [key]: val };
      return { ...prev, children: copy };
    });
  };

  const addEmployment = () => {
    setForm((prev: any) => ({
      ...prev,
      previous_employments: [
        ...prev.previous_employments,
        { employer: "", years: "", position: "", period: "", certificate_checked: false }
      ]
    }));
  };

  const removeEmployment = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      previous_employments: prev.previous_employments.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateEmployment = (idx: number, key: string, val: any) => {
    setForm((prev: any) => {
      const copy = [...prev.previous_employments];
      copy[idx] = { ...copy[idx], [key]: val };
      return { ...prev, previous_employments: copy };
    });
  };

  // signature canvas
  const startDraw = (x: number, y: number) => { drawing.current = true; const ctx = canvasRef.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(x, y); };
  const moveDraw = (x: number, y: number) => { if (!drawing.current) return; const ctx = canvasRef.current!.getContext("2d")!; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0a0a0a"; ctx.lineTo(x, y); ctx.stroke(); };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => { const c = canvasRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); };
  const saveSig = async () => {
    const c = canvasRef.current!;
    const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/png")!);
    const path = `${emp.user_id}/sig-${Date.now()}.png`;
    const { error } = await supabase.storage.from("signatures").upload(path, blob, { upsert: true });
    if (error) return swalError("Upload failed", error.message);
    const { data } = supabase.storage.from("signatures").getPublicUrl(path);
    await supabase.from("employees").update({ signature_url: data.publicUrl }).eq("id", id!);
    swalSuccess("Signature saved");
    setSigOpen(false);
    load();
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></AppShell>;
  if (!emp) return <AppShell><p>Not found</p></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link to="/admin"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {isEditing ? (
              form.photo_url ? <img src={form.photo_url} alt="" className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded border shrink-0" /> : <div className="w-16 h-20 sm:w-20 sm:h-24 bg-muted rounded shrink-0 flex items-center justify-center text-xs text-muted-foreground text-center">No Photo</div>
            ) : (
              emp.photo_url ? <img src={emp.photo_url} alt="" className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded border shrink-0" /> : <div className="w-16 h-20 sm:w-20 sm:h-24 bg-muted rounded shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{isEditing ? form.full_name || "New Employee" : emp.full_name}</h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">
                {isEditing ? `${form.designation || "No Designation"} · ${form.department || "No Department"}` : `${emp.designation || "—"} · ${emp.department || "—"}`}
              </p>
              <Badge className="mt-2 capitalize">{emp.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Details
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {emp.status !== "approved" && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const url = `${window.location.origin}/fill-form/${emp.id}`;
                      await navigator.clipboard.writeText(url);
                      swalSuccess("Link Copied", "Anonymous form link has been copied to your clipboard!");
                    }}
                  >
                    Share Live Form Link
                  </Button>
                )}
                {emp.status === "submitted" && (
                  <>
                    <Button onClick={approve}><Check className="h-4 w-4" /> Approve</Button>
                    <Button variant="destructive" onClick={reject}><X className="h-4 w-4" /> Reject</Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)}><Pen className="h-4 w-4" /> Edit Details</Button>
                <Button variant="outline" onClick={() => setSigOpen(true)}><Pen className="h-4 w-4" /> Sign</Button>
                <Link to={`/admin/letters/${emp.id}`}>
                  <Button variant="outline" className="gap-1"><FileText className="h-4 w-4" /> Service Letters</Button>
                </Link>
                {emp.status === "approved" && <Link to={`/id-card/${emp.id}`}><Button variant="outline"><IdCard className="h-4 w-4" /> ID Card</Button></Link>}
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Processing Duration</div>
              <div className="text-2xl font-bold tabular-nums">{formatHMS(totalSec)}</div>
            </CardContent>
          </Card>
        )}

        {isEditing ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>NIC Number *</Label>
                  <Input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} placeholder="123456789V or 123456789012" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Male / Female / Other" />
                </div>
                <div>
                  <Label>Phone (Mobile) *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Telephone (Home)</Label>
                  <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Religion</Label>
                  <Input value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} />
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Input value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} placeholder="Married / Unmarried" />
                </div>
                <div>
                  <Label>Spouse Name</Label>
                  <Input value={form.spouse_name} onChange={(e) => setForm({ ...form, spouse_name: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Permanent Address *</Label>
                  <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            {/* Children Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Children Details</CardTitle>
                <Button type="button" size="sm" onClick={addChild} variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Child
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.children.map((c: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-end border p-3 rounded-lg bg-accent/10 relative">
                    <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Child Name</Label>
                        <Input value={c.name} onChange={(e) => updateChild(idx, "name", e.target.value)} placeholder="Child's full name" />
                      </div>
                      <div>
                        <Label>DOB</Label>
                        <Input type="date" value={c.dob} onChange={(e) => updateChild(idx, "dob", e.target.value)} />
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(idx)} className="text-destructive shrink-0 mb-0.5">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.children.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No children added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Employment Details</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Designation *</Label>
                  <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
                </div>
                <div>
                  <Label>Join Date</Label>
                  <Input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
                </div>
                <div>
                  <Label>Employment Conditions</Label>
                  <Input value={form.employment_conditions} onChange={(e) => setForm({ ...form, employment_conditions: e.target.value })} placeholder="e.g. Contract, Permanent" />
                </div>
                <div>
                  <Label>Salary</Label>
                  <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. Rs. 50,000" />
                </div>
                <div>
                  <Label>Permanent Date</Label>
                  <Input type="date" value={form.permanent_date} onChange={(e) => setForm({ ...form, permanent_date: e.target.value })} />
                </div>
                <div>
                  <Label>Retirement / End of Contract Date</Label>
                  <Input type="date" value={form.retirement_date} onChange={(e) => setForm({ ...form, retirement_date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Training From</Label>
                    <Input type="date" value={form.training_from} onChange={(e) => setForm({ ...form, training_from: e.target.value })} />
                  </div>
                  <div>
                    <Label>Training To</Label>
                    <Input type="date" value={form.training_to} onChange={(e) => setForm({ ...form, training_to: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank & EPF/ETF */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Bank & EPF/ETF Details</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input value={form.bank_branch} onChange={(e) => setForm({ ...form, bank_branch: e.target.value })} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input value={form.bank_account_no} onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })} />
                </div>
                <div>
                  <Label>Account Holder Name</Label>
                  <Input value={form.bank_account_holder} onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })} />
                </div>
                <div>
                  <Label>EPF Number</Label>
                  <Input value={form.epf_number} onChange={(e) => setForm({ ...form, epf_number: e.target.value })} />
                </div>
                <div>
                  <Label>ETF Number</Label>
                  <Input value={form.etf_number} onChange={(e) => setForm({ ...form, etf_number: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Emergency Contact Details</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            {/* Document Checklist */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Document Checklist</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ["chk_cv", "CV"],
                  ["chk_nic_copy", "NIC Copy"],
                  ["chk_birth_certificate", "Birth Certificate"],
                  ["chk_gs_copy", "G.S. Copy"],
                  ["chk_edu_al", "A/L Qualification"],
                  ["chk_edu_ol", "O/L Qualification"],
                  ["chk_edu_degree", "Degree Qualification"],
                  ["chk_edu_post_graduate", "Post Graduate"],
                  ["chk_prof_nvq", "NVQ Qualification"],
                  ["chk_prof_vta_naita", "VTA / NAITA"],
                  ["chk_prof_other", "Other Professional"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/10 transition">
                    <Checkbox
                      id={key}
                      checked={form[key]}
                      onCheckedChange={(checked) => setForm({ ...form, [key]: !!checked })}
                    />
                    <Label htmlFor={key} className="cursor-pointer text-sm font-medium">{label}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Previous Employment Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Previous Employment Details</CardTitle>
                <Button type="button" size="sm" onClick={addEmployment} variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Employment Row
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Employer</th>
                      <th className="text-left p-3">Years of Experience</th>
                      <th className="text-left p-3">Position</th>
                      <th className="text-left p-3">From - To</th>
                      <th className="text-center p-3">Service Certificate Check</th>
                      <th className="text-right p-3">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.previous_employments.map((pe: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          <Input value={pe.employer} onChange={(e) => updateEmployment(idx, "employer", e.target.value)} placeholder="Employer name" className="h-9" />
                        </td>
                        <td className="p-2 w-32">
                          <Input value={pe.years} onChange={(e) => updateEmployment(idx, "years", e.target.value)} placeholder="e.g. 2 years" className="h-9" />
                        </td>
                        <td className="p-2">
                          <Input value={pe.position} onChange={(e) => updateEmployment(idx, "position", e.target.value)} placeholder="Position" className="h-9" />
                        </td>
                        <td className="p-2 w-40">
                          <Input value={pe.period} onChange={(e) => updateEmployment(idx, "period", e.target.value)} placeholder="e.g. 2020-2022" className="h-9" />
                        </td>
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={pe.certificate_checked}
                            onCheckedChange={(checked) => updateEmployment(idx, "certificate_checked", !!checked)}
                            className="mx-auto"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeEmployment(idx)} className="text-destructive">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {form.previous_employments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No previous employment rows added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Profile Photo Upload */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Profile Photo</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-4">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Profile" className="w-24 h-28 object-cover rounded border" />
                ) : (
                  <div className="w-24 h-28 bg-muted rounded border flex items-center justify-center text-muted-foreground text-xs text-center">No photo</div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  <Button asChild variant="outline" className="gap-2">
                    <span><Upload className="h-4 w-4" /> Upload Photo</span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            {/* Documents Upload */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Verification Documents</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <DocUploaderAdmin label="NIC Copy" url={form.nic_copy_url} onChange={(e) => handleDoc("nic_copy_url", e)} />
                <DocUploaderAdmin label="Certificates" url={form.certificates_url} onChange={(e) => handleDoc("certificates_url", e)} />
                <DocUploaderAdmin label="Bank Passbook" url={form.bank_passbook_url} onChange={(e) => handleDoc("bank_passbook_url", e)} />
                <DocUploaderAdmin label="GS Certificate" url={form.gs_certificate_url} onChange={(e) => handleDoc("gs_certificate_url", e)} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <DetailGrid emp={emp} />
        )}
      </div>

      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Commissioner E-Signature</DialogTitle></DialogHeader>
          <canvas
            ref={canvasRef} width={500} height={180}
            className="border rounded bg-white touch-none w-full"
            onMouseDown={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); startDraw(e.clientX - r.left, e.clientY - r.top); }}
            onMouseMove={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); moveDraw(e.clientX - r.left, e.clientY - r.top); }}
            onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={(e) => { const t = e.touches[0]; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); startDraw(t.clientX - r.left, t.clientY - r.top); }}
            onTouchMove={(e) => { const t = e.touches[0]; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); moveDraw(t.clientX - r.left, t.clientY - r.top); }}
            onTouchEnd={endDraw}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={clearSig}>Clear</Button>
            <Button onClick={saveSig}>Save Signature</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function DocUploaderAdmin({ label, url, onChange }: { label: string; url?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View</a>}
      </div>
      <label className="cursor-pointer block">
        <input type="file" className="hidden" onChange={onChange} accept="image/*,application/pdf" />
        <div className="border-2 border-dashed rounded-md p-3 text-center text-xs text-muted-foreground hover:bg-accent/40 transition">
          <Upload className="h-4 w-4 inline mr-1" /> {url ? "Replace file" : "Click to upload"}
        </div>
      </label>
    </div>
  );
}

function DetailGrid({ emp }: { emp: any }) {
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(emp.date_of_birth);

  const sections: Array<{ title: string; items: Array<[string, any]> }> = [
    {
      title: "Basic Details",
      items: [
        ["NIC", emp.nic],
        ["DOB", emp.date_of_birth],
        ["Age", age !== null ? `${age} years` : null],
        ["Gender", emp.gender],
        ["Phone (Mobile)", emp.phone],
        ["Telephone (Home)", emp.telephone],
        ["Email", emp.email],
        ["Address", emp.address],
        ["Religion", emp.religion],
        ["Marital Status", emp.marital_status],
        ["Spouse Name", emp.spouse_name],
      ]
    },
    {
      title: "Employment Details",
      items: [
        ["Designation", emp.designation],
        ["Department", emp.department],
        ["Branch", emp.branch],
        ["Join Date", emp.date_of_joining],
        ["Section", emp.section],
        ["Employment Conditions", emp.employment_conditions],
        ["Salary", emp.salary],
        ["Training Period", emp.training_from && emp.training_to ? `${emp.training_from} to ${emp.training_to}` : null],
        ["Permanent Date", emp.permanent_date],
        ["Retirement/End of Contract", emp.retirement_date],
        ["Employee Code", emp.employee_code],
      ]
    },
    {
      title: "Bank & EPF/ETF",
      items: [
        ["Bank Name", emp.bank_name],
        ["Branch", emp.bank_branch],
        ["Account Number", emp.bank_account_no],
        ["Account Holder Name", emp.bank_account_holder],
        ["EPF Number", emp.epf_number],
        ["ETF Number", emp.etf_number],
      ]
    },
    {
      title: "Emergency Contacts",
      items: [
        ["Name", emp.emergency_contact_name],
        ["Phone", emp.emergency_contact_phone]
      ]
    },
  ];

  const docs: Array<[string, string | null]> = [
    ["NIC Copy", emp.nic_copy_url],
    ["Certificates", emp.certificates_url],
    ["Bank Passbook", emp.bank_passbook_url],
    ["GS Certificate", emp.gs_certificate_url],
    ["Signature", emp.signature_url],
  ];

  const checklistItems = [
    { label: "CV", checked: emp.chk_cv },
    { label: "NIC Copy", checked: emp.chk_nic_copy },
    { label: "Birth Certificate", checked: emp.chk_birth_certificate },
    { label: "G.S. Copy", checked: emp.chk_gs_copy },
    { label: "A/L Qualification", checked: emp.chk_edu_al },
    { label: "O/L Qualification", checked: emp.chk_edu_ol },
    { label: "Degree Qualification", checked: emp.chk_edu_degree },
    { label: "Post Graduate", checked: emp.chk_edu_post_graduate },
    { label: "NVQ Qualification", checked: emp.chk_prof_nvq },
    { label: "VTA / NAITA", checked: emp.chk_prof_vta_naita },
    { label: "Other Professional", checked: emp.chk_prof_other },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {s.items.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-muted/30 py-1 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Children list */}
      <Card className="sm:col-span-2">
        <CardHeader><CardTitle className="text-base">Children Details</CardTitle></CardHeader>
        <CardContent>
          {Array.isArray(emp.children) && emp.children.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {emp.children.map((c: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg bg-accent/20 flex justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">DOB: {c.dob || "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No children registered</p>
          )}
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card className="sm:col-span-2">
        <CardHeader><CardTitle className="text-base">Document Checklist</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {checklistItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2 border rounded-lg bg-accent/10 text-sm">
              {item.checked ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span className={item.checked ? "font-medium" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Previous Employment Table */}
      <Card className="sm:col-span-2">
        <CardHeader><CardTitle className="text-base">Previous Employment Details</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Employer</th>
                <th className="text-left p-3">Years of Experience</th>
                <th className="text-left p-3">Position</th>
                <th className="text-left p-3">From - To</th>
                <th className="text-center p-3">Service Certificate Check</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(emp.previous_employments) && emp.previous_employments.length > 0 ? (
                emp.previous_employments.map((pe: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3 font-medium">{pe.employer}</td>
                    <td className="p-3">{pe.years}</td>
                    <td className="p-3">{pe.position}</td>
                    <td className="p-3">{pe.period}</td>
                    <td className="p-3 text-center">
                      {pe.certificate_checked ? (
                        <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-rose-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No previous employment records registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <Card className="sm:col-span-2">
        <CardHeader><CardTitle className="text-base">Uploaded Proof Documents</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {docs.map(([k, u]) => (
            <div key={k} className="border rounded-lg p-3 text-sm flex justify-between items-center bg-card">
              <div>
                <div className="font-semibold">{k}</div>
                {u ? (
                  <span className="text-xs text-emerald-600 font-medium">Uploaded</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not uploaded</span>
                )}
              </div>
              {u && (
                <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline font-medium">
                  Open File
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}