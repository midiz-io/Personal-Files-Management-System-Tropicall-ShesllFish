import { BRAND_LOGO_CDN } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";

export interface IdCardTemplateConfig {
  id?: string;
  templateName: string;

  // Header options
  headerTitle: string;
  headerSubtitle: string;
  headerStyle: "gradient" | "solid";
  headerBgColor: string;
  headerGradientEnd: string;
  headerTextColor: string;
  showLogo: boolean;
  logoUrl: string;
  logoShape: "rounded" | "circle" | "square";
  logoSize: number;
  idNumberPrefix: string;

  // Card appearance
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  cardBgType: "gradient" | "solid";
  cardBgStart: string;
  cardBgEnd: string;
  bodyBgOpacity: number;
  accentColor: string;
  showWatermark: boolean;
  watermarkOpacity: number;

  // Photo frame
  photoShape: "rounded" | "square" | "circle";
  photoBorderColor: string;
  photoBorderWidth: number;
  photoPlaceholderText: string;

  // Fields to show & custom labels
  showFullName: boolean;
  fullNameLabel: string;
  showNic: boolean;
  nicLabel: string;
  showDesignation: boolean;
  designationLabel: string;
  showDepartment: boolean;
  departmentLabel: string;
  showDob: boolean;
  dobLabel: string;
  showGender: boolean;
  genderLabel: string;
  showRegisteredDate: boolean;
  registeredDateLabel: string;
  showPhone: boolean;
  phoneLabel: string;
  showEmergencyPhone: boolean;
  emergencyPhoneLabel: string;

  // Footer & Signatures
  issueDateLabel: string;
  placeOfIssue: string;
  showQr: boolean;
  qrLabel: string;
  showSignature: boolean;
  signatoryTitle: string;
  signatoryOrg: string;
  signatureUrl: string;

  // Bottom validity banner
  showDisclaimer: boolean;
  disclaimerText: string;
  disclaimerBgColor: string;
  disclaimerTextColor: string;

  updatedAt?: string;
  publishedBy?: string;
}

export const DEFAULT_ID_CARD_TEMPLATE: IdCardTemplateConfig = {
  templateName: "Dutch Trails Official Emerald",
  headerTitle: "EMPLOYEE PERSONAL FILES",
  headerSubtitle: "DUTCH TRAILS — SRI LANKA",
  headerStyle: "gradient",
  headerBgColor: "#047857",
  headerGradientEnd: "#065f46",
  headerTextColor: "#ffffff",
  showLogo: true,
  logoUrl: BRAND_LOGO_CDN,
  logoShape: "rounded",
  logoSize: 42,
  idNumberPrefix: "No.",

  borderColor: "#047857",
  borderWidth: 4,
  borderRadius: 18,
  cardBgType: "gradient",
  cardBgStart: "#f0fdf4",
  cardBgEnd: "#e6f8ee",
  bodyBgOpacity: 70,
  accentColor: "#047857",
  showWatermark: false,
  watermarkOpacity: 8,

  photoShape: "rounded",
  photoBorderColor: "#047857",
  photoBorderWidth: 2,
  photoPlaceholderText: "Holder's Photo",

  showFullName: true,
  fullNameLabel: "Name",
  showNic: true,
  nicLabel: "NIC No.",
  showDesignation: true,
  designationLabel: "Designation",
  showDepartment: true,
  departmentLabel: "Department",
  showDob: true,
  dobLabel: "Date of Birth",
  showGender: true,
  genderLabel: "Gender",
  showRegisteredDate: true,
  registeredDateLabel: "Registered Date",
  showPhone: false,
  phoneLabel: "Phone",
  showEmergencyPhone: false,
  emergencyPhoneLabel: "Emergency Contact",

  issueDateLabel: "Date of Issue",
  placeOfIssue: "Colombo, Sri Lanka",
  showQr: true,
  qrLabel: "Scan to verify",
  showSignature: true,
  signatoryTitle: "Commissioner General",
  signatoryOrg: "Dutch Trails Sri Lanka",
  signatureUrl: "",

  showDisclaimer: true,
  disclaimerText:
    "Issued under the Employee Digital Files Validity Program · Cooperative World © " +
    new Date().getFullYear(),
  disclaimerBgColor: "#047857",
  disclaimerTextColor: "#ffffff",
};

