import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { lookupNIC } from "@/lib/nic-lookup";
import { swalSuccess, swalError, swalConfirm, swalInfo } from "@/lib/sweetalert";
import { fetchTotalSeconds, formatHMS, startSessionIfNone, stopActiveSession } from "@/lib/timer";
import { Loader2, Upload, CheckCircle2, IdCard, Clock, Plus, Trash } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

type EmpForm = {
  full_name: string; nic: string; date_of_birth: string; gender: string; address: string; phone: string;
  email: string; emergency_contact_name: string; emergency_contact_phone: string;
  designation: string; department: string; branch: string; date_of_joining: string;
  bank_name: string; bank_account_no: string; bank_branch: string; epf_number: string; etf_number: string;
  // new columns
  religion: string; marital_status: string; spouse_name: string; telephone: string;
  bank_account_holder: string; section: string; employment_conditions: string; salary: string;
  training_from: string; training_to: string; permanent_date: string; retirement_date: string;
  children: Array<{ name: string; dob: string }>;
  previous_employments: Array<{ employer: string; years: string; position: string; period: string; certificate_checked: boolean }>;
};

const empty: EmpForm = {
  full_name: "", nic: "", date_of_birth: "", gender: "", address: "", phone: "", email: "",
  emergency_contact_name: "", emergency_contact_phone: "",
  designation: "", department: "", branch: "", date_of_joining: "",
  bank_name: "", bank_account_no: "", bank_branch: "", epf_number: "", etf_number: "",
  // new columns
  religion: "", marital_status: "", spouse_name: "", telephone: "",
  bank_account_holder: "", section: "", employment_conditions: "", salary: "",
  training_from: "", training_to: "", permanent_date: "", retirement_date: "",
  children: [],
  previous_employments: [],
};

