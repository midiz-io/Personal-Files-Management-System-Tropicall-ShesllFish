import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicIdCard } from "@/components/DynamicIdCard";
import {
  DEFAULT_ID_CARD_TEMPLATE,
  IdCardTemplateConfig,
  PRESET_TEMPLATES,
  loadPublishedTemplate,
  publishTemplate,
} from "@/lib/id-card-template";
import { BRAND_LOGO_CDN } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { swalConfirm, swalSuccess, swalError } from "@/lib/sweetalert";
import QRCode from "qrcode";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  Palette,
  Sparkles,
  RotateCcw,
  CheckCircle,
  Eye,
  FileDown,
  Download,
  ArrowLeft,
  Layers,
  Type,
  UserCheck,
  FileText,
  ShieldAlert,
  Loader2,
} from "lucide-react";

const MOCK_EMPLOYEES = [
  {
    id: "sample-emp-01",
    employee_code: "DT-0042",
    full_name: "Kasun Malinda Silva",
    nic: "199423801290",
    designation: "Senior Safari Tour Lead",
    department: "Eco Trails & Guiding",
    date_of_birth: "1994-08-25",
    gender: "Male",
    phone: "+94 77 123 4567",
    emergency_contact_phone: "+94 71 987 6543",
    created_at: "2024-03-15T08:30:00Z",
    approved_at: "2024-03-16T10:00:00Z",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    signature_url: "",
  },
  {
    id: "sample-emp-02",
    employee_code: "DT-0018",
    full_name: "Amali Nimanthika Perera",
    nic: "199754109822",
    designation: "Head Pastry Chef",
    department: "Culinary & Kitchen",
    date_of_birth: "1997-04-12",
    gender: "Female",
    phone: "+94 76 555 1290",
    emergency_contact_phone: "+94 70 444 8822",
    created_at: "2024-01-10T09:00:00Z",
    approved_at: "2024-01-12T14:20:00Z",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    signature_url: "",
  },
];

