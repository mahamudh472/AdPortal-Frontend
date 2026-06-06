import React, { useState, useEffect } from "react";
import {
  FileText,
  TrendingUp,
  Calendar,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";
import { formatToLocalDate } from "@/lib/dateUtils";

import type {
  ReportCard,
  CreateReportForm,
  ReportMetric,
  ApiReport,
  ReportListResponse,
  GenerateReportRequest,
} from "@/types/AdminReports";

const METRICS: ReportMetric[] = [
  "Revenue Overview",
  "Revenue by Plan",
  "User Growth",
  "Feature Usage",
  "Monthly Revenue",
  "MRR Growth",
  "Total Transactions",
  "Failed Payments",
];

// Map display metrics to API metric keys
const metricToApiKey: Record<ReportMetric, string> = {
  "Revenue Overview": "revenue_overview",
  "Revenue by Plan": "revenue_by_plan",
  "User Growth": "user_growth",
  "Feature Usage": "feature_usage",
  "Monthly Revenue": "monthly_revenue",
  "MRR Growth": "mrr_growth",
  "Total Transactions": "total_transactions",
  "Failed Payments": "failed_payments",
};

// Map API report type to display type
const apiTypeToDisplay: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  custom: "Custom",
};

// Map display type to API report type
const displayTypeToApi: Record<string, string> = {
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Custom: "custom",
};

// Custom Date Range Component
const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string;
}) => {
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-sm font-medium text-slate-700 mb-3">
        Custom Date Range
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            max={endDate || getTodayString()}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={startDate || undefined}
            max={getTodayString()}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
      <p className="text-xs text-slate-400 mt-2">
        Select the date range for your custom report
      </p>
    </div>
  );
};

// API functions
const fetchReports = async (page: number = 1): Promise<ReportListResponse> => {
  const response = await api.get(`/admin/reports/?page=${page}&page_size=7`);
  return response.data;
};

const generateReport = async (data: GenerateReportRequest): Promise<ApiReport> => {
  const response = await api.post('/admin/generate-report/', data);
  return response.data;
};

const downloadReportFile = async (fileUrl: string, fileName: string) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'report.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
};

