import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  TrendingUp,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Filter,
  MoreVertical,
  DollarSign,
  Target,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";
import { formatToLocalDate } from "@/lib/dateUtils";
import type {
  ReportType,
  Platform,
  Metric,
  RecentReport,
  CreateReportForm,
  ApiReport,
  PaginatedReportsResponse,
} from "@/types/reports";

interface FormattedReportRow {
  id: string;
  name: string;
  type: "Weekly" | "Monthly" | "Custom";
  dateGenerated: string;
  dateRange: string;
  format: "XLSX" | "PDF" | "CSV";
  fileUrl: string;
}

const DEFAULT_MOCK_REPORTS: FormattedReportRow[] = [
  {
    id: "r-1",
    name: "Weekly_report_Mahmud's Ad Service_20260430_20260406.xlsx",
    type: "Weekly",
    dateGenerated: "Apr 5, 2026 • 10:30 AM",
    dateRange: "Apr 1 - Apr 6, 2026",
    format: "XLSX",
    fileUrl: "#",
  },
  {
    id: "r-2",
    name: "Monthly_report_Mahmud's Ad Service_20260430_20260301.xlsx",
    type: "Monthly",
    dateGenerated: "Apr 1, 2026 • 09:15 AM",
    dateRange: "Mar 1 - Mar 31, 2026",
    format: "XLSX",
    fileUrl: "#",
  },
  {
    id: "r-3",
    name: "Custom_report_Performance Overview.pdf",
    type: "Custom",
    dateGenerated: "Mar 28, 2026 • 04:45 PM",
    dateRange: "Mar 1 - Mar 28, 2026",
    format: "PDF",
    fileUrl: "#",
  },
  {
    id: "r-4",
    name: "Monthly_report_Mahmud's Ad Service_20260228_20260201.xlsx",
    type: "Monthly",
    dateGenerated: "Mar 1, 2026 • 10:20 AM",
    dateRange: "Feb 1 - Feb 28, 2026",
    format: "XLSX",
    fileUrl: "#",
  },
  {
    id: "r-5",
    name: "Weekly_report_Mahmud's Ad Service_20260223_20260217.xlsx",
    type: "Weekly",
    dateGenerated: "Feb 23, 2026 • 11:05 AM",
    dateRange: "Feb 17 - Feb 23, 2026",
    format: "XLSX",
    fileUrl: "#",
  },
  {
    id: "r-6",
    name: "Custom_report_Campaign Analysis.pdf",
    type: "Custom",
    dateGenerated: "Feb 15, 2026 • 02:30 PM",
    dateRange: "Feb 1 - Feb 15, 2026",
    format: "PDF",
    fileUrl: "#",
  },
];

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
    Spend: "spend",
    Impressions: "impressions",
    Click: "clicks",
    CTR: "ctr",
    CPC: "cpc",
    ROAS: "roas",
  };
  return map[metric] || metric.toLowerCase();
};

const mapReportTypeToAPI = (type: ReportType): string => {
  const map: Record<ReportType, string> = {
    Weekly: "weekly",
    Monthly: "monthly",
    Custom: "custom",
  };
  return map[type] || "weekly";
};

const transformApiReportToUi = (apiReport: ApiReport): FormattedReportRow => {
  const isPdf = apiReport.file?.toLowerCase().endsWith(".pdf");
  const isCustom = apiReport.report_type.toLowerCase() === "custom";
  const isMonthly = apiReport.report_type.toLowerCase() === "monthly";

  return {
    id: String(apiReport.id),
    name: apiReport.name,
    type: isCustom ? "Custom" : isMonthly ? "Monthly" : "Weekly",
    dateGenerated: formatToLocalDate(apiReport.created_at),
    dateRange: "Apr 1 - Apr 30, 2026",
    format: isPdf ? "PDF" : "XLSX",
    fileUrl: apiReport.file || "#",
  };
};

