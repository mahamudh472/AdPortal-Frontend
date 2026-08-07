import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  ChevronDown,
  Users,
  AlertCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import api from "../../../lib/axios";

import type {
  FinanceDashboardData,
  TransactionItem,
  TransactionsApiResponse,
  RevenueChartPoint,
  PlanRevenueDisplay,
} from "@/types/finance";

/* =========================
   API INTEGRATION
 ========================= */

const fetchFinanceStats = async (startDate?: string, endDate?: string): Promise<FinanceDashboardData> => {
  let url = '/admin/finance/';
  const params = [];
  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await api.get(url);
  return response.data;
};

const fetchTransactions = async (page: number = 1): Promise<TransactionsApiResponse> => {
  const response = await api.get(`/admin/transactions/?page=${page}&page_size=5`);
  return response.data;
};

interface UpcomingInvoice {
  id: number;
  organization: string;
  amount: number;
  due_date: string;
  plan: string;
  status: string;
}

const fetchUpcomingInvoices = async (): Promise<{ count: number; results: UpcomingInvoice[] }> => {
  const response = await api.get('/admin/invoices/upcoming/');
  return response.data;
};

/* =========================
   HELPERS
 ========================= */

const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const getMonthAbbreviation = (month: string): string => {
  const months: Record<string, string> = {
    'Jan': 'Jan',
    'Feb': 'Feb',
    'Mar': 'Mar',
    'Apr': 'Apr',
    'May': 'May',
    'Jun': 'Jun',
    'Jul': 'Jul',
    'Aug': 'Aug',
    'Sep': 'Sep',
    'Oct': 'Oct',
    'Nov': 'Nov',
    'Dec': 'Dec',
  };
  return months[month] || month;
};

// Formats date string to match "Apr 18, 2026 - 10:24 AM" format in mockup
const formatTransactionDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year} - ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return dateString;
  }
};

