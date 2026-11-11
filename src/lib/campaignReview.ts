/**
 * Helpers for the campaign review step (create + update flows):
 * pre-launch checks computed from the real campaign and a real publish call.
 */
import api from "@/lib/axios";

export interface ReviewCampaign {
  name?: string;
  objective?: string;
  platforms?: string[];
  ads?: Array<{
    ad_name?: string;
    headline?: string;
    primary_text?: string;
    description?: string;
    call_to_action?: string;
    destination_url?: string;
  }>;
  audience_targeting?: {
    min_age?: number;
    max_age?: number;
    gender?: string;
    locations?: string[];
    keywords?: string;
  };
  budgets?: Array<{ budget?: number }>;
  file_url?: string | null;
}

export interface IntegrationStatus {
  platform: string;
  status: boolean;
}

export interface PrelaunchCheck {
  key: string;
  label: string;
  passed: boolean;
  /** Extra detail shown when the check fails. */
  detail?: string;
}

const hasValue = (value: unknown): boolean =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== "";

export const getPrelaunchChecks = (
  campaign: ReviewCampaign,
  integrations: IntegrationStatus[] | null
): PrelaunchCheck[] => {
  const ad = campaign.ads?.[0];
  const audience = campaign.audience_targeting;

  const missing = [
    ["campaign name", campaign.name],
    ["objective", campaign.objective],
    ["platforms", campaign.platforms],
    ["budget", campaign.budgets],
    ["audience age", audience?.min_age && audience?.max_age],
    ["audience gender", audience?.gender],
    ["locations", audience?.locations],
    ["headline", ad?.headline],
    ["primary text", ad?.primary_text],
    ["call to action", ad?.call_to_action],
    ["destination URL", ad?.destination_url],
  ]
    .filter(([, value]) => !hasValue(value))
    .map(([label]) => label as string);

  const disconnected = (campaign.platforms ?? []).filter(
    (platform) => !integrations?.find((i) => i.platform === platform)?.status
  );

  const budgetsValid = hasValue(campaign.budgets) && (campaign.budgets ?? []).every((b) => (b.budget ?? 0) > 0);

  return [
    {
      key: "fields",
      label: "All required fields completed",
      passed: missing.length === 0,
      detail: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
    },
    {
      key: "accounts",
      label: "Ad accounts connected and verified",
      passed: integrations !== null && disconnected.length === 0,
      detail:
        integrations === null
          ? "Could not verify connected accounts"
          : disconnected.length
          ? `Not connected: ${disconnected.join(", ")}`
          : undefined,
    },
    {
      key: "budget",
      label: "Budget allocation confirmed",
      passed: budgetsValid,
      detail: budgetsValid ? undefined : "Set a budget greater than zero for each platform",
    },
    {
      key: "creative",
      label: "Creative assets uploaded",
      passed: hasValue(campaign.file_url),
      detail: hasValue(campaign.file_url) ? undefined : "Upload an image or video in the creative step",
    },
  ];
};

/** Flattens DRF error bodies ({field: "msg" | ["msg"]}) into one readable string. */
export const extractApiError = (data: unknown, fallback: string): string => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const parts = Object.values(data as Record<string, unknown>).flatMap((v) =>
      Array.isArray(v) ? v.map(String) : [String(v)]
    );
    if (parts.length) return parts.join(" ");
  }
  return fallback;
};

export const publishCampaign = async (orgId: string, campaignId: number | string): Promise<void> => {
  await api.post(`/main/create-ad/?org_id=${orgId}`, {
    campaign_id: Number(campaignId),
    draft: false,
  });
};

export const fetchIntegrationStatuses = async (orgId: string): Promise<IntegrationStatus[] | null> => {
  try {
    const response = await api.get(`/main/integrations-status/?org_id=${orgId}`);
    const list = response.data?.integrations;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
};
