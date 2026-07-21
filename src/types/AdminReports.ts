// types/AdminReports.ts

export type ReportMetric =
  | "Revenue Overview"
  | "Revenue by Plan"
  | "User Growth"
  | "Feature Usage"
  | "Monthly Revenue"
  | "MRR Growth"
  | "Total Transactions"
  | "Failed Payments";

export type ReportType = "Weekly" | "Monthly" | "Quarterly" | "Custom";

export interface ReportCard {
  id: number;
  title: string;
  type: string;
  date: string;
  status?: string;
  fileUrl?: string;
  fileName?: string;
  includedMetrics?: string[];
  startDate?: string;
  endDate?: string;
  fileSize?: number;
  downloadCount?: number;
  generatedBy?: string;
}

export interface CreateReportForm {
  reportType: ReportType;
  metrics: ReportMetric[];
  startDate?: string;
  endDate?: string;
}

// API Types
export interface ApiReport {
  id: number;
  name: string;
  created_at?: string;
  report_type: string;
  status: string;
  included_metrics: string[];
  start_date?: string;
  end_date?: string;
  file: string;
  file_size?: number;
  download_count?: number;
  generated_by?: string;
}

export interface ReportListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiReport[];
}

export interface GenerateReportRequest {
  report_type: string;
  included_metrics: string[];
  start_date?: string;
  end_date?: string;
}

export interface IncrementDownloadResponse {
  message: string;
  download_count: number;
}

// Component Props Types
export interface ReportTypeCardProps {
  icon: React.ReactNode;
  title: string;
  bgColor: string;
}

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string;
}