// Transform API report to component format with safe handling
const transformApiReport = (apiReport: ApiReport): ReportCard => {
  // Safely handle name with fallback
  const name = apiReport.name || 'Untitled Report';
  const title = name.replace('.xlsx', '').replace(/_/g, ' ');
  
  return {
    id: apiReport.id,
    title: title,
    type: apiReport.report_type ? (apiTypeToDisplay[apiReport.report_type] || apiReport.report_type) : 'Unknown',
    date: apiReport.created_at ? formatToLocalDate(apiReport.created_at) : formatToLocalDate(new Date()),
    status: apiReport.status || 'PROCESSING',
    fileUrl: apiReport.file || '',
    fileName: apiReport.name || 'report.xlsx',
    includedMetrics: apiReport.included_metrics || [],
    startDate: apiReport.start_date,
    endDate: apiReport.end_date,
  };
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [dateError, setDateError] = useState<string>("");

  const [form, setForm] = useState<CreateReportForm>({
    reportType: "Weekly",
    metrics: [],
    startDate: "",
    endDate: "",
  });

  // Fetch reports on mount and page change
  useEffect(() => {
    loadReports();
  }, [currentPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports(currentPage);
      const transformedReports = data.results.map(transformApiReport);
      setReports(transformedReports);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 7));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Validate custom date range
  const validateCustomDates = (): boolean => {
    if (form.reportType !== "Custom") return true;
    
    if (!form.startDate || !form.endDate) {
      setDateError("Both start date and end date are required for custom reports");
      return false;
    }
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    
    if (start > end) {
      setDateError("Start date cannot be after end date");
      return false;
    }
    
    setDateError("");
    return true;
  };

  const handleGenerateReport = async () => {
    if (form.metrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    // Validate custom dates if report type is Custom
    if (form.reportType === "Custom" && !validateCustomDates()) {
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Generating report...');

    try {
      // Prepare API request data
      const requestData: GenerateReportRequest = {
        report_type: displayTypeToApi[form.reportType],
        included_metrics: form.metrics.map(m => metricToApiKey[m]),
      };

      // Add dates for custom report
      if (form.reportType === "Custom" && form.startDate && form.endDate) {
        requestData.start_date = form.startDate;
        requestData.end_date = form.endDate;
      }

      // Call API to generate report
      const response = await generateReport(requestData);
      
      // Check if response is 202 Accepted (processing) or 201 Created (completed)
      if (response && response.id) {
        // Success - report is created
        toast.success('Report generation started successfully!', { id: toastId });
        
        // Transform and add to list
        const newReport = transformApiReport(response);
        setReports(prev => [newReport, ...prev]);
        
        // Close modal and reset form
        setOpenModal(false);
        setForm({ 
          reportType: "Weekly", 
          metrics: [],
          startDate: "",
          endDate: "",
        });
        setDateError("");
        
        // Reset to first page to show new report
        setCurrentPage(1);
      } else {
        // If response is 202 but no data, show appropriate message
        toast.success('Report generation started! It will be available shortly.', { id: toastId });
        
        // Close modal and refresh list after a delay
        setOpenModal(false);
        setForm({ 
          reportType: "Weekly", 
          metrics: [],
          startDate: "",
          endDate: "",
        });
        setDateError("");
        
        // Refresh the list after 2 seconds to show the new report
        setTimeout(() => {
          loadReports();
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      
      // Enhanced error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          'Failed to generate report. Please try again.';
      toast.error(errorMessage, { id: toastId });
      
      // If it's a date error, set it in the date picker
      if (errorMessage.includes("date") || errorMessage.includes("start") || errorMessage.includes("end")) {
        setDateError(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: ReportCard) => {
    try {
      if (!report.fileUrl) {
        toast.error('No file available for download');
        return;
      }

      toast.loading('Downloading report...', { id: 'download' });
      
      await downloadReportFile(report.fileUrl, report.fileName || `${report.title}.xlsx`);
      
      toast.success('Report downloaded successfully!', { id: 'download' });
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report', { id: 'download' });
    }
  };

  const toggleMetric = (metric: ReportMetric) => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter((m) => m !== metric)
        : [...prev.metrics, metric],
    }));
  };

  // Handle report type change
  const handleReportTypeChange = (type: string) => {
    setForm(prev => ({
      ...prev,
      reportType: type as any,
      // Clear dates when switching away from Custom
      ...(type !== "Custom" && { startDate: "", endDate: "" })
    }));
    setDateError("");
  };
  

  const handleSelectAllMetrics = () => {
    setForm(prev => ({ ...prev, metrics: [...METRICS] }));
  };

  const handleClearAllMetrics = () => {
    setForm(prev => ({ ...prev, metrics: [] }));
  };

  const handleCancelModal = () => {
    setOpenModal(false);
    setForm({
      reportType: "Weekly",
      metrics: [],
      startDate: "",
      endDate: ""
    });
    setDateError("");
  };




  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-6 mt-5">
      {/* HEADER */}
      <div className="lg:flex items-center justify-between">
        <div>
          <h1 className="text-xl  font-semibold lg:text-start text-center  text-slate-900">Reports</h1>
          <p className="text-sm text-center text-slate-500">
            Generate and download comprehensive campaign reports
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          disabled={generating}
          className="rounded-lg mt-2 mx-auto lg:mx-0 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex gap-1 items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={16} />
          Create Reports
        </button>
      </div>

      {/* REPORT TYPES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportTypeCard
          icon={<Calendar size={18} className="text-blue-600" />}
          title="Weekly Report"
          bgColor="bg-blue-100"
        />
        <ReportTypeCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          title="Monthly Report"
          bgColor="bg-green-100"
        />
        <ReportTypeCard
          icon={<FileText size={18} className="text-purple-600" />}
          title="Custom Report"
          bgColor="bg-purple-100"
        />
      </div>

      {/* RECENT REPORTS */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Recent Reports
          </h2>
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          )}
          {!loading && totalCount > 0 && (
            <span className="text-xs text-slate-500">
              Total: {totalCount} reports
            </span>
          )}
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Loading reports...</p>
          </div>
        ) : reports.length > 0 ? (
          <>
            {/* Desktop list */}
            <div className="hidden sm:block">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="text-blue-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {r.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.date} · {r.type}
                        {r.status !== 'COMPLETED' && (
                          <span className="ml-2 text-yellow-600">({r.status})</span>
                        )}
                        {r.startDate && r.endDate && (
                          <span className="ml-2 text-blue-600">({r.startDate} to {r.endDate})</span>
                        )}
                      </p>
                      {r.includedMetrics && r.includedMetrics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.includedMetrics.slice(0, 3).map((metric, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                              {metric.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {r.includedMetrics.length > 3 && (
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                              +{r.includedMetrics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(r)}
                    disabled={r.status !== 'COMPLETED'}
                    className={`rounded-md cursor-pointer border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 ${
                      r.status !== 'COMPLETED' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={r.status !== 'COMPLETED' ? 'Report is still processing' : 'Download report'}
                  >
                    <Download size={12} />
                    {r.status === 'COMPLETED' ? 'Download' : r.status}
                  </button>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {reports.map((r) => (
                <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="text-blue-600" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.date} · {r.type}
                        {r.status !== 'COMPLETED' && (
                          <span className="ml-1 text-yellow-600">({r.status})</span>
                        )}
                      </p>
                      {r.startDate && r.endDate && (
                        <p className="text-xs text-blue-600 mt-0.5">{r.startDate} → {r.endDate}</p>
                      )}
                    </div>
                  </div>
                  {r.includedMetrics && r.includedMetrics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 pl-12">
                      {r.includedMetrics.slice(0, 3).map((metric, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                          {metric.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {r.includedMetrics.length > 3 && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                          +{r.includedMetrics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleDownload(r)}
                    disabled={r.status !== 'COMPLETED'}
                    className={`w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 ${
                      r.status !== 'COMPLETED' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <Download size={12} />
                    {r.status === 'COMPLETED' ? 'Download Report' : r.status}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">No reports found</p>
            <button
              onClick={() => setOpenModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first report
            </button>
          </div>
        )}

        {reports.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* CREATE REPORT MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCancelModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={generating}
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Create Custom Report
            </h2>

            {/* Report Type */}
            <label className="text-sm font-medium text-slate-700">
              Report Type
            </label>
            <select
              value={form.reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={generating}
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Custom">Custom</option>
            </select>

            {/* Date Range Picker - Only show for Custom reports */}
            {form.reportType === "Custom" && (
              <DateRangePicker
                startDate={form.startDate || ""}
                endDate={form.endDate || ""}
                onStartDateChange={(date) => setForm(prev => ({ ...prev, startDate: date }))}
                onEndDateChange={(date) => setForm(prev => ({ ...prev, endDate: date }))}
                error={dateError}
              />
            )}

            {/* Metrics */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">
                  Metrics
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllMetrics}
                    className="text-xs text-blue-600 hover:text-blue-700"
                    disabled={generating}
                  >
                    Select All
                  </button>
                  {form.metrics.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMetrics}
                      className="text-xs text-red-600 hover:text-red-700"
                      disabled={generating}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {METRICS.map((metric) => (
                  <label
                    key={metric}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      form.metrics.includes(metric)
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-300 hover:bg-slate-50"
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.metrics.includes(metric)}
                      onChange={() => toggleMetric(metric)}
                      disabled={generating}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{metric}</span>
                  </label>
                ))}
              </div>
              {form.metrics.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Please select at least one metric
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating || form.metrics.length === 0 || 
                  (form.reportType === "Custom" && (!form.startDate || !form.endDate))}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  form.metrics.length === 0 || (form.reportType === "Custom" && (!form.startDate || !form.endDate))
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } ${generating ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {generating && (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                )}
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportTypeCard = ({
  icon,
  title,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  bgColor: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
    <div
      className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center mb-3`}
    >
      {icon}
    </div>
    <p className="font-medium text-slate-900">{title}</p>
    <p className="text-sm text-slate-500">
      Generate and download instantly
    </p>
  </div>
);

export default AdminReports;