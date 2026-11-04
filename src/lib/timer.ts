import { supabase } from "@/integrations/supabase/client";

// Returns total accumulated seconds across all sessions for the employee
export async function fetchTotalSeconds(employeeId: string): Promise<{ total: number; activeStartedAt: string | null }> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("started_at, ended_at")
    .eq("employee_id", employeeId);

  if (error || !data) return { total: 0, activeStartedAt: null };

  let total = 0;
  let activeStartedAt: string | null = null;
  const now = Date.now();
  for (const row of data) {
    const start = new Date(row.started_at).getTime();
    if (row.ended_at) {
      total += Math.floor((new Date(row.ended_at).getTime() - start) / 1000);
    } else {
      activeStartedAt = row.started_at;
      total += Math.floor((now - start) / 1000);
    }
  }
  return { total, activeStartedAt };
}

export async function startSessionIfNone(employeeId: string, userId: string) {
  // Check active
  const { data } = await supabase
    .from("work_sessions")
    .select("id")
    .eq("employee_id", employeeId)
    .is("ended_at", null)
    .limit(1);
  if (data && data.length > 0) return data[0].id;

  const { data: ins } = await supabase
    .from("work_sessions")
    .insert({ employee_id: employeeId, user_id: userId })
    .select("id")
    .single();
  return ins?.id ?? null;
}

export async function stopActiveSession(employeeId: string) {
  await supabase
    .from("work_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("employee_id", employeeId)
    .is("ended_at", null);
}

export function formatHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}