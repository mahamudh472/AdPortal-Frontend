// types/finance.ts

// Main API Response Types
export interface FinanceDashboardData {
  monthly_revenue: number;
  mrr_growth: number;
  total_transactions: number;
  failed_payments: number;
  sparklines?: {
    monthly_revenue: number[];
    mrr_growth: number[];
    total_transactions: number[];
    failed_payments: number[];
  };
  payment_summary?: {
    successful: { count: number; total: number };
    failed: { count: number; total: number };
    refunded: { count: number; total: number };
  };
  revenue_overview: RevenueOverviewData;
  revenue_by_plan: RevenueByPlanData;
}

export interface RevenueOverviewData {
  [month: string]: number;
}

export interface RevenueByPlanData {
  starter: PlanRevenueData;
  growth: PlanRevenueData;
  scale: PlanRevenueData;
  [key: string]: PlanRevenueData; // For dynamic plan names
}

export interface PlanRevenueData {
  subscribers: number;
  revenue: number;
}

// Transaction Types
export interface TransactionItem {
  id: number;
  organization: string;
  plan: string;
  amount: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface TransactionsApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TransactionItem[];
}

// UI Display Types
export interface StatCardData {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  bgColor?: string;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
}

export interface PlanRevenueDisplay {
  name: string;
  subscribers: number;
  revenue: number;
}

// Extended Types for Detailed Views
export interface TransactionDetails extends TransactionItem {
  organization_id?: string;
  user_id?: string;
  user_email?: string;
  invoice_url?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
}

// Filter Types
export interface TransactionFilters {
  status?: string;
  plan?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  organization?: string;
}

// Summary Types
export interface FinanceSummaryData {
  total_revenue: number;
  revenue_growth: number;
  active_subscriptions: number;
  subscription_growth: number;
  average_revenue_per_user: number;
  churn_rate: number;
}

// Chart Types
export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface RevenueProjectionData {
  month: string;
  projected: number;
  actual?: number;
}

// API Request Types
export interface GenerateFinanceReportRequest {
  start_date: string;
  end_date: string;
  include_charts?: boolean;
  include_transactions?: boolean;
  format?: 'pdf' | 'csv' | 'excel';
}

// Component Props Types
export interface FinanceStatsProps {
  data: FinanceDashboardData | null;
  loading?: boolean;
}

export interface TransactionsTableProps {
  transactions: TransactionItem[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
}

export interface RevenueChartProps {
  data: RevenueChartPoint[];
  loading?: boolean;
}

export interface RevenueByPlanProps {
  data: PlanRevenueDisplay[];
  loading?: boolean;
  maxRevenue?: number;
}