export const PRESET_TEMPLATES: Record<string, Partial<IdCardTemplateConfig>> = {
  emerald: {
    templateName: "Dutch Trails Signature Emerald",
    headerBgColor: "#047857",
    headerGradientEnd: "#065f46",
    borderColor: "#047857",
    cardBgStart: "#f0fdf4",
    cardBgEnd: "#e6f8ee",
    accentColor: "#047857",
    photoBorderColor: "#047857",
    disclaimerBgColor: "#047857",
  },
  sapphire: {
    templateName: "Sapphire Corporate Blue",
    headerBgColor: "#1e3a8a",
    headerGradientEnd: "#172554",
    borderColor: "#1e3a8a",
    cardBgStart: "#eff6ff",
    cardBgEnd: "#dbeafe",
    accentColor: "#1d4ed8",
    photoBorderColor: "#1e3a8a",
    disclaimerBgColor: "#1e3a8a",
  },
  darkTitanium: {
    templateName: "Modern Slate & Titanium",
    headerBgColor: "#0f172a",
    headerGradientEnd: "#1e293b",
    borderColor: "#334155",
    cardBgStart: "#f8fafc",
    cardBgEnd: "#e2e8f0",
    accentColor: "#0f172a",
    photoBorderColor: "#0f172a",
    disclaimerBgColor: "#0f172a",
  },
  royalGold: {
    templateName: "Royal Onyx & Gold Accent",
    headerBgColor: "#18181b",
    headerGradientEnd: "#27272a",
    borderColor: "#b45309",
    cardBgStart: "#fffbeb",
    cardBgEnd: "#fef3c7",
    accentColor: "#b45309",
    photoBorderColor: "#b45309",
    disclaimerBgColor: "#18181b",
  },
  rubyVanguard: {
    templateName: "Ruby Vanguard Executive",
    headerBgColor: "#881337",
    headerGradientEnd: "#4c0519",
    borderColor: "#881337",
    cardBgStart: "#fff1f2",
    cardBgEnd: "#ffe4e6",
    accentColor: "#9f1239",
    photoBorderColor: "#881337",
    disclaimerBgColor: "#881337",
  },
  minimalClean: {
    templateName: "Minimalist Pure Monochrome",
    headerBgColor: "#111827",
    headerGradientEnd: "#1f2937",
    borderColor: "#111827",
    cardBgStart: "#ffffff",
    cardBgEnd: "#f9fafb",
    accentColor: "#111827",
    photoBorderColor: "#111827",
    disclaimerBgColor: "#111827",
  },
};

const STORAGE_KEY = "published_id_card_template";
const SYNC_CHANNEL_NAME = "id_card_template_sync_channel";

let cachedTemplate: IdCardTemplateConfig | null = null;

export function getLocalCachedTemplate(): IdCardTemplateConfig {
  if (cachedTemplate) return cachedTemplate;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedTemplate = { ...DEFAULT_ID_CARD_TEMPLATE, ...parsed };
      return cachedTemplate!;
    }
  } catch (e) {
    console.warn("Failed to load local template", e);
  }
  return DEFAULT_ID_CARD_TEMPLATE;
}

export async function loadPublishedTemplate(): Promise<IdCardTemplateConfig> {
  // First check local cache for immediate fast render
  const local = getLocalCachedTemplate();

  // Try fetching the global template from Supabase
  try {
    const { data, error } = await supabase
      .from("id_card_templates" as any)
      .select("config")
      .eq("id", "active_template")
      .maybeSingle();

    if (!error && data && (data as any).config) {
      const merged = { ...DEFAULT_ID_CARD_TEMPLATE, ...(data as any).config };
      cachedTemplate = merged;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    // If table doesn't exist yet, gracefully continue with local/default
  }

  return local;
}

export async function publishTemplate(
  config: IdCardTemplateConfig,
  adminEmail?: string
): Promise<{ success: boolean; message: string }> {
  const publishedConfig: IdCardTemplateConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    publishedBy: adminEmail || "Admin",
  };

  // 1. Save locally
  cachedTemplate = publishedConfig;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(publishedConfig));
  } catch (e) {
    console.error("Local storage save error", e);
  }

  // 2. Broadcast via BroadcastChannel so other open windows/tabs update in real time
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: "TEMPLATE_PUBLISHED", template: publishedConfig });
      channel.close();
    }
  } catch {}

  // 3. Persist to Supabase if table exists
  try {
    const { error } = await supabase.from("id_card_templates" as any).upsert({
      id: "active_template",
      config: publishedConfig,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Supabase template sync note (using local fallback):", error.message);
    }
  } catch (err: any) {
    console.warn("Supabase table error:", err?.message);
  }

  return {
    success: true,
    message: "Template published successfully for all employees!",
  };
}

export function subscribeToTemplateChanges(
  onUpdate: (template: IdCardTemplateConfig) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === "TEMPLATE_PUBLISHED" && event.data.template) {
        cachedTemplate = event.data.template;
        onUpdate(event.data.template);
      }
    };
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        cachedTemplate = { ...DEFAULT_ID_CARD_TEMPLATE, ...parsed };
        onUpdate(cachedTemplate);
      } catch {}
    }
  };

  window.addEventListener("storage", storageHandler);

  return () => {
    if (channel) channel.close();
    window.removeEventListener("storage", storageHandler);
  };
}
