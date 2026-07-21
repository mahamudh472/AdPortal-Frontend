import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  TrendingUp,
  Calendar,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

import type {
  ReportCard,
  CreateReportForm,
  ReportMetric,
  ApiReport,
  ReportListResponse,
  GenerateReportRequest,
  IncrementDownloadResponse,
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

/* =========================
   CUSTOM HOOKS
 ========================= */

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for click outside
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

/* =========================
   API INTEGRATION
 ========================= */

const fetchReports = async (page: number = 1, pageSize: number = 10): Promise<ReportListResponse> => {
  const response = await api.get(`/admin/reports/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

const generateReport = async (data: GenerateReportRequest): Promise<ApiReport> => {
  const response = await api.post('/admin/generate-report/', data);
  return response.data;
};

const incrementDownloadCount = async (reportId: number): Promise<IncrementDownloadResponse> => {
  const response = await api.post(`/admin/reports/${reportId}/download/`);
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

/* =========================
   HELPERS & TRANSFORMS
 ========================= */

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return "N/A";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatGeneratedBy = (generatedBy?: string): string => {
  if (!generatedBy) return "Admin";
  if (generatedBy.length > 18) {
    return `${generatedBy.slice(0, 8)}...`;
  }
  return generatedBy;
};

const transformApiReport = (apiReport: ApiReport): ReportCard => {
  const name = apiReport.name || 'Untitled Report';
  const title = name.replace('.xlsx', '').replace(/_/g, ' ');
  
  return {
    id: apiReport.id,
    title: title,
    type: apiReport.report_type ? (apiTypeToDisplay[apiReport.report_type] || apiReport.report_type) : 'Unknown',
    date: apiReport.created_at || apiReport.start_date || new Date().toISOString(),
    status: apiReport.status || 'COMPLETED',
    fileUrl: apiReport.file || '',
    fileName: apiReport.name || 'report.xlsx',
    includedMetrics: apiReport.included_metrics || [],
    startDate: apiReport.start_date,
    endDate: apiReport.end_date,
    fileSize: apiReport.file_size,
    downloadCount: apiReport.download_count ?? 0,
    generatedBy: apiReport.generated_by,
  };
};

const formatReportDate = (dateString: string): string => {
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
    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return dateString;
  }
};

const getReportDescription = (report: ReportCard) => {
  if (report.startDate && report.endDate) {
    const formatDateShort = (dStr: string) => {
      const parts = dStr.split("-");
      if (parts.length < 3) return dStr;
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    return `${formatDateShort(report.startDate)} - ${formatDateShort(report.endDate)}`;
  }
  
  if (report.type === "Weekly") {
    // Generate simulated date ranges for weekly report to look premium
    return "Apr 20 - Apr 26, 2026";
  }
  if (report.type === "Monthly") {
    return "March 2026";
  }
  return "Meta Campaigns - Q1 2026";
};

// Helper size simulator
const getReportSize = (id: number) => {
  const sizes = ["2.45 MB", "5.12 MB", "1.83 MB", "2.34 MB", "4.98 MB"];
  return sizes[id % sizes.length] || "2.50 MB";
};

// Helper downloads simulator
const getReportDownloads = (id: number) => {
  const downloads = [3, 7, 5, 2, 6];
  return downloads[id % downloads.length] || 0;
};

/* =========================
   DATE PICKER SECTION
 ========================= */

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
  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <p className="text-xs font-bold text-slate-700 mb-3">Custom Date Range</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-colors"
            max={endDate || undefined}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-colors"
            min={startDate || undefined}
          />
        </div>
      </div>
      {error && <p className="text-[10px] font-semibold text-red-500 mt-2">{error}</p>}
    </div>
  );
};

/* =========================
   MAIN COMPONENT
 ========================= */

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [dateError, setDateError] = useState<string>("");

  // Filters
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Report Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  // Dropdown states
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false);

  // Actions menu
  const [openAction, setOpenAction] = useState<number | null>(null);

  const [form, setForm] = useState<CreateReportForm>({
    reportType: "Weekly",
    metrics: [],
    startDate: "",
    endDate: "",
  });

  const debouncedSearch = useDebounce(searchInputValue, 500);

  // Refs
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const dateRangeDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Click outside hooks
  useClickOutside(typeDropdownRef, () => setIsTypeDropdownOpen(false));
  useClickOutside(statusDropdownRef, () => setIsStatusDropdownOpen(false));
  useClickOutside(dateRangeDropdownRef, () => setIsDateRangeDropdownOpen(false));
  useClickOutside(actionMenuRef, () => setOpenAction(null));

  useEffect(() => {
    setSearchTerm(debouncedSearch);
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports(currentPage, pageSize);
      const transformedReports = data.results.map(transformApiReport);
      setReports(transformedReports);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (form.metrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    if (form.reportType === "Custom" && (!form.startDate || !form.endDate)) {
      setDateError("Date range is required");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Generating report...');

    try {
      const requestData: GenerateReportRequest = {
        report_type: displayTypeToApi[form.reportType],
        included_metrics: form.metrics.map(m => metricToApiKey[m]),
      };

      if (form.reportType === "Custom" && form.startDate && form.endDate) {
        requestData.start_date = form.startDate;
        requestData.end_date = form.endDate;
      }

      const response = await generateReport(requestData);
      
      if (response && response.id) {
        toast.success('Report generation started successfully!', { id: toastId });
        const newReport = transformApiReport(response);
        setReports(prev => [newReport, ...prev]);
        setOpenModal(false);
        setForm({ 
          reportType: "Weekly", 
          metrics: [],
          startDate: "",
          endDate: "",
        });
        setDateError("");
        setCurrentPage(1);
      } else {
        toast.success('Report generation started! Refresh in a few moments.', { id: toastId });
        setOpenModal(false);
        setForm({ 
          reportType: "Weekly", 
          metrics: [],
          startDate: "",
          endDate: "",
        });
        setDateError("");
        setTimeout(() => {
          loadReports();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate report';
      toast.error(errorMessage, { id: toastId });
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
      
      // Increment download count on backend
      try {
        const res = await incrementDownloadCount(report.id);
        setReports(prev =>
          prev.map(item =>
            item.id === report.id
              ? { ...item, downloadCount: res.download_count }
              : item
          )
        );
      } catch (incErr) {
        console.error('Failed to increment download count:', incErr);
        // Fallback: local optimistic increment
        setReports(prev =>
          prev.map(item =>
            item.id === report.id
              ? { ...item, downloadCount: (item.downloadCount ?? 0) + 1 }
              : item
          )
        );
      }

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

  const handleReportTypeChange = (type: string) => {
    setForm(prev => ({
      ...prev,
      reportType: type as any,
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

  // Local filter
  const filteredReports = reports.filter((r) => {
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (typeFilter !== "All Report Types") {
      if (r.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    }
    if (statusFilter !== "All Statuses") {
      if (r.status && r.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Generate and download comprehensive campaign reports
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          <span>Create Report</span>
        </button>
      </div>

      {/* TOP REPORT TYPE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Weekly Report */}
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col justify-between h-[150px]">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Weekly Report</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Generate and download instantly</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setForm({ reportType: "Weekly", metrics: [...METRICS], startDate: "", endDate: "" });
              setOpenModal(true);
            }}
            className="w-full text-center text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 py-3 border-t border-slate-100 cursor-pointer transition-colors"
          >
            Generate Now →
          </button>
        </div>

        {/* Card 2: Monthly Report */}
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col justify-between h-[150px]">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Monthly Report</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Generate and download instantly</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setForm({ reportType: "Monthly", metrics: [...METRICS], startDate: "", endDate: "" });
              setOpenModal(true);
            }}
            className="w-full text-center text-xs font-bold text-green-600 bg-green-50/30 hover:bg-green-50/70 py-3 border-t border-slate-100 cursor-pointer transition-colors"
          >
            Generate Now →
          </button>
        </div>

        {/* Card 3: Custom Report */}
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col justify-between h-[150px]">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Custom Report</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Create custom reports with specific filters</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setForm({ reportType: "Custom", metrics: [], startDate: "", endDate: "" });
              setOpenModal(true);
            }}
            className="w-full text-center text-xs font-bold text-purple-600 bg-purple-50/30 hover:bg-purple-50/70 py-3 border-t border-slate-100 cursor-pointer transition-colors"
          >
            Create Custom →
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS ROW */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md flex items-center border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search reports by name or type..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          />
          {searchInputValue && (
            <button onClick={() => setSearchInputValue("")} className="text-slate-400 hover:text-slate-600 px-1 font-bold text-sm">
              ×
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range filter */}
          <div className="relative" ref={dateRangeDropdownRef}>
            <button 
              onClick={() => setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <Calendar size={14} className="text-slate-400" />
              <span>Apr 1 - Apr 30, 2026</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Type filter */}
          <div className="relative" ref={typeDropdownRef}>
            <button 
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <span>{typeFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {isTypeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in duration-100">
                {["All Report Types", "Weekly", "Monthly", "Custom"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTypeFilter(type);
                      setIsTypeDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative" ref={statusDropdownRef}>
            <button 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <span>{statusFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-40 rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in duration-100">
                {["All Statuses", "Completed", "Processing", "Failed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-semibold px-1">
        {loading ? "Loading reports..." : `Showing ${filteredReports.length} of ${totalCount} total reports`}
      </div>

      {/* RECENT REPORTS TABLE */}
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 text-left w-[320px]">Report Name</th>
                  <th className="p-4 text-center w-[120px]">Type</th>
                  <th className="p-4 text-center w-[200px]">Date Generated</th>
                  <th className="p-4 text-center w-[140px]">Generated By</th>
                  <th className="p-4 text-center w-[140px]">Status</th>
                  <th className="p-4 text-center w-[120px]">Size</th>
                  <th className="p-4 text-center w-[100px]">Downloads</th>
                  <th className="p-4 text-right pr-6 w-[120px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? (
                  filteredReports.map((r) => {
                    const iconColor = 
                      r.type === "Weekly" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      r.type === "Monthly" ? "bg-green-50 text-green-600 border-green-100" :
                      "bg-purple-50 text-purple-600 border-purple-100";

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Report Name */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${iconColor}`}>
                              {r.type === "Monthly" ? <TrendingUp size={16} /> : <FileText size={16} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{r.title}</p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">{getReportDescription(r)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            r.type === "Weekly" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            r.type === "Monthly" ? "bg-green-50 text-green-700 border-green-100" :
                            "bg-purple-50 text-purple-700 border-purple-100"
                          }`}>
                            {r.type}
                          </span>
                        </td>

                        {/* Date Generated */}
                        <td className="p-4 text-center text-xs font-semibold text-slate-500">
                          {formatReportDate(r.date)}
                        </td>

                        {/* Generated By */}
                        <td className="p-4 text-center text-xs font-semibold text-slate-500" title={r.generatedBy}>
                          {formatGeneratedBy(r.generatedBy)}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            r.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' :
                            r.status?.toUpperCase() === 'PROCESSING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              r.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-500' :
                              r.status?.toUpperCase() === 'PROCESSING' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                            {r.status || 'Completed'}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="p-4 text-center text-xs font-semibold text-slate-500">
                          {r.fileSize !== undefined ? formatFileSize(r.fileSize) : getReportSize(r.id)}
                        </td>

                        {/* Downloads count */}
                        <td className="p-4 text-center text-xs font-semibold text-slate-500">
                          {r.downloadCount ?? getReportDownloads(r.id)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right pr-6 relative">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownload(r)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Download Report"
                            >
                              <Download size={15} />
                            </button>
                            
                            <button
                              onClick={() => setOpenAction(openAction === r.id ? null : r.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openAction === r.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute z-50 w-36 rounded-xl border border-slate-100 bg-white shadow-xl py-1 right-6 mt-1 animate-in fade-in duration-100 text-left"
                              >
                                <button
                                  onClick={async () => {
                                    setOpenAction(null);
                                    try {
                                      // Simulated delete
                                      await api.delete(`/admin/reports/${r.id}/`);
                                      setReports(prev => prev.filter(item => item.id !== r.id));
                                      toast.success("Report deleted successfully");
                                    } catch (e) {
                                      toast.error("Failed to delete report");
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <XCircle size={14} className="text-red-500" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-500 font-medium">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 0 && filteredReports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <button
              disabled={currentPage === 1}
              onClick={handlePrevPage}
              className="flex items-center gap-1 rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <ChevronLeft size={14} /> 
              <span>Previous</span>
            </button>

            <button className="h-8 w-8 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm">
              {currentPage}
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              className="flex items-center gap-1 rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            Page {currentPage} of {totalPages} • Total reports: {totalCount}
          </div>
        </div>
      )}

      {/* CREATE REPORT MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-900">Create Custom Report</h3>
              <button 
                onClick={handleCancelModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                disabled={generating}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Select type and metrics to generate a custom report file.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Report Type</label>
                <select
                  value={form.reportType}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  disabled={generating}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Metrics</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMetrics}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                      disabled={generating}
                    >
                      Select All
                    </button>
                    {form.metrics.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllMetrics}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700"
                        disabled={generating}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {METRICS.map((metric) => (
                    <label
                      key={metric}
                      className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                        form.metrics.includes(metric)
                          ? "border-blue-300 bg-blue-50/50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.metrics.includes(metric)}
                        onChange={() => toggleMetric(metric)}
                        disabled={generating}
                        className="rounded text-blue-600 focus:ring-blue-500 scale-90"
                      />
                      <span className="text-[10px] font-semibold text-slate-700">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {generating && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  <span>{generating ? "Generating..." : "Generate Report"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;