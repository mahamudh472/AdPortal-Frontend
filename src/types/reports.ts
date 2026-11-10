export type ReportType = "Weekly" | "Monthly" | "Custom";
export type Platform = "Meta" | "TikTok" | "Google";
export type Metric = "Spend" | "Impressions" | "Click" | "CTR" | "CPC" | "ROAS";

export interface CreateReportForm {
  reportType: ReportType;
  platforms: Platform[];
  metrics: Metric[];
  startDate?: string;  // Added for custom reports
  endDate?: string;    // Added for custom reports
}

export interface RecentReport {
  id: string;
  title: string;
  date: string;
  frequency: string;
  fileUrl: string;
}

export interface ApiReport {
  id: string;
  name: string;
  created_at: string;
  report_type: string;
  file: string | null;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  included_platforms?: string[];
  included_metrics?: string[];
}

export interface ApiScheduledReport {
  id: number;
  title: string;
  schedule: string;
  frequency: "weekly" | "monthly";
  enabled: boolean;
}

export interface ReportInsights {
  period: { start_date: string; end_date: string };
  top_campaign: { name: string; roas: number } | null;
  total_spend: number;
  conversion_rate: number;
  total_impressions: number;
}

export interface ApiReportResponse {
  report_type: string;
  included_metrics: string[];
  start_date?: string;  
  end_date?: string;    
}

export interface PaginatedReportsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiReport[];
}