const getPlanBadgeColor = (plan: string | null | undefined): string => {
  if (!plan) return "bg-slate-50 text-slate-700 border-slate-100";
  const colors: Record<string, string> = {
    starter: "bg-blue-50 text-blue-700 border-blue-100",
    growth: "bg-green-50 text-green-700 border-green-100",
    scale: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return colors[plan.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-100";
};

/* =========================
   SUBCOMPONENTS
 ========================= */

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  bgColor?: string;
  sparkline?: React.ReactNode;
}

const StatCard = ({
  icon,
  title,
  value,
  change,
  positive,
  bgColor,
  sparkline,
}: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor || 'bg-slate-50 text-slate-600'}`}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">
            {value}
          </p>
          {change && (
            <p className={`mt-1.5 text-xs font-semibold flex items-center gap-0.5 ${
              positive ? "text-green-600" : "text-slate-400"
            }`}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
      </div>
      
      {sparkline && (
        <div className="w-16 h-10 flex items-center justify-end">
          {sparkline}
        </div>
      )}
    </div>
  );
};

// Custom Area Chart Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-xl flex flex-col gap-0.5">
        <p className="text-[10px] font-bold text-slate-400">{data.month} 2026</p>
        <p className="text-sm font-bold text-[#3B82F6] flex items-center gap-1.5 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
          ${data.revenue.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

/* =========================
   MAIN DASHBOARD COMPONENT
 ========================= */

const Finance: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FinanceDashboardData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<UpcomingInvoice[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [filterPreset, setFilterPreset] = useState<string>("last_6_months");
  const [dateRangeLabel, setDateRangeLabel] = useState<string>("Loading date range...");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  const getDateRangeForPreset = (preset: string) => {
    const end = new Date(); // Actual current date
    let start = new Date();
    // Default start date is 5 months ago
    start.setMonth(end.getMonth() - 5);
    start.setDate(1);
    
    let label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    if (preset === "this_month") {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === "last_month") {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      const lastMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
      end.setTime(lastMonthEnd.getTime());
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === "last_30_days") {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === "last_90_days") {
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === "last_6_months") {
      start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === "last_12_months") {
      start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
      label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label
    };
  };

  useEffect(() => {
    loadFinanceStats(filterPreset);
    loadTransactions();
    loadUpcomingInvoices();
  }, []);

  const loadUpcomingInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const data = await fetchUpcomingInvoices();
      setUpcomingInvoices(data.results);
    } catch (error: any) {
      console.error('Failed to fetch upcoming invoices:', error);
      setUpcomingInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadFinanceStats = async (preset: string = "last_6_months") => {
    setStatsLoading(true);
    try {
      const { startDate, endDate, label } = getDateRangeForPreset(preset);
      setDateRangeLabel(label);
      const data = await fetchFinanceStats(startDate, endDate);
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to fetch finance stats:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You don\'t have permission to view finance data.');
      } else {
        toast.error('Failed to load finance statistics');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await fetchTransactions(1);
      setTransactions(data.results);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to load transactions');
      }
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Sparkline component
  const Sparkline = ({ data, color, fillUrl, id }: { data?: number[], color: string, fillUrl?: string, id?: string }) => {
    if (!data || data.length < 2) {
      return (
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 20H59" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        </svg>
      );
    }
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 60;
    const height = 24;
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const linePath = `M ${points.join(" L ")}`;
    const fillPath = fillUrl ? `${linePath} L ${width},${height} L 0,${height} Z` : null;

    return (
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {fillPath && id && (
          <>
            <path d={fillPath} fill={`url(#${id})`} opacity="0.1" />
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
          </>
        )}
        <path d={linePath} stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  // Stats cards data
  const statCards = React.useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        icon: <DollarSign size={20} />,
        title: "Total Revenue",
        value: formatCurrency(dashboardData.monthly_revenue),
        change: `${formatPercentage(dashboardData.mrr_growth)} vs last month`,
        positive: dashboardData.mrr_growth >= 0,
        bgColor: "bg-blue-50 text-blue-600",
        sparkline: <Sparkline data={dashboardData.sparklines?.monthly_revenue} color="#3B82F6" fillUrl="sparkUsers" id="sparkUsers" />,
      },
      {
        icon: <TrendingUp size={20} />,
        title: "MRR Growth",
        value: formatPercentage(dashboardData.mrr_growth),
        change: `${formatPercentage(dashboardData.mrr_growth)} vs last month`,
        positive: dashboardData.mrr_growth >= 0,
        bgColor: "bg-green-50 text-green-600",
        sparkline: <Sparkline data={dashboardData.sparklines?.mrr_growth} color="#10B981" fillUrl="sparkMRR" id="sparkMRR" />,
      },
      {
        icon: <CreditCard size={20} />,
        title: "Total Transactions",
        value: dashboardData.total_transactions.toString(),
        change: `+${dashboardData.total_transactions} vs last month`,
        positive: true,
        bgColor: "bg-purple-50 text-purple-600",
        sparkline: <Sparkline data={dashboardData.sparklines?.total_transactions} color="#8B5CF6" fillUrl="sparkTrans" id="sparkTrans" />,
      },
      {
        icon: <AlertCircle size={20} />,
        title: "Failed Payments",
        value: dashboardData.failed_payments.toString(),
        change: `-${dashboardData.failed_payments} vs last month`,
        positive: dashboardData.failed_payments === 0,
        bgColor: "bg-red-50 text-red-600",
        sparkline: <Sparkline data={dashboardData.sparklines?.failed_payments} color="#EF4444" />,
      },
    ];
  }, [dashboardData]);

  // Transform data for Area Chart
  const revenueChartData: RevenueChartPoint[] = React.useMemo(() => {
    if (!dashboardData?.revenue_overview) return [];
    
    return Object.entries(dashboardData.revenue_overview).map(([month, revenue]) => ({
      month: getMonthAbbreviation(month),
      revenue: revenue,
    }));
  }, [dashboardData]);

  // Transform data for Revenue by Plan
  const revenueByPlan: PlanRevenueDisplay[] = React.useMemo(() => {
    if (!dashboardData?.revenue_by_plan) return [];
    
    const plans: PlanRevenueDisplay[] = [];
    Object.entries(dashboardData.revenue_by_plan).forEach(([planKey, planData]) => {
      const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);
      plans.push({
        name: planName,
        subscribers: planData.subscribers,
        revenue: planData.revenue,
      });
    });
    
    return plans.sort((a, b) => b.revenue - a.revenue);
  }, [dashboardData]);

  // Calculations for breakdown
  const maxRevenue = Math.max(...revenueByPlan.map((p) => p.revenue), 0);
  const totalPlanRevenue = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0);
  const totalSubscribers = revenueByPlan.reduce((sum, p) => sum + p.subscribers, 0);
  const avgRevenuePerSubscriber = totalSubscribers > 0 
    ? (totalPlanRevenue / totalSubscribers).toFixed(2)
    : "0.00";

  // Payment summary pie data
  const paymentSummaryData = React.useMemo(() => {
    if (!dashboardData) return [];
    if (dashboardData.payment_summary) {
      const ps = dashboardData.payment_summary;
      return [
        { name: "Successful", value: ps.successful.total, color: "#3B82F6" },
        { name: "Failed", value: ps.failed.total, color: "#EF4444" },
        { name: "Refunded", value: ps.refunded.total, color: "#F59E0B" }
      ];
    }
    return [
      { name: "Successful", value: dashboardData.monthly_revenue, color: "#3B82F6" },
      { name: "Failed", value: dashboardData.failed_payments, color: "#EF4444" },
      { name: "Refunded", value: 0, color: "#F59E0B" }
    ];
  }, [dashboardData]);

  const activeSegments = paymentSummaryData.filter(d => d.value > 0);
  const finalChartData = activeSegments.length > 0
    ? activeSegments
    : [{ name: "Successful", value: 1, color: "#3B82F6" }];

  if (statsLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Overview of your revenue, transactions and subscriptions.
          </p>
        </div>

        {/* Date Filter and Export */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="relative">
            <div 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <Calendar size={14} className="text-slate-400" />
              <span>{dateRangeLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {(() => {
                  const currentEnd = new Date();
                  const lastMonthDate = new Date(currentEnd.getFullYear(), currentEnd.getMonth() - 1, 1);
                  const thisMonthName = currentEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const lastMonthName = lastMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return [
                    { value: "this_month", label: `This Month (${thisMonthName})` },
                    { value: "last_month", label: `Last Month (${lastMonthName})` },
                    { value: "last_30_days", label: "Last 30 Days" },
                    { value: "last_90_days", label: "Last 90 Days" },
                    { value: "last_6_months", label: "Last 6 Months (Default)" },
                    { value: "last_12_months", label: "Last 12 Months" }
                  ];
                })().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterPreset(option.value);
                      loadFinanceStats(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      filterPreset === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    <span>{option.label}</span>
                    {filterPreset === option.value && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Export</span>
          </button> */}
        </div>  
      </div>

      {/* STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            change={card.change}
            positive={card.positive}
            bgColor={card.bgColor}
            sparkline={card.sparkline}
          />
        ))}
      </div>

      {/* CHART & PLAN BREAKDOWN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Line Chart (col-span-2) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 leading-snug">Revenue Overview</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Monthly revenue trend</p>
            </div>

            <div className="flex items-center gap-3">
              <div 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm"
              >
                <span>{
                  filterPreset === "this_month" ? "This Month" :
                  filterPreset === "last_month" ? "Last Month" :
                  filterPreset === "last_30_days" ? "Last 30 Days" :
                  filterPreset === "last_90_days" ? "Last 90 Days" :
                  filterPreset === "last_6_months" ? "Last 6 Months" : "Last 12 Months"
                }</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm">
                <span>Monthly</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            </div>
          </div>

          <div className="h-64 mt-4">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    domain={[0, 2800]}
                    ticks={[0, 700, 1400, 2100, 2800]}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `$${v.toLocaleString()}`} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, fill: "#3B82F6", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-slate-400 font-semibold">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Plan Progress Bars (col-span-1) */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 leading-snug">Revenue by Plan</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Breakdown of monthly revenue by subscription plan</p>
          </div>

          <div className="space-y-5 mt-6 flex-1">
            {revenueByPlan.length > 0 ? (
              revenueByPlan.map((plan) => {
                const width = maxRevenue > 0 ? (plan.revenue / maxRevenue) * 100 : 0;
                const percentage = totalPlanRevenue > 0 
                  ? ((plan.revenue / totalPlanRevenue) * 100).toFixed(1)
                  : "0.0";

                return (
                  <div key={plan.name} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{plan.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {plan.subscribers} {plan.subscribers === 1 ? 'subscriber' : 'subscribers'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-800">{formatCurrency(plan.revenue)}</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-50 border border-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                No plan revenue data available
              </div>
            )}
          </div>

          {/* Bottom stats layout */}
          {dashboardData && (
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-slate-50 pt-6">
              {/* Stat 1 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total Revenue</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1 leading-none">
                    ${dashboardData.monthly_revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total Subs</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1 leading-none">{totalSubscribers}</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Avg. Rev / Sub</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1 leading-none">${avgRevenuePerSubscriber}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TRANSACTION & PAYMENT SUMMARY STACK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Transactions (col-span-2) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-slate-900 leading-snug">Recent Transactions</h2>
            <button 
              onClick={() => toast.info("Navigating to all transactions...")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Transactions</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {transactionsLoading ? (
              <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-xs text-slate-500 font-medium">Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <table className="w-full text-sm min-w-[550px]">
                <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left w-[240px]">Date</th>
                    <th className="px-6 py-3 text-left w-[140px]">Description</th>
                    <th className="px-6 py-3 text-left w-[100px]">Plan</th>
                    <th className="px-6 py-3 text-left w-[100px]">Amount</th>
                    <th className="px-6 py-3 text-left w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-purple-100">
                            <CreditCard size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {formatTransactionDate(transaction.created_at)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Description */}
                      <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                        {transaction.organization || "Stripe"}
                      </td>

                      {/* Plan Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${getPlanBadgeColor(transaction.plan)}`}>
                          {transaction.plan ? (transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1)) : "N/A"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                        {formatCurrency(transaction.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                <CreditCard size={48} className="text-slate-300 mb-3" />
                <p className="text-xs text-slate-500 font-semibold">No transactions found</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <button 
              onClick={() => toast.info("Navigating to all transactions...")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all transactions</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Payment Summary & Upcoming Invoices (col-span-1) */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Payment Summary */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 leading-snug">Payment Summary</h2>
              </div>
              <div 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg cursor-pointer"
              >
                <span>{
                  filterPreset === "this_month" ? "This Month" :
                  filterPreset === "last_month" ? "Last Month" :
                  filterPreset === "last_30_days" ? "Last 30 Days" :
                  filterPreset === "last_90_days" ? "Last 90 Days" :
                  filterPreset === "last_6_months" ? "Last 6 Months" : "Last 12 Months"
                }</span>
                <ChevronDown size={10} className="text-slate-400" />
              </div>
            </div>

            {dashboardData && (
              <div className="flex items-center gap-6 mt-4">
                {/* Donut chart */}
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalChartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={48}
                        paddingAngle={0}
                      >
                        {finalChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-[13px] font-extrabold text-slate-900 leading-none">
                      ${dashboardData.monthly_revenue.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-400 font-extrabold tracking-wider mt-0.5 uppercase">Total</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="flex-1 space-y-2.5">
                  {paymentSummaryData.map((item, idx) => {
                    const totalVal = paymentSummaryData.reduce((sum, i) => sum + i.value, 0);
                    const pct = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 leading-none">{item.name}</p>
                          <p className="text-[11px] font-extrabold text-slate-800 mt-1 leading-none">
                            ${item.value.toLocaleString()}{" "}
                            <span className="text-[10px] font-semibold text-slate-400">({pct}%)</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Invoices */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 leading-snug">Upcoming Invoices</h2>
              <button 
                onClick={() => toast.info("Navigating to invoices...")}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={10} />
              </button>
            </div>

            {invoicesLoading ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mx-auto"></div>
              </div>
            ) : upcomingInvoices.length > 0 ? (
              <div className="space-y-3 mt-2">
                {upcomingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{invoice.organization}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Due: {invoice.due_date} | {invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900">${parseFloat(invoice.amount.toString()).toFixed(2)}</p>
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 mt-1 uppercase">
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state visual */
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 mt-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50/80 text-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100/50">
                  <Calendar size={18} />
                </div>
                <p className="text-xs font-extrabold text-slate-700 mt-3">No upcoming invoices</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;