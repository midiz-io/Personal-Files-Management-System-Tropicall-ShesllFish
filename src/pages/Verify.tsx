import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/Brand";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [emp, setEmp] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return setState("invalid");
      const { data, error } = await supabase.rpc("verify_employee", { _employee_id: id });
      if (error || !data || data.length === 0) setState("invalid");
      else { setEmp(data[0]); setState("valid"); }
    })();
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-emerald-50 via-background to-emerald-100/30">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8 text-center space-y-5">
          <div className="flex justify-center">
            <BrandLogo size={64} className="border-2 border-emerald-700" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Employee Personal Files</h1>
            <p className="text-xs text-muted-foreground">Employee File's</p>
          </div>

          {state === "loading" && (
            <div className="py-8"><Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" /></div>
          )}

          {state === "invalid" && (
            <div className="space-y-2">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <div className="text-lg font-semibold text-destructive">Invalid Identity</div>
              <p className="text-sm text-muted-foreground">This card is not a valid Dutch Trails employee identity.</p>
            </div>
          )}

          {state === "valid" && emp && (
            <div className="space-y-3">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
              <div className="text-xl font-bold text-emerald-700">✓ Valid Dutch Trails Employee</div>
              {emp.photo_url && <img src={emp.photo_url} alt="" className="w-24 h-28 object-cover mx-auto rounded border-2 border-emerald-700/40" />}
              <div className="text-lg font-semibold">{emp.full_name}</div>
              <div className="bg-emerald-50 text-emerald-900 text-sm py-3 px-4 rounded-lg border border-emerald-200">
                This individual is a verified employee of <b>Dutch Trails</b>.
              </div>
              <div className="text-xs text-muted-foreground">Employee Code: <span className="font-mono">{emp.employee_code || "—"}</span></div>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground border-t pt-3">
            Cooperative World · Employee Digital Files Validity System
          </div>
        </CardContent>
      </Card>
    </div>
  );
}