export default function IdCardDesigner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<IdCardTemplateConfig>(DEFAULT_ID_CARD_TEMPLATE);
  const [initialTemplate, setInitialTemplate] = useState<IdCardTemplateConfig>(DEFAULT_ID_CARD_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Preview state
  const [selectedEmpIndex, setSelectedEmpIndex] = useState(0);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [previewQr, setPreviewQr] = useState<string>("");
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load existing published template & approved employees
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loaded = await loadPublishedTemplate();
        setTemplate(loaded);
        setInitialTemplate(loaded);

        // Fetch real approved employees for preview option
        const { data } = await supabase
          .from("employees")
          .select("*")
          .eq("status", "approved")
          .limit(10);
        if (data && data.length > 0) {
          setDbEmployees(data);
        }
      } catch (e) {
        console.error("Failed to initialize template designer", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Update change detection
  useEffect(() => {
    setHasChanges(JSON.stringify(template) !== JSON.stringify(initialTemplate));
  }, [template, initialTemplate]);

  // Combined list of preview candidates
  const allCandidates = [...MOCK_EMPLOYEES, ...dbEmployees];
  const currentPreviewEmp = allCandidates[selectedEmpIndex] || MOCK_EMPLOYEES[0];

  // Generate QR code for the current candidate
  useEffect(() => {
    (async () => {
      try {
        const url = `${window.location.origin}/verify/${currentPreviewEmp.id}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
          color: { dark: template.accentColor || "#047857", light: "#ffffff" },
        });
        setPreviewQr(qrDataUrl);
      } catch {}
    })();
  }, [currentPreviewEmp.id, template.accentColor]);

  const update = (patch: Partial<IdCardTemplateConfig>) => {
    setTemplate((prev) => ({ ...prev, ...patch }));
  };

  const applyPreset = (presetKey: string) => {
    const patch = PRESET_TEMPLATES[presetKey];
    if (patch) {
      update(patch);
    }
  };

  const handleReset = async () => {
    const confirm = await swalConfirm(
      "Reset Template?",
      "Are you sure you want to revert all changes to the original Dutch Trails template?"
    );
    if (confirm.isConfirmed) {
      setTemplate(DEFAULT_ID_CARD_TEMPLATE);
    }
  };

  const handlePublish = async () => {
    const confirm = await swalConfirm(
      "Publish ID Card Template for Everyone?",
      "Once published, ALL employee ID cards across the entire platform will instantly render with this new design!"
    );
    if (!confirm.isConfirmed) return;

    setPublishing(true);
    try {
      const result = await publishTemplate(template, user?.email ?? "Admin");
      if (result.success) {
        setInitialTemplate(template);
        setHasChanges(false);
        swalSuccess(
          "Template Published Successfully!",
          "All employee identity cards are now live with your new design."
        );
      }
    } catch (err: any) {
      swalError("Publishing Error", err?.message ?? "Failed to save template.");
    } finally {
      setPublishing(false);
    }
  };

  // Test Export PDF
  const testDownloadPdf = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = canvas.width / canvas.height;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");
      pdf.save(`Template-Preview-${currentPreviewEmp.employee_code || "Sample"}.pdf`);
    } catch (err: any) {
      swalError("PDF export error", err?.message ?? "Could not export PDF.");
    } finally {
      setExporting(false);
    }
  };

  // Test Export PNG
  const testDownloadPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `ID-Card-${currentPreviewEmp.employee_code || "Sample"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      swalError("Image export error", err?.message ?? "Could not export image.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Navigation & Status Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-card/60 backdrop-blur p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
            <div className="h-4 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-emerald-600" />
                <h1 className="font-bold text-lg sm:text-xl tracking-tight">
                  ID Card Designer Studio
                </h1>
                {hasChanges ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">
                    Unpublished Draft
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-500/10">
                    <CheckCircle className="h-3 w-3 mr-1 inline" /> Published Live
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                In-system designer for official Employee Identity Cards. All changes publish globally.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset Default
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              size="sm"
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md font-semibold px-4"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Publish for Everyone</span>
            </Button>
          </div>
        </div>

        {/* Studio Workspace: Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Designer Control Panels (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="presets" className="text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Themes
                </TabsTrigger>
                <TabsTrigger value="header" className="text-xs sm:text-sm">
                  <Type className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Header
                </TabsTrigger>
                <TabsTrigger value="canvas" className="text-xs sm:text-sm">
                  <Layers className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Canvas
                </TabsTrigger>
                <TabsTrigger value="fields" className="text-xs sm:text-sm">
                  <UserCheck className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Fields
                </TabsTrigger>
                <TabsTrigger value="footer" className="text-xs sm:text-sm">
                  <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Footer
                </TabsTrigger>
              </TabsList>

              {/* 1. PRESETS / THEMES TAB */}
              <TabsContent value="presets" className="space-y-4 mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" /> One-Click Style Presets
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pick a curated style preset to instantly transform colors, borders, and accents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <PresetCard
                      name="Dutch Trails Emerald"
                      desc="Official emerald gradient with gold badge accents"
                      headerBg="#047857"
                      cardBg="#f0fdf4"
                      onClick={() => applyPreset("emerald")}
                    />
                    <PresetCard
                      name="Sapphire Corporate"
                      desc="Royal deep navy blue with crisp cyan accents"
                      headerBg="#1e3a8a"
                      cardBg="#eff6ff"
                      onClick={() => applyPreset("sapphire")}
                    />
                    <PresetCard
                      name="Slate & Titanium"
                      desc="High-contrast modern slate & dark graphite"
                      headerBg="#0f172a"
                      cardBg="#f8fafc"
                      onClick={() => applyPreset("darkTitanium")}
                    />
                    <PresetCard
                      name="Royal Onyx & Gold"
                      desc="Deep black with warm golden amber border"
                      headerBg="#18181b"
                      cardBg="#fffbeb"
                      onClick={() => applyPreset("royalGold")}
                    />
                    <PresetCard
                      name="Ruby Vanguard"
                      desc="Rich burgundy & warm crimson executive look"
                      headerBg="#881337"
                      cardBg="#fff1f2"
                      onClick={() => applyPreset("rubyVanguard")}
                    />
                    <PresetCard
                      name="Clean Monochrome"
                      desc="Minimalist pure black & crisp white format"
                      headerBg="#111827"
                      cardBg="#ffffff"
                      onClick={() => applyPreset("minimalClean")}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 2. HEADER & BRANDING TAB */}
              <TabsContent value="header" className="space-y-4 mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Header Titles & Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Primary Title</Label>
                        <Input
                          value={template.headerTitle}
                          onChange={(e) => update({ headerTitle: e.target.value })}
                          placeholder="e.g. EMPLOYEE PERSONAL FILES"
                        />
                      </div>
                      <div>
                        <Label>Subtitle / Organization</Label>
                        <Input
                          value={template.headerSubtitle}
                          onChange={(e) => update({ headerSubtitle: e.target.value })}
                          placeholder="e.g. DUTCH TRAILS — SRI LANKA"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Primary Header Color</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.headerBgColor}
                            onChange={(e) => update({ headerBgColor: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.headerBgColor}
                            onChange={(e) => update({ headerBgColor: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Header Gradient End</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.headerGradientEnd}
                            onChange={(e) => update({ headerGradientEnd: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.headerGradientEnd}
                            onChange={(e) => update({ headerGradientEnd: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Header Text Color</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.headerTextColor}
                            onChange={(e) => update({ headerTextColor: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.headerTextColor}
                            onChange={(e) => update({ headerTextColor: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <Label>Header Style</Label>
                        <Select
                          value={template.headerStyle}
                          onValueChange={(v: "gradient" | "solid") => update({ headerStyle: v })}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gradient">Modern Gradient</SelectItem>
                            <SelectItem value="solid">Solid Color</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>ID Number Prefix</Label>
                        <Input
                          value={template.idNumberPrefix}
                          onChange={(e) => update({ idNumberPrefix: e.target.value })}
                          placeholder="e.g. No., ID #, Code"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* Logo Config */}
                    <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Display Header Logo</Label>
                          <div className="text-xs text-muted-foreground">Show logo badge next to title</div>
                        </div>
                        <Switch
                          checked={template.showLogo}
                          onCheckedChange={(c) => update({ showLogo: c })}
                        />
                      </div>

                      {template.showLogo && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <Label className="text-xs">Logo URL</Label>
                            <Input
                              value={template.logoUrl}
                              onChange={(e) => update({ logoUrl: e.target.value })}
                              placeholder="Image or CDN URL"
                              className="text-xs font-mono"
                            />
                            <div className="flex gap-2 mt-1">
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-[11px]"
                                onClick={() => update({ logoUrl: BRAND_LOGO_CDN })}
                              >
                                Use Default CDN Logo
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Logo Shape</Label>
                              <Select
                                value={template.logoShape}
                                onValueChange={(v: "rounded" | "circle" | "square") =>
                                  update({ logoShape: v })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="rounded">Rounded Box</SelectItem>
                                  <SelectItem value="circle">Circular</SelectItem>
                                  <SelectItem value="square">Square</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Logo Size ({template.logoSize}px)</Label>
                              <Slider
                                value={[template.logoSize]}
                                onValueChange={([v]) => update({ logoSize: v })}
                                min={30}
                                max={60}
                                step={2}
                                className="mt-3"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 3. CANVAS & CARD STYLING TAB */}
              <TabsContent value="canvas" className="space-y-4 mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Card Borders, Geometry & Body</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Border Color</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.borderColor}
                            onChange={(e) => update({ borderColor: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.borderColor}
                            onChange={(e) => update({ borderColor: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Border Width ({template.borderWidth}px)</Label>
                        <Slider
                          value={[template.borderWidth]}
                          onValueChange={([v]) => update({ borderWidth: v })}
                          min={1}
                          max={8}
                          step={1}
                          className="mt-4"
                        />
                      </div>

                      <div>
                        <Label>Corner Radius ({template.borderRadius}px)</Label>
                        <Slider
                          value={[template.borderRadius]}
                          onValueChange={([v]) => update({ borderRadius: v })}
                          min={0}
                          max={30}
                          step={2}
                          className="mt-4"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <Label>Card Background Start</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.cardBgStart}
                            onChange={(e) => update({ cardBgStart: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.cardBgStart}
                            onChange={(e) => update({ cardBgStart: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Card Background End</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.cardBgEnd}
                            onChange={(e) => update({ cardBgEnd: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.cardBgEnd}
                            onChange={(e) => update({ cardBgEnd: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <Label>Table Accent Color</Label>
                        <div className="flex gap-2 items-center mt-1.5">
                          <input
                            type="color"
                            value={template.accentColor}
                            onChange={(e) => update({ accentColor: e.target.value })}
                            className="w-9 h-9 rounded cursor-pointer border"
                          />
                          <Input
                            value={template.accentColor}
                            onChange={(e) => update({ accentColor: e.target.value })}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Body White Overlay ({template.bodyBgOpacity}%)</Label>
                        <Slider
                          value={[template.bodyBgOpacity]}
                          onValueChange={([v]) => update({ bodyBgOpacity: v })}
                          min={20}
                          max={100}
                          step={5}
                          className="mt-4"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 4. PHOTO & FIELDS TAB */}
              <TabsContent value="fields" className="space-y-4 mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Photo Frame & Field Visibility</CardTitle>
                    <CardDescription className="text-xs">
                      Enable or disable which details appear on the identity card and customize their labels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Photo Styling */}
                    <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
                      <Label className="font-semibold text-xs uppercase tracking-wide">
                        Employee Photo Frame
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Frame Shape</Label>
                          <Select
                            value={template.photoShape}
                            onValueChange={(v: "rounded" | "circle" | "square") =>
                              update({ photoShape: v })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rounded">Rounded Rect</SelectItem>
                              <SelectItem value="circle">Circular / Oval</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Photo Border Color</Label>
                          <div className="flex gap-2 items-center mt-1">
                            <input
                              type="color"
                              value={template.photoBorderColor}
                              onChange={(e) => update({ photoBorderColor: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer border"
                            />
                            <Input
                              value={template.photoBorderColor}
                              onChange={(e) => update({ photoBorderColor: e.target.value })}
                              className="font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Border Width ({template.photoBorderWidth}px)</Label>
                          <Slider
                            value={[template.photoBorderWidth]}
                            onValueChange={([v]) => update({ photoBorderWidth: v })}
                            min={0}
                            max={6}
                            step={1}
                            className="mt-3"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Field Toggles with Custom Labels */}
                    <div className="space-y-2">
                      <Label className="font-semibold text-xs uppercase tracking-wide">
                        Included Card Fields & Labels
                      </Label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <FieldToggleItem
                          label="Full Name"
                          checked={template.showFullName}
                          onToggle={(c) => update({ showFullName: c })}
                          customLabel={template.fullNameLabel}
                          onLabelChange={(val) => update({ fullNameLabel: val })}
                        />
                        <FieldToggleItem
                          label="NIC Number"
                          checked={template.showNic}
                          onToggle={(c) => update({ showNic: c })}
                          customLabel={template.nicLabel}
                          onLabelChange={(val) => update({ nicLabel: val })}
                        />
                        <FieldToggleItem
                          label="Designation / Role"
                          checked={template.showDesignation}
                          onToggle={(c) => update({ showDesignation: c })}
                          customLabel={template.designationLabel}
                          onLabelChange={(val) => update({ designationLabel: val })}
                        />
                        <FieldToggleItem
                          label="Department"
                          checked={template.showDepartment}
                          onToggle={(c) => update({ showDepartment: c })}
                          customLabel={template.departmentLabel}
                          onLabelChange={(val) => update({ departmentLabel: val })}
                        />
                        <FieldToggleItem
                          label="Date of Birth"
                          checked={template.showDob}
                          onToggle={(c) => update({ showDob: c })}
                          customLabel={template.dobLabel}
                          onLabelChange={(val) => update({ dobLabel: val })}
                        />
                        <FieldToggleItem
                          label="Gender"
                          checked={template.showGender}
                          onToggle={(c) => update({ showGender: c })}
                          customLabel={template.genderLabel}
                          onLabelChange={(val) => update({ genderLabel: val })}
                        />
                        <FieldToggleItem
                          label="Registered Date"
                          checked={template.showRegisteredDate}
                          onToggle={(c) => update({ showRegisteredDate: c })}
                          customLabel={template.registeredDateLabel}
                          onLabelChange={(val) => update({ registeredDateLabel: val })}
                        />
                        <FieldToggleItem
                          label="Phone Number"
                          checked={template.showPhone}
                          onToggle={(c) => update({ showPhone: c })}
                          customLabel={template.phoneLabel}
                          onLabelChange={(val) => update({ phoneLabel: val })}
                        />
                        <FieldToggleItem
                          label="Emergency Contact"
                          checked={template.showEmergencyPhone}
                          onToggle={(c) => update({ showEmergencyPhone: c })}
                          customLabel={template.emergencyPhoneLabel}
                          onLabelChange={(val) => update({ emergencyPhoneLabel: val })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 5. FOOTER & SIGNATURE TAB */}
              <TabsContent value="footer" className="space-y-4 mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Signatory Authority & Validity Banner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Date of Issue Label</Label>
                        <Input
                          value={template.issueDateLabel}
                          onChange={(e) => update({ issueDateLabel: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Place of Issue</Label>
                        <Input
                          value={template.placeOfIssue}
                          onChange={(e) => update({ placeOfIssue: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* QR Code toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                      <div>
                        <Label className="font-semibold text-sm">QR Code Verification</Label>
                        <div className="text-xs text-muted-foreground">Scannable link for instant validation</div>
                      </div>
                      <Switch checked={template.showQr} onCheckedChange={(c) => update({ showQr: c })} />
                    </div>

                    {/* Signatory Authority */}
                    <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-sm">Signatory Authority Section</Label>
                          <div className="text-xs text-muted-foreground">Signature block and issuer titles</div>
                        </div>
                        <Switch
                          checked={template.showSignature}
                          onCheckedChange={(c) => update({ showSignature: c })}
                        />
                      </div>

                      {template.showSignature && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <Label className="text-xs">Signatory Title</Label>
                            <Input
                              value={template.signatoryTitle}
                              onChange={(e) => update({ signatoryTitle: e.target.value })}
                              placeholder="e.g. Commissioner General"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Issuing Authority / Org</Label>
                            <Input
                              value={template.signatoryOrg}
                              onChange={(e) => update({ signatoryOrg: e.target.value })}
                              placeholder="e.g. Dutch Trails Sri Lanka"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disclaimer Banner */}
                    <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-sm">Bottom Validity Banner</Label>
                          <div className="text-xs text-muted-foreground">Legal disclaimer / copyright line</div>
                        </div>
                        <Switch
                          checked={template.showDisclaimer}
                          onCheckedChange={(c) => update({ showDisclaimer: c })}
                        />
                      </div>

                      {template.showDisclaimer && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <Label className="text-xs">Disclaimer Text</Label>
                            <Textarea
                              value={template.disclaimerText}
                              onChange={(e) => update({ disclaimerText: e.target.value })}
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Banner Background</Label>
                              <div className="flex gap-2 items-center mt-1">
                                <input
                                  type="color"
                                  value={template.disclaimerBgColor}
                                  onChange={(e) => update({ disclaimerBgColor: e.target.value })}
                                  className="w-8 h-8 rounded cursor-pointer border"
                                />
                                <Input
                                  value={template.disclaimerBgColor}
                                  onChange={(e) => update({ disclaimerBgColor: e.target.value })}
                                  className="font-mono text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Banner Text Color</Label>
                              <div className="flex gap-2 items-center mt-1">
                                <input
                                  type="color"
                                  value={template.disclaimerTextColor}
                                  onChange={(e) => update({ disclaimerTextColor: e.target.value })}
                                  className="w-8 h-8 rounded cursor-pointer border"
                                />
                                <Input
                                  value={template.disclaimerTextColor}
                                  onChange={(e) => update({ disclaimerTextColor: e.target.value })}
                                  className="font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Live Interactive Preview Panel (5 Cols, Sticky) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <Card className="border-2 shadow-lg overflow-hidden bg-card/95">
              <CardHeader className="p-4 pb-2 border-b bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-sm">Real-time Live Preview</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={previewZoom === 75 ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setPreviewZoom(75)}
                    >
                      75%
                    </Button>
                    <Button
                      variant={previewZoom === 85 ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setPreviewZoom(85)}
                    >
                      85%
                    </Button>
                    <Button
                      variant={previewZoom === 100 ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setPreviewZoom(100)}
                    >
                      100%
                    </Button>
                  </div>
                </div>

                {/* Candidate Switcher */}
                <div className="pt-2">
                  <Label className="text-[11px] text-muted-foreground">Preview Employee</Label>
                  <Select
                    value={String(selectedEmpIndex)}
                    onValueChange={(v) => setSelectedEmpIndex(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCandidates.map((c, i) => (
                        <SelectItem key={c.id || i} value={String(i)} className="text-xs">
                          {c.full_name} ({c.designation || "Employee"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 bg-muted/15 flex flex-col items-center justify-center min-h-[380px] overflow-x-auto">
                <div
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease",
                  }}
                  className="py-2"
                >
                  <DynamicIdCard
                    emp={currentPreviewEmp}
                    template={template}
                    qrUrl={previewQr}
                    cardRef={cardRef}
                  />
                </div>
              </CardContent>

              {/* Action Buttons underneath preview */}
              <div className="p-3 bg-muted/40 border-t flex items-center justify-between flex-wrap gap-2">
                <div className="text-[10px] text-muted-foreground font-mono">
                  CR80 Format (85.6mm × 54mm)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={exporting}
                    onClick={testDownloadPng}
                  >
                    <Download className="h-3.5 w-3.5" /> Test Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={exporting}
                    onClick={testDownloadPdf}
                  >
                    <FileDown className="h-3.5 w-3.5" /> Test PDF
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Publish Reminder Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs space-y-2">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Global Synchronization Active
              </div>
              <p className="text-muted-foreground leading-relaxed">
                When you click <b>"Publish for Everyone"</b>, all existing and newly generated employee ID cards will automatically adopt this template format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PresetCard({
  name,
  desc,
  headerBg,
  cardBg,
  onClick,
}: {
  name: string;
  desc: string;
  headerBg: string;
  cardBg: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-3 border rounded-xl bg-card hover:bg-accent/40 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md space-y-2 group"
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: headerBg }} />
        <div className="w-5 h-5 rounded border shadow-sm -ml-3" style={{ backgroundColor: cardBg }} />
        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function FieldToggleItem({
  label,
  checked,
  onToggle,
  customLabel,
  onLabelChange,
}: {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  customLabel: string;
  onLabelChange: (val: string) => void;
}) {
  return (
    <div className="p-2.5 rounded-lg border bg-card/60 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold">{label}</div>
        <Input
          value={customLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder={label}
          className="h-7 text-[11px] mt-1"
          disabled={!checked}
        />
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="shrink-0" />
    </div>
  );
}
