import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { Loader2, Download, ArrowLeft, FileDown, Palette, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { swalError } from "@/lib/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_ID_CARD_TEMPLATE,
  IdCardTemplateConfig,
  loadPublishedTemplate,
  subscribeToTemplateChanges,
} from "@/lib/id-card-template";
import { DynamicIdCard } from "@/components/DynamicIdCard";

export default function IdCard() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();

  const [emp, setEmp] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [template, setTemplate] = useState<IdCardTemplateConfig>(DEFAULT_ID_CARD_TEMPLATE);
  const [templateLoading, setTemplateLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Load employee and published global template
  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("employees").select("*").eq("id", id).single();
      setEmp(data);

      const loadedTemplate = await loadPublishedTemplate();
      setTemplate(loadedTemplate);
      setTemplateLoading(false);

      const url = `${window.location.origin}/verify/${id}`;
      setQr(
        await QRCode.toDataURL(url, {
          width: 240,
          margin: 1,
          color: { dark: loadedTemplate.accentColor || "#047857", light: "#ffffff" },
        })
      );
    })();

    // Live sync: when admin publishes a template, update open ID card view immediately
    const unsubscribe = subscribeToTemplateChanges((newTemplate) => {
      setTemplate(newTemplate);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  if (!emp || !qr || templateLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  // Export PDF
  const downloadPdf = async () => {
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
      pdf.save(`ID-${emp.employee_code || emp.id.slice(0, 8)}.pdf`);
    } catch (err: any) {
      swalError("PDF export failed", err?.message ?? "Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Export Image (PNG)
  const downloadPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `ID-${emp.employee_code || emp.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      swalError("Image export failed", err?.message ?? "Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <Link to={role === "admin" ? "/admin" : "/portal"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>

          <div className="flex gap-2 flex-wrap items-center">
            {role === "admin" && (
              <Link to="/admin/id-card-designer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Palette className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Customize Template</span>
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Download className="h-4 w-4" /> Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadPng}
              disabled={exporting}
              className="gap-1.5"
            >
              <ImageIcon className="h-4 w-4" />
              <span>PNG</span>
            </Button>

            <Button onClick={downloadPdf} disabled={exporting} size="sm" className="gap-2">
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Card Container */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 flex justify-center py-2">
          <DynamicIdCard
            emp={emp}
            template={template}
            qrUrl={qr}
            cardRef={cardRef}
          />
        </div>
      </div>
    </AppShell>
  );
}