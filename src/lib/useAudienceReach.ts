import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface AudienceInput {
  minAge: string;
  maxAge: string;
  gender: "all" | "male" | "female";
  location: string;
  interests: string;
}

export interface AudienceReach {
  min: string;
  max: string;
  progress: number;
  loading: boolean;
}

const EMPTY: AudienceReach = { min: "—", max: "—", progress: 0, loading: true };

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
        const response = await api.post(`/main/audience-reach-estimate/?org_id=${orgId}`, payload);
        if (!cancelled) {
          setReach({
            min: response.data.min_label,
            max: response.data.max_label,
            progress: response.data.progress,
            loading: false,
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
