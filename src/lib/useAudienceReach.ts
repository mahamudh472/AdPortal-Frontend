import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface AudienceInput {
  minAge: string;
  maxAge: string;
  gender: "all" | "male" | "female";
  location: string;
  interests: string;
}

export type AudienceLevel = "too_specific" | "optimal" | "too_broad";

export interface AudienceReach {
  min: string;
  max: string;
  progress: number;
  loading: boolean;
  level: AudienceLevel;
  headline: string;
  insights: { label: string; ok: boolean }[];
  interestSuggestions: string[];
  thresholds: { too_specific_below: number; optimal_min: number; optimal_max: number; too_broad_above: number };
}

const EMPTY: AudienceReach = {
  min: "—",
  max: "—",
  progress: 0,
  loading: true,
  level: "optimal",
  headline: "",
  insights: [],
  interestSuggestions: [],
  thresholds: { too_specific_below: 100_000, optimal_min: 630_000, optimal_max: 960_000, too_broad_above: 2_000_000 },
};

/** Debounced "estimated reach" lookup for the audience step (POST /main/audience-reach-estimate/). */
export const useAudienceReach = ({ minAge, maxAge, gender, location, interests }: AudienceInput): AudienceReach => {
  const [reach, setReach] = useState<AudienceReach>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    let orgId = "";
    try {
      orgId = JSON.parse(localStorage.getItem("selectedOrganization") || "null")?.id || "";
    } catch {
      /* no organization selected */
    }
    if (!orgId) return;

    const min = parseInt(minAge, 10);
    const max = parseInt(maxAge, 10);
    const payload: Record<string, unknown> = {
      gender,
      locations: location ? [location] : [],
      keywords: interests,
    };
    // Only send ages the API accepts (13-65); otherwise it falls back to its defaults.
    if (min >= 13 && min <= 65) payload.min_age = min;
    if (max >= 13 && max <= 65) payload.max_age = max;

    setReach((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post(`/main/audience-reach-estimate/?org_id=${orgId}`, payload);
        if (!cancelled) {
          setReach({
            min: data.min_label,
            max: data.max_label,
            progress: data.progress,
            loading: false,
            level: data.level,
            headline: data.headline,
            insights: data.insights ?? [],
            interestSuggestions: data.interest_suggestions ?? [],
            thresholds: data.thresholds ?? EMPTY.thresholds,
          });
        }
      } catch {
        if (!cancelled) setReach({ ...EMPTY, loading: false });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [minAge, maxAge, gender, location, interests]);

  return reach;
};