export default function EmployeePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: urlId } = useParams<{ id: string }>();

  const [form, setForm] = useState<EmpForm>(empty);
  const [empId, setEmpId] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ nic_copy_url?: string; certificates_url?: string; bank_passbook_url?: string; gs_certificate_url?: string }>({});
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeCode, setEmployeeCode] = useState<string | null>(null);

  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Timer
  const [totalSec, setTotalSec] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (urlId || user) {
      load();
    } else {
      setLoading(false);
    }
  }, [user, urlId]);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("employees").select("*");
    if (urlId) {
      query = query.eq("id", urlId);
    } else if (user) {
      query = query.eq("user_id", user.id);
    } else {
      setLoading(false);
      return;
    }

    const { data } = await query.maybeSingle();
    if (data) {
      if (urlId && (data.status === "submitted" || data.status === "approved")) {
        setAccessDenied(data.status);
        setLoading(false);
        return;
      }
      setEmpId(data.id);
      setDbUserId(data.user_id);
      setStatus(data.status);
      setSubmittedAt(data.submitted_at);
      setApprovedAt(data.approved_at);
      setPhotoUrl(data.photo_url);
      setEmployeeCode(data.employee_code);
      setDocs({
        nic_copy_url: data.nic_copy_url ?? undefined,
        certificates_url: data.certificates_url ?? undefined,
        bank_passbook_url: data.bank_passbook_url ?? undefined,
        gs_certificate_url: data.gs_certificate_url ?? undefined,
      });
      setForm({
        full_name: data.full_name ?? "", nic: data.nic ?? "",
        date_of_birth: data.date_of_birth ?? "", gender: data.gender ?? "",
        address: data.address ?? "", phone: data.phone ?? "", email: data.email ?? user?.email ?? "",
        emergency_contact_name: data.emergency_contact_name ?? "", emergency_contact_phone: data.emergency_contact_phone ?? "",
        designation: data.designation ?? "", department: data.department ?? "", branch: data.branch ?? "", date_of_joining: data.date_of_joining ?? "",
        bank_name: data.bank_name ?? "", bank_account_no: data.bank_account_no ?? "", bank_branch: data.bank_branch ?? "",
        epf_number: data.epf_number ?? "", etf_number: data.etf_number ?? "",
        religion: data.religion ?? "", marital_status: data.marital_status ?? "", spouse_name: data.spouse_name ?? "", telephone: data.telephone ?? "",
        bank_account_holder: data.bank_account_holder ?? "",
        section: data.section ?? "", employment_conditions: data.employment_conditions ?? "", salary: data.salary ?? "",
        training_from: data.training_from ?? "", training_to: data.training_to ?? "",
        permanent_date: data.permanent_date ?? "", retirement_date: data.retirement_date ?? "",
        children: Array.isArray(data.children) ? data.children : [],
        previous_employments: Array.isArray(data.previous_employments) ? data.previous_employments : [],
      });
    } else {
      if (user) {
        setForm({ ...empty, email: user.email ?? "" });
        setDbUserId(user.id);
      }
    }
    setLoading(false);
  };

  // Live timer logic
  useEffect(() => {
    if (!empId) return;
    let cancelled = false;
    const init = async () => {
      if (status === "submitted") {
        const targetUserId = dbUserId || user?.id;
        if (targetUserId) {
          await startSessionIfNone(empId, targetUserId);
        }
      } else if (status === "approved" || status === "draft" || status === "rejected") {
        if (status !== "approved") await stopActiveSession(empId);
      }
      const { total } = await fetchTotalSeconds(empId);
      if (!cancelled) {
        setTotalSec(total);
        if (tickRef.current) window.clearInterval(tickRef.current);
        if (status === "submitted") {
          tickRef.current = window.setInterval(() => setTotalSec((s) => s + 1), 1000) as unknown as number;
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [empId, status, user, dbUserId]);

  const onNicBlur = async () => {
    if (!form.nic) return;
    const result = await lookupNIC(form.nic);
    if (result.ok && result.data) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || result.data!.full_name || f.full_name,
        address: f.address || result.data!.address || f.address,
        date_of_birth: result.data!.date_of_birth || f.date_of_birth,
        gender: result.data!.gender || f.gender,
      }));
      const tag = result.source === "external" ? "Verified online" : "Decoded locally";
      swalInfo(
        `NIC ${tag}`,
        `${result.data.date_of_birth ?? ""} · ${result.data.gender ?? ""}${
          result.data.age ? ` · Age ${result.data.age}` : ""
        }${result.message ? `\n${result.message}` : ""}`,
      );
    } else {
      swalInfo(
        "NIC not verified",
        result.message ||
          "We couldn't auto-fill from this NIC. Please enter the details manually — you can still submit the form.",
      );
    }
  };

  const upload = async (bucket: string, file: File) => {
    const ext = file.name.split(".").pop();
    const folder = empId || user?.id;
    if (!folder) throw new Error("No upload folder path available (missing session or employee ID).");
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await upload("employee-photos", f); setPhotoUrl(url); }
    catch (err: any) { swalError("Upload failed", err.message); }
  };

  const handleDoc = async (key: keyof typeof docs, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await upload("employee-docs", f); setDocs((d) => ({ ...d, [key]: url })); }
    catch (err: any) { swalError("Upload failed", err.message); }
  };

  const saveDraft = async (submitting = false) => {
    if (!user && !empId) return swalError("Error", "No session or employee record found to save.");
    setSaving(true);
    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      date_of_joining: form.date_of_joining || null,
      training_from: form.training_from || null,
      training_to: form.training_to || null,
      permanent_date: form.permanent_date || null,
      retirement_date: form.retirement_date || null,
      photo_url: photoUrl,
      ...docs,
      status: submitting ? "submitted" : "draft",
      submitted_at: submitting ? new Date().toISOString() : null,
    } as any;

    if (submitting && !employeeCode) {
      const code = `DT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      payload.employee_code = code;
    }

    let query;
    if (empId) {
      query = supabase
        .from("employees")
        .update(payload)
        .eq("id", empId)
        .select()
        .single();
    } else if (user) {
      payload.user_id = user.id;
      query = supabase
        .from("employees")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
    } else {
      setSaving(false);
      return;
    }

    const { data, error } = await query;
    setSaving(false);
    if (error) return swalError("Save failed", error.message);
    setEmpId(data.id);
    setStatus(data.status);
    setSubmittedAt(data.submitted_at);
    setEmployeeCode(data.employee_code);
    if (submitting) {
      await startSessionIfNone(data.id, data.user_id);
      setIsSubmittedSuccess(true);
      swalSuccess("Submitted!", "Your personal file is now pending admin approval. The processing timer has started.");
    } else {
      swalSuccess("Saved", "Draft saved successfully.");
    }
  };

  const handleSubmit = async () => {
    const required = ["full_name", "nic", "phone", "address", "designation"] as const;
    for (const k of required) {
      if (!form[k]) return swalError("Missing fields", `Please fill in ${k.replace(/_/g, " ")}`);
    }
    if (!photoUrl) return swalError("Photo required", "Please upload your profile photo.");
    const c = await swalConfirm("Submit personal file?", "Once submitted you cannot edit until admin reviews it.");
    if (!c.isConfirmed) return;
    saveDraft(true);
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></AppShell>;

  if (isSubmittedSuccess) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">File Submitted!</h1>
          <p className="text-muted-foreground">
            Thank you! Your personal file has been successfully submitted for review.
          </p>
          <div className="bg-card border rounded-lg p-6 text-left space-y-3">
            <div className="text-sm text-muted-foreground font-semibold">
              What happens next?
            </div>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>An administrator will review your submitted documents and details.</li>
              <li>Your processing timer has started and is tracking review speed.</li>
              <li>Once approved, you will receive your digital ID card.</li>
            </ul>
          </div>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Go to Login
          </Button>
        </div>
      </AppShell>
    );
  }

  if (accessDenied) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-2">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Already Submitted</h1>
          <p className="text-muted-foreground">
            This personal file has already been {accessDenied === "approved" ? "approved" : "submitted for review"}.
          </p>
          <p className="text-sm text-muted-foreground">
            Anonymous access is no longer active. If you need to make corrections, please contact your administrator.
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Go to Login
          </Button>
        </div>
      </AppShell>
    );
  }

  const readOnly = status === "submitted" || status === "approved";

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Personal File</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Fill, submit, and track approval</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={status} />
            {status === "approved" && empId && (
              <Link to={`/id-card/${empId}`}>
                <Button variant="outline" className="gap-2"><IdCard className="h-4 w-4" /> View Digital ID</Button>
              </Link>
            )}
          </div>
        </div>

        {(status === "submitted" || status === "approved") && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{status === "approved" ? "Total Processing Duration" : "Processing Duration (Live)"}</div>
                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{formatHMS(totalSec)}</div>
                {submittedAt && <div className="text-xs text-muted-foreground mt-1">Submitted: {new Date(submittedAt).toLocaleString()}</div>}
                {approvedAt && <div className="text-xs text-emerald-700 mt-0.5">Approved: {new Date(approvedAt).toLocaleString()}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {status === "approved" && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-700">Your personal files are approved!</div>
                <div className="text-sm text-muted-foreground">You may now view and share your digital ID card.</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Section title="Profile Photo">
          <div className="flex items-center gap-4">
            {photoUrl ? <img src={photoUrl} alt="Profile" className="w-24 h-28 object-cover rounded border" /> : <div className="w-24 h-28 bg-muted rounded border flex items-center justify-center text-muted-foreground text-xs text-center">No photo</div>}
            {!readOnly && (
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4" /> Upload Photo</span></Button>
              </label>
            )}
          </div>
        </Section>

        <Section title="Basic Information">
          <Grid>
            <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} disabled={readOnly} />
            <Field label="NIC Number *" value={form.nic} onChange={(v) => setForm({ ...form, nic: v })} onBlur={onNicBlur} disabled={readOnly} placeholder="123456789V or 123456789012" />
            <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} disabled={readOnly} />
            <div>
              <Label>Age</Label>
              <Input
                value={form.date_of_birth ? `${Math.floor((Date.now() - new Date(form.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : "—"}
                disabled
              />
            </div>
            <Field label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} disabled={readOnly} />
            <Field label="Phone (Mobile) *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} disabled={readOnly} />
            <Field label="Telephone (Home)" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} disabled={readOnly} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled={readOnly} />
            <Field label="Religion" value={form.religion} onChange={(v) => setForm({ ...form, religion: v })} disabled={readOnly} />
            <Field label="Marital Status" value={form.marital_status} onChange={(v) => setForm({ ...form, marital_status: v })} disabled={readOnly} placeholder="Married / Unmarried" />
            <Field label="Spouse Name" value={form.spouse_name} onChange={(v) => setForm({ ...form, spouse_name: v })} disabled={readOnly} />
            <div className="md:col-span-2">
              <Label>Permanent Address *</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={readOnly} />
            </div>
            <Field label="Emergency Contact Name" value={form.emergency_contact_name} onChange={(v) => setForm({ ...form, emergency_contact_name: v })} disabled={readOnly} />
            <Field label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={(v) => setForm({ ...form, emergency_contact_phone: v })} disabled={readOnly} />
          </Grid>
        </Section>

        {/* Children Details */}
        <Section title="Children Details">
          <div className="space-y-3">
            {!readOnly && (
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={() => setForm({ ...form, children: [...form.children, { name: "", dob: "" }] })} variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Child
                </Button>
              </div>
            )}
            {form.children.map((c: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-end border p-3 rounded-lg bg-accent/10 relative">
                <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Child Name</Label>
                    <Input
                      value={c.name}
                      onChange={(e) => {
                        const copy = [...form.children];
                        copy[idx] = { ...copy[idx], name: e.target.value };
                        setForm({ ...form, children: copy });
                      }}
                      disabled={readOnly}
                      placeholder="Child's full name"
                    />
                  </div>
                  <div>
                    <Label>DOB</Label>
                    <Input
                      type="date"
                      value={c.dob}
                      onChange={(e) => {
                        const copy = [...form.children];
                        copy[idx] = { ...copy[idx], dob: e.target.value };
                        setForm({ ...form, children: copy });
                      }}
                      disabled={readOnly}
                    />
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm({ ...form, children: form.children.filter((_: any, i: number) => i !== idx) });
                    }}
                    className="text-destructive shrink-0 mb-0.5"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {form.children.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No children registered</p>
            )}
          </div>
        </Section>

        <Section title="Employment Details">
          <Grid>
            <Field label="Designation *" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} disabled={readOnly} />
            <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} disabled={readOnly} />
            <Field label="Branch" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} disabled={readOnly} />
            <Field label="Date of Joining" type="date" value={form.date_of_joining} onChange={(v) => setForm({ ...form, date_of_joining: v })} disabled={readOnly} />
          </Grid>
        </Section>

        {/* Office Info display if set */}
        {(form.section || form.employment_conditions || form.salary || form.training_from || form.permanent_date || form.retirement_date) && (
          <Section title="Office Details (Read-Only)">
            <Grid>
              <div>
                <Label>Section</Label>
                <Input value={form.section || "—"} disabled />
              </div>
              <div>
                <Label>Employment Conditions</Label>
                <Input value={form.employment_conditions || "—"} disabled />
              </div>
              <div>
                <Label>Salary</Label>
                <Input value={form.salary || "—"} disabled />
              </div>
              <div>
                <Label>Training Period</Label>
                <Input value={form.training_from && form.training_to ? `${form.training_from} to ${form.training_to}` : "—"} disabled />
              </div>
              <div>
                <Label>Permanent Date</Label>
                <Input value={form.permanent_date || "—"} disabled />
              </div>
              <div>
                <Label>Retirement / End of Contract Date</Label>
                <Input value={form.retirement_date || "—"} disabled />
              </div>
            </Grid>
          </Section>
        )}

        <Section title="Bank & EPF/ETF">
          <Grid>
            <Field label="Bank Name" value={form.bank_name} onChange={(v) => setForm({ ...form, bank_name: v })} disabled={readOnly} />
            <Field label="Branch" value={form.bank_branch} onChange={(v) => setForm({ ...form, bank_branch: v })} disabled={readOnly} />
            <Field label="Account Number" value={form.bank_account_no} onChange={(v) => setForm({ ...form, bank_account_no: v })} disabled={readOnly} />
            <Field label="Account Holder Name" value={form.bank_account_holder} onChange={(v) => setForm({ ...form, bank_account_holder: v })} disabled={readOnly} />
            <Field label="EPF Number" value={form.epf_number} onChange={(v) => setForm({ ...form, epf_number: v })} disabled={readOnly} />
            <Field label="ETF Number" value={form.etf_number} onChange={(v) => setForm({ ...form, etf_number: v })} disabled={readOnly} />
          </Grid>
        </Section>

        {/* Previous Employment */}
        <Section title="Previous Employment Details">
          <div className="space-y-3">
            {!readOnly && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      previous_employments: [
                        ...form.previous_employments,
                        { employer: "", years: "", position: "", period: "", certificate_checked: false },
                      ],
                    })
                  }
                  variant="outline"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Employment Row
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Employer</th>
                    <th className="text-left p-3">Years of Experience</th>
                    <th className="text-left p-3">Position</th>
                    <th className="text-left p-3">From - To</th>
                    <th className="text-center p-3">Service Certificate Check</th>
                    {!readOnly && <th className="text-right p-3">Remove</th>}
                  </tr>
                </thead>
                <tbody>
                  {form.previous_employments.map((pe: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        <Input
                          value={pe.employer}
                          onChange={(e) => {
                            const copy = [...form.previous_employments];
                            copy[idx] = { ...copy[idx], employer: e.target.value };
                            setForm({ ...form, previous_employments: copy });
                          }}
                          disabled={readOnly}
                          placeholder="Employer name"
                          className="h-9"
                        />
                      </td>
                      <td className="p-2 w-32">
                        <Input
                          value={pe.years}
                          onChange={(e) => {
                            const copy = [...form.previous_employments];
                            copy[idx] = { ...copy[idx], years: e.target.value };
                            setForm({ ...form, previous_employments: copy });
                          }}
                          disabled={readOnly}
                          placeholder="e.g. 2 years"
                          className="h-9"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={pe.position}
                          onChange={(e) => {
                            const copy = [...form.previous_employments];
                            copy[idx] = { ...copy[idx], position: e.target.value };
                            setForm({ ...form, previous_employments: copy });
                          }}
                          disabled={readOnly}
                          placeholder="Position"
                          className="h-9"
                        />
                      </td>
                      <td className="p-2 w-40">
                        <Input
                          value={pe.period}
                          onChange={(e) => {
                            const copy = [...form.previous_employments];
                            copy[idx] = { ...copy[idx], period: e.target.value };
                            setForm({ ...form, previous_employments: copy });
                          }}
                          disabled={readOnly}
                          placeholder="e.g. 2020-2022"
                          className="h-9"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={pe.certificate_checked}
                          onCheckedChange={(checked) => {
                            const copy = [...form.previous_employments];
                            copy[idx] = { ...copy[idx], certificate_checked: !!checked };
                            setForm({ ...form, previous_employments: copy });
                          }}
                          disabled={readOnly}
                          className="mx-auto"
                        />
                      </td>
                      {!readOnly && (
                        <td className="p-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setForm({
                                ...form,
                                previous_employments: form.previous_employments.filter((_: any, i: number) => i !== idx),
                              });
                            }}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {form.previous_employments.length === 0 && (
                    <tr>
                      <td colSpan={readOnly ? 5 : 6} className="p-8 text-center text-muted-foreground">
                        No previous employment rows added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="Documents">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <DocUploader label="NIC Copy" url={docs.nic_copy_url} onChange={(e) => handleDoc("nic_copy_url", e)} disabled={readOnly} />
            <DocUploader label="Certificates" url={docs.certificates_url} onChange={(e) => handleDoc("certificates_url", e)} disabled={readOnly} />
            <DocUploader label="Bank Passbook" url={docs.bank_passbook_url} onChange={(e) => handleDoc("bank_passbook_url", e)} disabled={readOnly} />
            <DocUploader label="GS Certificate" url={docs.gs_certificate_url} onChange={(e) => handleDoc("gs_certificate_url", e)} disabled={readOnly} />
          </div>
        </Section>

        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => saveDraft(false)} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto">Submit for Approval</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, value, onChange, type = "text", disabled, onBlur, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; onBlur?: () => void; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} onBlur={onBlur} placeholder={placeholder} />
    </div>
  );
}
function DocUploader({ label, url, onChange, disabled }: { label: string; url?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  return (
    <div className="border rounded-lg p-4 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View</a>}
      </div>
      {!disabled && (
        <label className="cursor-pointer block">
          <input type="file" className="hidden" onChange={onChange} accept="image/*,application/pdf" />
          <div className="border-2 border-dashed rounded-md p-3 text-center text-xs text-muted-foreground hover:bg-accent/40 transition">
            <Upload className="h-4 w-4 inline mr-1" /> {url ? "Replace file" : "Click to upload"}
          </div>
        </label>
      )}
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { variant: any; label: string }> = {
    draft: { variant: "outline", label: "Draft" },
    submitted: { variant: "secondary", label: "Pending Approval" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
  };
  const c = cfg[status] || cfg.draft;
  return <Badge variant={c.variant} className="text-sm px-3 py-1">{c.label}</Badge>;
}