import React, { useState, useEffect } from "react";
import { FileText, Calendar, TrendingUp, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";
import type {
  ReportType,
  Platform,
  Metric,
  RecentReport,
  CreateReportForm,
  ApiReport,
  PaginatedReportsResponse
} from "@/types/reports";

const getOrgId = (): string | null => {
  const selectedOrg = localStorage.getItem("selectedOrganization");
  if (selectedOrg) {
    try {
      const parsed = JSON.parse(selectedOrg);
      if (parsed?.id) return parsed.id;
    } catch (error) {
      console.error("Error parsing organization:", error);
    }
  }
  return null;
};

const mapMetricToAPI = (metric: Metric): string => {
  const map: Record<Metric, string> = {
    "Spend": "spend",
    "Impressions": "impressions",
    "Click": "clicks",
    "CTR": "ctr",
    "CPC": "cpc",
    "ROAS": "roas"
  };
  return map[metric] || metric.toLowerCase();
};

const mapReportTypeToAPI = (type: ReportType): string => {
  const map: Record<ReportType, string> = {
    "Weekly": "weekly",
    "Monthly": "monthly",
    "Custom": "custom"
  };
  return map[type] || "weekly";
};

const transformApiReportToUi = (apiReport: ApiReport): RecentReport => {
  return {
    id: apiReport.id,
    title: apiReport.name,
    date: new Date(apiReport.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    frequency: apiReport.report_type.charAt(0).toUpperCase() + apiReport.report_type.slice(1),
    fileUrl: apiReport.file
  };
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
            max={endDate || undefined}
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

const Reports: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [dateError, setDateError] = useState<string>("");

  const [form, setForm] = useState<CreateReportForm>({
    reportType: "Weekly",
    platforms: [],
    metrics: [],
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchRecentReports();
  }, [currentPage]);

  const fetchRecentReports = async (): Promise<void> => {
    const org_id = getOrgId();
    if (!org_id) {
      setLoadingReports(false);
      return;
    }

    setLoadingReports(true);
    try {
      const response = await api.get<PaginatedReportsResponse>(
        `/analysis/reports/?org_id=${org_id}&page=${currentPage}&page_size=7`
      );
      
      const reports = response.data.results.map(transformApiReportToUi);

      setRecentReports(reports);
      setTotalPages(Math.ceil(response.data.count / 7));
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load reports");
      }
    } finally {
      setLoadingReports(false);
    }
  };

  const togglePlatform = (p: Platform): void => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const toggleMetric = (m: Metric): void => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(m)
        ? prev.metrics.filter((x) => x !== m)
        : [...prev.metrics, m],
    }));
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

  const handleGenerateReport = async (): Promise<void> => {
    const org_id = getOrgId();
    if (!org_id) {
      toast.error("Please select an organization first");
      return;
    }

    if (form.metrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    // Validate custom dates if report type is Custom
    if (form.reportType === "Custom" && !validateCustomDates()) {
      return;
    }

    setGenerating(true);
    try {
      const payload: any = {
        report_type: mapReportTypeToAPI(form.reportType),
        included_metrics: form.metrics.map(mapMetricToAPI)
      };

      // Add date range for custom reports
      if (form.reportType === "Custom") {
        payload.start_date = form.startDate;
        payload.end_date = form.endDate;
      }

      await api.post(`/analysis/generate-report/?org_id=${org_id}`, payload);
      
      toast.success("Report generated successfully!");
      setOpen(false);
      setForm({
        reportType: "Weekly",
        platforms: [],
        metrics: [],
        startDate: "",
        endDate: ""
      });
      setDateError("");
      
      fetchRecentReports();
    } catch (error: any) {
      console.error("Error generating report:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (error.response?.status === 400) {
        // Show specific error message from backend
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           "Invalid request. Please check your inputs.";
        toast.error(errorMessage);
        
        // If it's a date error, set it in the date picker
        if (errorMessage.includes("start_date") || errorMessage.includes("end_date")) {
          setDateError(errorMessage);
        }
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to generate reports.");
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.message === "Network Error") {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(error.response?.data?.message || "Failed to generate report");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string): void => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = fileUrl;
      
      // The download attribute helps suggest a filename, though it may be ignored
      // by some browsers for cross-origin URLs.
      link.setAttribute('download', fileName);
      
      // Open in a new tab to ensure the current page isn't navigated away
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  const handlePrevPage = (): void => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = (): void => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleCancelModal = (): void => {
    setOpen(false);
    setForm({
      reportType: "Weekly",
      platforms: [],
      metrics: [],
      startDate: "",
      endDate: ""
    });
    setDateError("");
  };

  const handleSelectAllMetrics = (): void => {
    const allMetrics: Metric[] = ["Spend", "Impressions", "Click", "CTR", "CPC", "ROAS"];
    setForm(prev => ({ ...prev, metrics: allMetrics }));
  };

  const handleClearAllMetrics = (): void => {
    setForm(prev => ({ ...prev, metrics: [] }));
  };

  // Handle report type change
  const handleReportTypeChange = (type: ReportType): void => {
    setForm(prev => ({
      ...prev,
      reportType: type,
      // Clear dates when switching away from Custom
      ...(type !== "Custom" && { startDate: "", endDate: "" })
    }));
    setDateError("");
  };

  return (
    <div className="space-y-6 mt-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">
            Generate and download comprehensive campaign reports
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex gap-1 items-center"
        >
          <FileText size={16} />
          Create Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard
          icon={<Calendar className="text-blue-600" />}
          title="Weekly Report"
        />
        <ReportCard
          icon={<TrendingUp className="text-green-600" />}
          title="Monthly Report"
        />
        <ReportCard
          icon={<FileText className="text-purple-600" />}
          title="Custom Report"
        />
      </div>

      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Recent Reports
          </h2>
          {loadingReports && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          )}
        </div>

        {loadingReports ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Loading reports...</p>
          </div>
        ) : recentReports.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No reports found</p>
          </div>
        ) : (
          <>
            {recentReports.map((r: RecentReport) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm  md:flex hidden font-medium text-slate-900">
                      {r.title}
                    </p>
                    <p className="text-sm md:hidden font-medium text-slate-900">
                      {r.title.slice(0, 15)}{r.title.length > 15 ? "..." : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.date} · {r.frequency}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(r.fileUrl, r.title)}
                  className="rounded-md cursor-pointer border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            ))}
          </>
        )}

        {recentReports.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loadingReports}
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
              disabled={currentPage === totalPages || loadingReports}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 relative">
            <button
              onClick={handleCancelModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Create Custom Report
            </h2>

            <label className="text-sm font-medium text-slate-700">
              Report Type
            </label>
            <select
              value={form.reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
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

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Included Platforms
              </p>
              <div className="flex gap-4 text-sm">
                {(["Meta", "TikTok", "Google"] as Platform[]).map((p: Platform) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.platforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>

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
                  >
                    Select All
                  </button>
                  {form.metrics.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMetrics}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(
                  ["Spend", "Impressions", "Click", "CTR", "CPC", "ROAS"] as Metric[]
                ).map((m: Metric) => (
                  <label
                    key={m}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      form.metrics.includes(m)
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.metrics.includes(m)}
                      onChange={() => toggleMetric(m)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{m}</span>
                  </label>
                ))}
              </div>
              {form.metrics.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Please select at least one metric
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating || form.metrics.length === 0 || (form.reportType === "Custom" && (!form.startDate || !form.endDate))}
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

const ReportCard = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">
        Generate and download instantly
      </p>
    </div>
  );
};

export default Reports;