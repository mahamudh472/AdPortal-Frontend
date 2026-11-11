import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";

export type WizardMode = "create" | "update";

export const TOTAL_STEPS = 7;

export const STEP_LABELS = ["Campaign Name", "Platforms", "Objective", "Audience", "Budget", "Creative", "Review"];

export const getOrgId = (): string => {
  try {
    return JSON.parse(localStorage.getItem("selectedOrganization") || "null")?.id ?? "";
  } catch {
    return "";
  }
};

export const stepPath = (mode: WizardMode, step: number, campaignId?: string | number | null): string =>
  mode === "create"
    ? `/user-dashboard/campaigns-create/step-${step}`
    : `/user-dashboard/campaigns-update/${campaignId}/update-step-${step}`;

export const clearCreateState = () => {
  ["campaign_builder_data", "campaignId", "campaignName", "campaignStatus", "api_response"].forEach((key) =>
    localStorage.removeItem(key),
  );
};

/** Pulls a readable message out of a DRF error body. */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.detail === "string") return record.detail;
    const parts = Object.entries(record).map(([key, value]) => {
      const text = Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : JSON.stringify(value);
      return key === "non_field_errors" ? text : `${key.replace(/_/g, " ")}: ${text}`;
    });
    if (parts.length) return parts.join("\n");
  }
  return fallback;
};

// ---------------------------------------------------------------- API shapes
export interface WizardBudget {
  platform: string;
  budget_type: string;
  budget: number;
  start_date?: string | null;
  end_date?: string | null;
  run_continuously?: boolean;
}

export interface WizardAd {
  /** Published ads report their name as `name`; drafts as `ad_name`. */
  name?: string | null;
  ad_name?: string | null;
  headline?: string | null;
  primary_text?: string | null;
  description?: string | null;
  call_to_action?: string | null;
  destination_url?: string | null;
  ad_format?: "image" | "video" | null;
  creative_keywords?: string | null;
}

export interface WizardCampaign {
  id: number;
  name: string;
  objective: string;
  status: string;
  platforms: string[];
  budgets: WizardBudget[];
  ads: WizardAd[];
  audience_targeting: {
    min_age: number;
    max_age: number;
    gender: string;
    locations: string[];
    keywords: string;
  };
  file_url: string | null;
}

export interface WizardPlatform {
  key: string;
  name: string;
  description: string;
  formats: string[];
  reach_potential: number;
  reach_label: string;
  best_for: string[];
  strength: string;
  impact: { cost: string; speed: string; performance: string };
  connected: boolean;
  recommended: boolean;
}

export interface WizardObjective {
  key: string;
  title: string;
  description: string;
  best_for: string[];
  recommended: boolean;
}

export interface WizardConfig {
  platforms: WizardPlatform[];
  platform_recommendation: {
    platforms: { key: string; name: string; strength: string }[];
    expected_improvement_percent: number;
  };
  objectives: WizardObjective[];
  objective_recommendation: { objective: string; title: string; summary: string; reasons: string[] };
  call_to_actions: string[];
  limits: { headline: number; description: number; primary_text: number };
  budget_presets: { key: string; label: string; daily_budget: number }[];
}

// -------------------------------------------------------------------- hooks
/**
 * State shared by every wizard step: which campaign we are editing, the saved
 * campaign itself, and how to save/navigate. Create mode keeps the campaign id in
 * localStorage (set by step 1); update mode takes it from the route.
 */
export const useWizard = (mode: WizardMode, fresh = false) => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const orgId = getOrgId();
  const campaignId = mode === "update" ? params.id ?? null : fresh ? null : localStorage.getItem("campaignId");

  const [campaign, setCampaign] = useState<WizardCampaign | null>(null);
  const shouldLoad = Boolean(campaignId && orgId);
  const [loading, setLoading] = useState(shouldLoad);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    api
      .get<WizardCampaign>(`/main/campaign/${campaignId}/?org_id=${orgId}`)
      .then((res) => !cancelled && setCampaign(res.data))
      .catch((err) => !cancelled && setLoadError(apiErrorMessage(err, "Failed to load campaign.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaignId, orgId, shouldLoad]);

  /** Saves a step's fields against the campaign (creates it when there is no id yet). */
  const save = useCallback(
    async (payload: Record<string, unknown> | FormData): Promise<WizardCampaign> => {
      const endpoint = mode === "update" ? "update-ad" : "create-ad";
      if (payload instanceof FormData) {
        if (campaignId) payload.set("campaign_id", String(campaignId));
        const res = await api.post<WizardCampaign>(`/main/${endpoint}/?org_id=${orgId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      }
      const body = campaignId ? { campaign_id: Number(campaignId), ...payload } : payload;
      const res = await api.post<WizardCampaign>(`/main/${endpoint}/?org_id=${orgId}`, body);
      return res.data;
    },
    [campaignId, mode, orgId],
  );

  const goToStep = useCallback(
    (step: number, id: string | number | null = campaignId, state?: unknown) =>
      navigate(stepPath(mode, step, id), { state }),
    [campaignId, mode, navigate],
  );

  return { mode, orgId, campaignId, campaign, loading, loadError, save, goToStep };
};

export const useWizardConfig = (campaignId: string | null) => {
  const orgId = getOrgId();
  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [loading, setLoading] = useState(Boolean(orgId));

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    const query = campaignId ? `&campaign_id=${campaignId}` : "";
    api
      .get<WizardConfig>(`/main/campaign-wizard/config/?org_id=${orgId}${query}`)
      .then((res) => !cancelled && setConfig(res.data))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaignId, orgId]);

  return { config, loading };
};

export const PLATFORM_LABEL: Record<string, string> = { META: "Meta", GOOGLE: "Google", TIKTOK: "TikTok" };
