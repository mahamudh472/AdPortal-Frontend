import React from "react";
import { formatToLocalDateTime } from "@/lib/dateUtils";
import type {
  impactLevel,
} from "@/types/aiCampaignOptimization";

/* ===============================
   TYPES
================================ */

interface AIInsight {
  id: number;
  title: string;
  description: string;
  created_at: string;
  impact: string; // Note: API returns "impact" (misspelled) instead of "impact"
}

interface CampaignData {
  ai_insights?: AIInsight[];
  [key: string]: any;
}

interface AICampaignOptimizationProps {
  campaign?: CampaignData;
}

/* ===============================
   HELPERS
================================ */

const impactStyles: Record<
  impactLevel,
  { badge: string; text: string }
> = {
  high: {
    badge: "bg-green-100 text-green-700 border-green-200",
    text: "High impact",
  },
  medium: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    text: "Medium impact",
  },
  low: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    text: "Low impact",
  },
};

// Helper to map API impact to our component's impact level
const mapimpactLevel = (impact: string): impactLevel => {
  const upper = impact?.toUpperCase() || "";
  if (upper.includes("HIGH")) return "high";
  if (upper.includes("MEDIUM")) return "medium";
  return "low";
};

const AICampaignOptimization: React.FC<AICampaignOptimizationProps> = ({ campaign }) => {
  // Get insights from campaign data or use empty array
  const insights = campaign?.ai_insights || [];

  // If no insights, show empty state
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          AI Campaign Optimization
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-full bg-slate-100 p-3">
            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-900">No AI insights available</h3>
          <p className="mt-1 text-sm text-slate-500">
            AI-powered optimization suggestions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          AI Campaign Optimization
        </h2>
        <span className="text-xs text-slate-500">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const impact = impactStyles[mapimpactLevel(insight.impact)];

          return (
            <div
              key={insight.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-blue-200 bg-white p-4"
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  {insight.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {insight.description}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatToLocalDateTime(insight.created_at)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${impact.badge}`}
              >
                {impact.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AICampaignOptimization;