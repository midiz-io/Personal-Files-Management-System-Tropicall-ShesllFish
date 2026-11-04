import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LetterTemplate, { LetterData } from "@/components/LetterTemplate";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { swalError, swalSuccess } from "@/lib/sweetalert";
import { ArrowLeft, FileDown, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";

type LetterType = "final_service" | "recommendation";

const FINAL_SERVICE_BODY_TEMPLATE = (name: string, nic: string, addr: string, joined: string, lastDay: string) =>
  `This is to certify that ${name}, holder of NIC No. ${nic} of ${addr}, has been working for Ceylon Dutch Trails Corp (Pvt.) Ltd from ${joined} to date.\n\nHe is intending to resign from our organization to approach for further opportunities in his career overseas. We hereby confirm that he is currently going through his one month notice period before his last day of work. We expect him to be with us till ${lastDay}.\n\nDuring his service, he found to be a hardworking, efficient and committed employee who could effectively full fill all the responsibilities entrusted to him by his superior officers.\n\nThis Letter is issued on ${name}'s request to provide as a supplementary document for his visa requirement!`;

const RECOMMENDATION_BODY_TEMPLATE = (name: string, nic: string, addr: string, period: string) =>
  `This is to certify that ${name}, holder of NIC No. ${nic} of ${addr} has been completed his six (06) months training at Ceylon Dutch Trails Corp (Pvt.) Ltd as a Kitchen Trainee from ${period}.\n\nDuring the months of his service at our organization, he found to be a hardworking and talented person who could understand principles of food preparation and hygiene.\n\nHe was a dedicated employee and a strong team player with a strong personality. He was a great companion to his colleagues during work and he contributed positively to the team with a spirit in the Kitchen.\n\nHe has successfully completed his six months training and we are confident to recommend him as talented employee. We wish him good luck in his future endeavors!`;

export default function ServiceLetters() {
  const { id: employeeId } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<any>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [type, setType] = useState<LetterType>("final_service");
  const [letterDate, setLetterDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipient, setRecipient] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [positions, setPositions] = useState<Array<{ title: string; date: string }>>([]);
  const [hrName, setHrName] = useState("D.K.N.Jayamanne");
  const [hrTitle, setHrTitle] = useState("Manager Human Resources");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!employeeId) return;
      const { data } = await supabase.from("employees").select("*").eq("id", employeeId).single();
      setEmp(data);
      if (data?.phone) setPhone(data.phone);
      const { data: list } = await supabase
        .from("service_letters")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      setLetters(list ?? []);
    })();
  }, [employeeId]);

  // Pre-fill body from template when type changes / employee loads
  useEffect(() => {
    if (!emp) return;
    if (type === "final_service") {
      setSubject("TO WHOM IT MAY CONCERN");
      setBody(
        FINAL_SERVICE_BODY_TEMPLATE(
          `Mr.${emp.full_name ?? "________"}`,
          emp.nic ?? "________",
          emp.address ?? "________",
          emp.date_of_joining ? new Date(emp.date_of_joining).toDateString() : "________",
          "________",
        ),
      );
      setPositions([
        { title: "Commi 3", date: "" },
        { title: "Commi 2", date: "" },
        { title: "Commi 1", date: "" },
        { title: "Demi Chef", date: "" },
      ]);
      setRecipient("");
      setRecipientAddress("");
    } else {
      setSubject(`Service Letter – Mr.${emp.full_name ?? ""}`);
      setRecipient("Head of Academics");
      setRecipientAddress("Siyane Vocational Training Institute,\nGampaha");
      setPositions([]);
      setBody(
        RECOMMENDATION_BODY_TEMPLATE(
          `Mr.${emp.full_name ?? "________"}`,
          emp.nic ?? "________",
          emp.address ?? "________",
          "________ to ________",
        ),
      );
    }
  }, [type, emp]);

  const data: LetterData = useMemo(
    () => ({
      letter_type: type, letter_date: letterDate, recipient, recipient_address: recipientAddress,
      subject, body, positions: type === "final_service" ? positions.filter(p => p.title) : [],
      hr_manager_name: hrName, hr_manager_title: hrTitle,
    }),
    [type, letterDate, recipient, recipientAddress, subject, body, positions, hrName, hrTitle],
  );

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const exportNode = exportRef.current ?? previewRef.current;
    if (!exportNode) return null;
    await document.fonts?.ready;
    const canvas = await html2canvas(exportNode, {
      scale: 3,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      removeContainer: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    let w = pageW;
    let h = w / ratio;
    if (h > pageH) { h = pageH; w = h * ratio; }
    pdf.addImage(imgData, "PNG", (pageW - w) / 2, 0, w, h, undefined, "FAST");
    return pdf.output("blob");
  };

  const downloadOnly = async () => {
    setBusy(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${emp?.full_name?.replace(/\s+/g, "_") || "letter"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { swalError("PDF failed", e?.message ?? ""); }
    finally { setBusy(false); }
  };

  const saveAndShare = async () => {
    if (!emp) return;
    setBusy(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) throw new Error("Failed to render letter");
      const filename = `${employeeId}/${type}-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("service-letters").upload(filename, blob, {
        upsert: true, contentType: "application/pdf",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("service-letters").getPublicUrl(filename);
      const pdfUrl = pub.publicUrl;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("service_letters").insert({
        employee_id: employeeId,
        letter_type: type,
        letter_date: letterDate,
        recipient, recipient_address: recipientAddress, subject, body,
        positions: positions as any,
        joined_date: emp.date_of_joining ?? null,
        hr_manager_name: hrName, hr_manager_title: hrTitle,
        pdf_url: pdfUrl, created_by: user?.id,
      });
      if (insErr) throw insErr;

      // Refresh list
      const { data: list } = await supabase.from("service_letters").select("*")
        .eq("employee_id", employeeId).order("created_at", { ascending: false });
      setLetters(list ?? []);

      // WhatsApp share with PDF link
      const cleanedPhone = phone.replace(/[^\d]/g, "");
      const waNumber = cleanedPhone.startsWith("0") ? `94${cleanedPhone.slice(1)}` : cleanedPhone;
      const message = `Hello ${emp.full_name ?? ""},\n\nPlease find your ${type === "final_service" ? "Final Service Letter" : "Service Recommendation Letter"} from Ceylon Dutch Trails Corp (Pvt.) Ltd:\n${pdfUrl}\n\nThank you.`;
      const waUrl = waNumber
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      swalSuccess("Letter ready", "Saved and opened WhatsApp to share.");
    } catch (e: any) {
      swalError("Failed", e?.message ?? "Could not save letter.");
    } finally { setBusy(false); }
  };

  const shareExisting = (letter: any) => {
    const cleanedPhone = (emp?.phone ?? "").replace(/[^\d]/g, "");
    const waNumber = cleanedPhone.startsWith("0") ? `94${cleanedPhone.slice(1)}` : cleanedPhone;
    const msg = `Hello ${emp?.full_name ?? ""},\n\nYour ${letter.letter_type === "final_service" ? "Final Service" : "Service Recommendation"} Letter:\n${letter.pdf_url}`;
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
                           : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const deleteLetter = async (letterId: string) => {
    await supabase.from("service_letters").delete().eq("id", letterId);
    setLetters(letters.filter(l => l.id !== letterId));
  };

  if (!emp) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <Link to={`/admin/employee/${employeeId}`}>
          <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to employee</Button>
        </Link>

        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight break-words">Service Letters · {emp.full_name}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Generate official Dutch Trails letters and share via WhatsApp</p>
        </div>

        <div
          aria-hidden="true"
          className="fixed left-[-10000px] top-0 pointer-events-none"
          style={{ width: "794px", height: "1123px", overflow: "hidden" }}
        >
          <div ref={exportRef} style={{ width: "794px", minHeight: "1123px", transform: "none" }}>
            <LetterTemplate data={data} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Letter details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={type} onValueChange={(v) => setType(v as LetterType)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="final_service">Final Service Letter</TabsTrigger>
                  <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
                </TabsList>
                <TabsContent value="final_service" />
                <TabsContent value="recommendation" />
              </Tabs>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Letter date</Label>
                  <Input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} />
                </div>
                <div>
                  <Label>Subject / Heading</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              </div>

              {type === "recommendation" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Recipient</Label>
                    <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Head of Academics" />
                  </div>
                  <div>
                    <Label>Recipient address</Label>
                    <Textarea rows={2} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
                  </div>
                </div>
              )}

              <div>
                <Label>Body</Label>
                <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>

              {type === "final_service" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Promotion history (positions)</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPositions([...positions, { title: "", date: "" }])}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  {positions.map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input placeholder="Title (Commi 1)" value={p.title} onChange={(e) => {
                        const next = [...positions]; next[i] = { ...p, title: e.target.value }; setPositions(next);
                      }} />
                      <Input type="date" value={p.date} onChange={(e) => {
                        const next = [...positions]; next[i] = { ...p, date: e.target.value }; setPositions(next);
                      }} />
                      <Button type="button" size="icon" variant="ghost" onClick={() => setPositions(positions.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>HR Manager name</Label>
                  <Input value={hrName} onChange={(e) => setHrName(e.target.value)} />
                </div>
                <div>
                  <Label>HR Manager title</Label>
                  <Input value={hrTitle} onChange={(e) => setHrTitle(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>WhatsApp recipient phone (with country code, no +)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="94771234567" />
                <p className="text-xs text-muted-foreground mt-1">Pre-filled from employee profile. Local 0… numbers are converted to 94…</p>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <Button onClick={downloadOnly} variant="outline" disabled={busy} className="gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Download PDF
                </Button>
                <Button onClick={saveAndShare} disabled={busy} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Save & Share via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded bg-muted/30 p-3 max-h-[70vh]">
                <div
                  className="origin-top-left scale-[0.38] sm:scale-[0.55]"
                  style={{ width: "794px" }}
                >
                  <div ref={previewRef}>
                    <LetterTemplate data={data} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Previously generated letters</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Created</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3 capitalize">{l.letter_type.replace("_", " ")}</td>
                    <td className="p-3">{l.letter_date}</td>
                    <td className="p-3 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {l.pdf_url && (
                          <>
                            <a href={l.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline">Open PDF</Button>
                            </a>
                            <Button size="sm" variant="outline" className="gap-1 text-emerald-700" onClick={() => shareExisting(l)}>
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteLetter(l.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {letters.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No letters generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}