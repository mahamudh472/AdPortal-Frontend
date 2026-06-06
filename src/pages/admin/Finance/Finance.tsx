import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import api from "../../../lib/axios";
import { formatToLocalDate } from "@/lib/dateUtils";

import type {
  FinanceDashboardData,
  TransactionItem,
  TransactionsApiResponse,
  RevenueChartPoint,
  PlanRevenueDisplay,
  StatCardData,
} from "@/types/finance";

// API functions
const fetchFinanceStats = async (): Promise<FinanceDashboardData> => {
  const response = await api.get('/admin/finance/');
  return response.data;
};

const fetchTransactions = async (page: number = 1): Promise<TransactionsApiResponse> => {
  const response = await api.get(`/admin/transactions/?page=${page}&page_size=5`);
  return response.data;
};

// Helper function to format currency
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Helper function to get month abbreviation
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

// Helper function to format date
const formatDate = (dateString: string): string => {
  return formatToLocalDate(dateString);
};

// Helper function to get status badge color
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-purple-100 text-purple-700",
    cancelled: "bg-slate-100 text-slate-700",
  };
  return colors[status.toLowerCase()] || "bg-slate-100 text-slate-700";
};

// Helper function to get payment method icon color
const getPaymentMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    stripe: "bg-indigo-100 text-indigo-600",
    paypal: "bg-blue-100 text-blue-600",
    bank_transfer: "bg-emerald-100 text-emerald-600",
    card: "bg-purple-100 text-purple-600",
  };
  return colors[method.toLowerCase()] || "bg-slate-100 text-slate-600";
};

const Finance: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FinanceDashboardData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch data on mount and page change
  useEffect(() => {
    loadFinanceStats();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [currentPage]);

  const loadFinanceStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchFinanceStats();
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
      const data = await fetchTransactions(currentPage);
      setTransactions(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 5));
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

  // Transform API data for charts
  const revenueChartData: RevenueChartPoint[] = React.useMemo(() => {
    if (!dashboardData?.revenue_overview) return [];
    
    return Object.entries(dashboardData.revenue_overview).map(([month, revenue]) => ({
      month: getMonthAbbreviation(month),
      revenue: revenue,
    }));
  }, [dashboardData]);

  // Transform API data for revenue by plan
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

  // Calculate max revenue for progress bars
  const maxRevenue = Math.max(...revenueByPlan.map((p) => p.revenue), 0);

  // Prepare stat cards data
  const statCards: StatCardData[] = React.useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        icon: <DollarSign size={18} className="text-blue-600" />,
        title: "Monthly Revenue",
        value: formatCurrency(dashboardData.monthly_revenue),
        change: formatPercentage(dashboardData.mrr_growth),
        positive: dashboardData.mrr_growth > 0,
        bgColor: "bg-blue-100",
      },
      {
        icon: <TrendingUp size={18} className="text-emerald-600" />,
        title: "MRR Growth",
        value: formatPercentage(dashboardData.mrr_growth),
        change: `${dashboardData.mrr_growth > 0 ? '+' : ''}${dashboardData.mrr_growth.toFixed(1)}%`,
        positive: dashboardData.mrr_growth > 0,
        bgColor: "bg-emerald-100",
      },
      {
        icon: <CreditCard size={18} className="text-indigo-600" />,
        title: "Total Transactions",
        value: dashboardData.total_transactions.toString(),
        change: `+${dashboardData.total_transactions}`,
        positive: true,
        bgColor: "bg-indigo-100",
      },
      {
        icon: <XCircle size={18} className="text-red-600" />,
        title: "Failed Payments",
        value: dashboardData.failed_payments.toString(),
        change: dashboardData.failed_payments > 0 ? `-${dashboardData.failed_payments}` : '0',
        positive: dashboardData.failed_payments === 0,
        bgColor: "bg-red-100",
      },
    ];
  }, [dashboardData]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Finance
          </h1>
          <p className="text-sm text-slate-500">
            Finance Overview
          </p>
        </div>

        {/* Last Updated */}
        {!statsLoading && dashboardData && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={14} />
            Last updated: {new Date().toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 animate-pulse">
              <div className="h-9 w-9 rounded-xl bg-slate-200 mb-3"></div>
              <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
            </div>
          ))
        ) : (
          statCards.map((card, index) => (
            <StatCard
              key={index}
              icon={card.icon}
              title={card.title}
              value={card.value}
              change={card.change}
              positive={card.positive}
              bgColor={card.bgColor}
            />
          ))
        )}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Revenue Overview
            </h2>
            <p className="text-xs text-slate-500">
              Monthly revenue trend
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Revenue
          </div>
        </div>

        <div className="h-64">
          {statsLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value) => {
                    const amount = typeof value === "number" ? value : Number(value ?? 0);

                    return [`$${amount.toLocaleString()}`, "Revenue"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-slate-400">No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Revenue by Plan
        </h2>

        {statsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <div className="h-4 w-20 bg-slate-200 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 rounded"></div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded">
                  <div className="h-full bg-slate-300 rounded" style={{ width: '0%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : revenueByPlan.length > 0 ? (
          <div className="space-y-4">
            {revenueByPlan.map((plan) => {
              const width = maxRevenue > 0 ? (plan.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={plan.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {plan.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {plan.subscribers} {plan.subscribers === 1 ? 'subscriber' : 'subscribers'}
                      </p>
                    </div>

                    <p className="font-medium text-slate-900">
                      {formatCurrency(plan.revenue)}
                    </p>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">No plan revenue data available</p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Recent Transactions
          </h2>
          {transactionsLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          ) : (
            <span className="text-xs text-slate-500">
              Total: {totalCount} transactions
            </span>
          )}
        </div>

        {transactionsLoading ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg ${getPaymentMethodColor(transaction.payment_method)} flex items-center justify-center`}>
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {transaction.organization}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(transaction.created_at)}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {transaction.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {transaction.plan}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  change,
  positive,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  bgColor?: string;
}) => {
  return (
    <div className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-xl ${bgColor || 'bg-slate-100'} flex items-center justify-center`}>
          {icon}
        </div>

        {change && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-0.5 ${
              positive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>


      <p className="mt-3 text-sm text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
};

export default Finance;