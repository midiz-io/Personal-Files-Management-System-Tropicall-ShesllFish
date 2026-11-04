// External NIC lookup with graceful fallback to local decoder
import { decodeNIC, NICInfo } from "./nic-decoder";

export interface NICLookupResult {
  source: "external" | "local" | "none";
  ok: boolean;
  message?: string;
  data?: Partial<{
    full_name: string;
    address: string;
    date_of_birth: string;
    gender: string;
    age: number;
  }>;
}

// Try a public NIC API; if anything fails, fall back to local decoder.
// We swallow ALL errors so the form remains submittable.
export async function lookupNIC(nic: string): Promise<NICLookupResult> {
  if (!nic) return { source: "none", ok: false, message: "NIC is empty" };

  // 1) Try external API (best effort, short timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://nic.lk/api/v1/nic/${encodeURIComponent(nic.trim())}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    }).catch(() => null);
    clearTimeout(timer);

    if (res && res.ok) {
      const json: any = await res.json().catch(() => null);
      if (json && (json.dob || json.date_of_birth || json.gender)) {
        const local = decodeNIC(nic);
        return {
          source: "external",
          ok: true,
          data: {
            full_name: json.full_name ?? json.name ?? undefined,
            address: json.address ?? undefined,
            date_of_birth:
              json.dob ?? json.date_of_birth ?? (local ? local.dateOfBirth.toISOString().slice(0, 10) : undefined),
            gender: json.gender ?? local?.gender,
            age: typeof json.age === "number" ? json.age : local?.age,
          },
        };
      }
    }
  } catch {
    // ignore — fall through to local
  }

  // 2) Local decoder fallback
  const local: NICInfo | null = decodeNIC(nic);
  if (local) {
    return {
      source: "local",
      ok: true,
      message: "External lookup unavailable — decoded locally from NIC.",
      data: {
        date_of_birth: local.dateOfBirth.toISOString().slice(0, 10),
        gender: local.gender,
        age: local.age,
      },
    };
  }

  // 3) Could not decode — still allow submission
  return {
    source: "none",
    ok: false,
    message: "NIC could not be verified — you can continue filling the form manually.",
  };
}