const Reports: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [reportsList, setReportsList] = useState<FormattedReportRow[]>(DEFAULT_MOCK_REPORTS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");

  // Scheduled Reports Toggles
  const [scheduledReports, setScheduledReports] = useState([
    { id: "s1", title: "Weekly Performance Report", schedule: "Every Monday at 9:00 AM", enabled: true },
    { id: "s2", title: "Monthly Summary Report", schedule: "1st of every month at 10:00 AM", enabled: true },
    { id: "s3", title: "Campaign Performance Report", schedule: "15th of every month at 11:00 AM", enabled: true },
  ]);

  const [form, setForm] = useState<CreateReportForm>({
    reportType: "Weekly",
    platforms: [],
    metrics: [],
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchRecentReports();
  }, [currentPage]);

  const fetchRecentReports = async (): Promise<void> => {
    const org_id = getOrgId();
    if (!org_id) {
      return;
    }

    setLoadingReports(true);
    try {
      const response = await api.get<PaginatedReportsResponse>(
        `/analysis/reports/?org_id=${org_id}&page=${currentPage}&page_size=7`
      );

      if (response.data?.results && response.data.results.length > 0) {
        const fetched = response.data.results.map(transformApiReportToUi);
        setReportsList(fetched);
        setTotalPages(Math.ceil(response.data.count / 7));
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error);
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

    if (form.reportType === "Custom" && !validateCustomDates()) {
      return;
    }

    setGenerating(true);
    try {
      const payload: any = {
        report_type: mapReportTypeToAPI(form.reportType),
        included_metrics: form.metrics.map(mapMetricToAPI),
      };

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
        endDate: "",
      });
      setDateError("");

      fetchRecentReports();
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string): void => {
    try {
      if (fileUrl === "#") {
        toast.success(`Started downloading ${fileName}`);
        return;
      }
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleToggleScheduled = (id: string) => {
    setScheduledReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
    toast.success("Scheduled report setting updated");
  };

  const filteredReports = reportsList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === "All" || item.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Generate and download comprehensive campaign reports
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Report</span>
        </button>
      </div>

      {/* TOP 3 ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Weekly Report */}
        <div
          onClick={() => {
            setForm((prev) => ({ ...prev, reportType: "Weekly" }));
            setOpen(true);
          }}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Weekly Report</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Generate and download instantly</p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Monthly Report */}
        <div
          onClick={() => {
            setForm((prev) => ({ ...prev, reportType: "Monthly" }));
            setOpen(true);
          }}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Report</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Generate and download instantly</p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-xl bg-emerald-50/60 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Custom Report */}
        <div
          onClick={() => {
            setForm((prev) => ({ ...prev, reportType: "Custom" }));
            setOpen(true);
          }}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Custom Report</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Build a report with custom metrics</p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-xl bg-purple-50/60 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: RECENT REPORTS TABLE (8 COLUMNS ON DESKTOP FOR WIDER SPACE) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            {/* TABLE HEADER & FILTER CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Reports</h2>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="w-36 sm:w-48 bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Date Picker Button */}
                <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Apr 1, 2026 - Apr 30, 2026</span>
                </button>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 appearance-none focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filter Icon Button */}
                <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* TABLE CONTENT */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 font-bold min-w-[260px]">Report Name</th>
                    <th className="py-2.5 font-bold">Type</th>
                    <th className="py-2.5 font-bold">Date Generated</th>
                    <th className="py-2.5 font-bold">Date Range</th>
                    <th className="py-2.5 font-bold">Format</th>
                    <th className="py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingReports ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading reports...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Report Name & Icon */}
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3 min-w-[240px]">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate" title={row.name}>
                                {row.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {row.type} Report
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 pr-2">
                          <span
                            className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${
                              row.type === "Weekly"
                                ? "bg-blue-50 text-blue-600"
                                : row.type === "Monthly"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-purple-50 text-purple-600"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>

                        {/* Date Generated */}
                        <td className="py-3 pr-2 text-slate-600 font-medium whitespace-nowrap">
                          {row.dateGenerated}
                        </td>

                        {/* Date Range */}
                        <td className="py-3 pr-2 text-slate-500 font-medium whitespace-nowrap">
                          {row.dateRange}
                        </td>

                        {/* Format */}
                        <td className="py-3 pr-2">
                          <span
                            className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${
                              row.format === "PDF"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {row.format}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(row.fileUrl, row.name)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Download Report"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER / PAGINATION */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400 font-medium">
                Showing 1 to {filteredReports.length} of {filteredReports.length} reports
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt; Previous
                </button>
                <span className="bg-blue-600 text-white font-bold text-xs w-6 h-6 rounded-lg flex items-center justify-center">
                  1
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </div>

          {/* NEED A CUSTOM REPORT CARD BANNER */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Need a custom report?</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                  Create a custom report with the metrics and dimensions that matter most to your business.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, reportType: "Custom" }));
                setOpen(true);
              }}
              className="bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer flex items-center gap-1 shrink-0 transition-all"
            >
              <span>Create Custom Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REPORT INSIGHTS & SCHEDULED REPORTS (4 COLUMNS ON DESKTOP) */}
        <div className="lg:col-span-4 space-y-6">
          {/* CARD 1: REPORT INSIGHTS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Report Insights</h2>
            </div>

            <div className="space-y-3.5">
              {/* Insight 1 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Top Performing Campaign</h4>
                  <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Summer Sale 2024 generated the highest ROAS of <span className="font-bold text-blue-600">4.62x</span>
                  </p>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Total Spend</h4>
                  <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                    <span className="font-bold text-emerald-600">$11,506.50</span> spent across all campaigns in the selected period
                  </p>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-full bg-purple-50 text-purple-600 shrink-0 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Conversion Rate</h4>
                  <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                    <span className="font-bold text-purple-600">2.35%</span> average conversion rate across all campaigns
                  </p>
                </div>
              </div>

              {/* Insight 4 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-full bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Impressions</h4>
                  <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                    <span className="font-bold text-amber-600">2.45M</span> total impressions delivered across all platforms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: SCHEDULED REPORTS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Scheduled Reports</h2>
            </div>

            <div className="space-y-4">
              {scheduledReports.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.schedule}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleScheduled(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.enabled ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                onClick={() => toast.info("Viewing all scheduled reports")}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
              >
                <span>View All Scheduled Reports</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE REPORT MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 relative shadow-xl space-y-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-slate-900">Create Report</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Report Type</label>
              <select
                value={form.reportType}
                onChange={(e) => setForm((prev) => ({ ...prev, reportType: e.target.value as ReportType }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Weekly">Weekly Report</option>
                <option value="Monthly">Monthly Report</option>
                <option value="Custom">Custom Report</option>
              </select>
            </div>

            {form.reportType === "Custom" && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p className="font-semibold text-slate-700">Custom Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
                {dateError && <p className="text-[10px] text-rose-500">{dateError}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Included Platforms</label>
              <div className="flex gap-3 text-xs">
                {(["Meta", "TikTok", "Google"] as Platform[]).map((p) => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.platforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Metrics to Include</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(["Spend", "Impressions", "Click", "CTR", "CPC", "ROAS"] as Metric[]).map((m) => {
                  const isChecked = form.metrics.includes(m);
                  return (
                    <div
                      key={m}
                      onClick={() => toggleMetric(m)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-blue-50 border-blue-500 text-blue-600 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{m}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                onClick={() => setOpen(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={generating}
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-60 transition-all flex items-center gap-1.5"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;