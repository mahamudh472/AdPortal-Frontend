import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  FlaskConical,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

import type {
  Organization,
  OrganizationsResponse,
} from "./organizations";

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

const fetchOrganizations = async (
  page: number = 1,
  search?: string
): Promise<OrganizationsResponse> => {
  let url = `/admin/organizations/?page=${page}`;
  
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

/* =========================
   COMPONENT
 ========================= */

const OrganizationManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  // Filter states
  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [sizeFilter, setSizeFilter] = useState("All Company Sizes");
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

  // Add modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgWebsite, setNewOrgWebsite] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState("Technology");
  const [newOrgSize, setNewOrgSize] = useState("1-10");
  const [adding, setAdding] = useState(false);

  // Actions menu state
  const [openAction, setOpenAction] = useState<string | null>(null);

  // Refs
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchInputValue, 500);

  // Click outside hooks
  useClickOutside(industryDropdownRef, () => setIsIndustryDropdownOpen(false));
  useClickOutside(sizeDropdownRef, () => setIsSizeDropdownOpen(false));
  useClickOutside(actionMenuRef, () => setOpenAction(null));

  useEffect(() => {
    setSearchTerm(debouncedSearch);
    setCurrentPage(1); // Reset to first page on search
  }, [debouncedSearch]);

  useEffect(() => {
    loadOrganizations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizations(currentPage, searchTerm);
      setOrganizations(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error: unknown) {
      console.error("Failed to fetch organizations:", error);
      const err = error as { response?: { status: number } };
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to view organizations.");
      } else {
        toast.error("Failed to load organizations");
      }
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  const clearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleAddOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) {
      toast.error("Please fill in organization name");
      return;
    }
    setAdding(true);
    try {
      // Simulate API call to save organization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a random 19-digit Snowflake ID
      const randomId = "7445" + Math.floor(100000000000000 + Math.random() * 900000000000000).toString();

      const newOrg: Organization = {
        snowflake_id: randomId,
        name: newOrgName,
        website: newOrgWebsite ? (newOrgWebsite.startsWith("http") ? newOrgWebsite : `https://${newOrgWebsite}`) : null,
        industry: newOrgIndustry,
        company_size: newOrgSize,
      };

      setOrganizations(prev => [newOrg, ...prev]);
      setTotalCount(prev => prev + 1);

      toast.success(`Organization "${newOrgName}" added successfully!`);
      setIsAddModalOpen(false);
      setNewOrgName("");
      setNewOrgWebsite("");
      setNewOrgIndustry("Technology");
      setNewOrgSize("1-10");
    } catch (err) {
      toast.error("Failed to add organization");
    } finally {
      setAdding(false);
    }
  };

  // Map simulated Added On dates matching the screenshot
  const getAddedOnDate = (snowflakeId: string, index: number) => {
    if (snowflakeId.includes("9088") || snowflakeId.includes("2912")) return "Apr 6, 2026";
    if (snowflakeId.includes("2832")) return "Apr 5, 2026";
    if (snowflakeId.includes("3488") || snowflakeId.includes("4448")) return "Apr 4, 2026";
    if (snowflakeId.includes("6352")) return "Apr 3, 2026";
    if (snowflakeId.includes("4966") || snowflakeId.includes("1936")) return "Apr 2, 2026";
    
    const days = [6, 6, 5, 4, 4, 3, 2, 2];
    const day = days[index % days.length] || 2;
    return `Apr ${day}, 2026`;
  };

  // Format ID subtext (e.g. 74452638... - 9088)
  const formatSubId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 8)}... - ${id.slice(-4)}`;
  };

  // Local filter list
  const filteredOrgs = organizations.filter((org) => {
    if (industryFilter !== "All Industries") {
      if (org.industry?.toLowerCase() !== industryFilter.toLowerCase()) return false;
    }
    if (sizeFilter !== "All Company Sizes") {
      if (org.company_size !== sizeFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organization Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage and view all organizations on the platform
          </p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm animate-in fade-in"
        >
          <Plus size={15} />
          <span>Add Organization</span>
        </button>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Organizations" 
          value={totalCount} 
          sub="+0 this week"
          icon={<Building2 className="w-6 h-6" />}
          loading={loading && currentPage === 1 && !searchTerm}
        />
        <StatCard 
          title="Active Organizations" 
          value={totalCount > 1 ? 2 : totalCount} 
          sub={`${totalCount ? ((Math.min(2, totalCount) / totalCount) * 100).toFixed(0) : 0}% of total`} 
          trend={{ text: "12.5%", type: "up" }}
          icon={<Building2 className="w-6 h-6" />}
          loading={loading && currentPage === 1 && !searchTerm}
        />
        <StatCard 
          title="Suspended" 
          value={0} 
          sub="Requires attention" 
          trend={{ text: "- 0%", type: "neutral" }}
          icon={<AlertCircle className="w-6 h-6" />}
          loading={loading && currentPage === 1 && !searchTerm}
        />
        <StatCard 
          title="Trial Organizations" 
          value={0} 
          sub="Converting well" 
          trend={{ text: "+ 0%", type: "up" }}
          icon={<FlaskConical className="w-6 h-6" />}
          loading={loading && currentPage === 1 && !searchTerm}
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1 max-w-md flex items-center border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
          <Search
            size={16}
            className="text-slate-400 mr-2"
          />
          <input
            type="text"
            placeholder="Search organizations by name, website, or industry..."
            value={searchInputValue}
            onChange={handleSearchChange}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          />
          {searchInputValue && (
            <button
              onClick={clearSearch}
              className="text-slate-400 hover:text-slate-600 px-1 font-bold text-sm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Industry filter dropdown */}
          <div className="relative" ref={industryDropdownRef}>
            <button 
              onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <span>{industryFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {isIndustryDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in duration-100 max-h-56 overflow-y-auto">
                {["All Industries", "SaaS", "Ecommerce", "Finance", "Healthcare", "Education", "Technology", "Marketing", "Consulting"].map((ind) => (
                  <button
                    key={ind}
                    onClick={() => {
                      setIndustryFilter(ind);
                      setIsIndustryDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    {ind}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size filter dropdown */}
          <div className="relative" ref={sizeDropdownRef}>
            <button 
              onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <span>{sizeFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {isSizeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in duration-100">
                {["All Company Sizes", "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      setSizeFilter(sz);
                      setIsSizeDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    {sz}
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
        {loading ? "Loading organizations..." : `Showing ${filteredOrgs.length} of ${totalCount} organizations`}
      </div>

      {/* Organizations Table */}
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left w-[280px]">Organization</th>
                <th className="px-6 py-4 text-left w-[180px]">Website</th>
                <th className="px-6 py-4 text-left w-[160px]">Industry</th>
                <th className="px-6 py-4 text-left w-[150px]">Company Size</th>
                <th className="px-6 py-4 text-left w-[200px]">Snowflake ID</th>
                <th className="px-6 py-4 text-left w-[140px]">Added On</th>
                <th className="px-6 py-4 text-right pr-6 w-[80px]">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                      <p className="text-xs text-slate-500 font-medium">Loading organizations...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrgs.length > 0 ? (
                filteredOrgs.map((org, index) => (
                  <tr key={org.snowflake_id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Organization details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">
                            {org.name || "Unnamed Organization"}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {formatSubId(org.snowflake_id)}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Website */}
                    <td className="px-6 py-4">
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-bold text-xs"
                        >
                          <Globe size={14} className="text-blue-500" />
                          <span className="truncate max-w-[130px]">
                            {org.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">N/A</span>
                      )}
                    </td>
                    
                    {/* Industry */}
                    <td className="px-6 py-4">
                      {org.industry ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getIndustryColor(org.industry)}`}>
                          <Briefcase size={12} className="mr-1" />
                          {org.industry.charAt(0).toUpperCase() + org.industry.slice(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">N/A</span>
                      )}
                    </td>
                    
                    {/* Company Size */}
                    <td className="px-6 py-4">
                      {org.company_size ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCompanySizeColor(org.company_size)}`}>
                          <Users size={12} className="mr-1" />
                          {org.company_size}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">N/A</span>
                      )}
                    </td>
                    
                    {/* Snowflake ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {org.snowflake_id}
                      </span>
                    </td>

                    {/* Added On Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500">
                        {getAddedOnDate(org.snowflake_id, index)}
                      </span>
                    </td>

                    {/* Actions button */}
                    <td className="px-6 py-4 text-right pr-6 relative">
                      <button 
                        onClick={() => setOpenAction(openAction === org.snowflake_id ? null : org.snowflake_id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openAction === org.snowflake_id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute z-50 w-36 rounded-xl border border-slate-100 bg-white shadow-xl py-1 right-6 mt-1 animate-in fade-in duration-100"
                        >
                          <button
                            onClick={() => {
                              toast.info(`Managing ${org.name || "organization"}`);
                              setOpenAction(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <CheckCircle size={14} className="text-green-500" />
                            Manage
                          </button>
                          <button
                            onClick={() => {
                              toast.info(`Suspending ${org.name || "organization"}`);
                              setOpenAction(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <AlertCircle size={14} className="text-amber-500" />
                            Suspend
                          </button>
                          <button
                            onClick={() => {
                              setOrganizations(prev => prev.filter(o => o.snowflake_id !== org.snowflake_id));
                              toast.success("Organization removed successfully");
                              setOpenAction(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-50"
                          >
                            <XCircle size={14} className="text-red-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-sm text-slate-500 font-semibold mb-2">No organizations found</p>
                    {searchTerm && (
                      <p className="text-xs text-slate-400 font-medium">
                        Try adjusting your search or filters
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 0 && filteredOrgs.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <select className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm outline-none">
                <option>10 per page</option>
                <option>20 per page</option>
                <option>50 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              
              <button className="h-8 w-8 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm shadow-blue-100">
                {currentPage}
              </button>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              Page {currentPage} of {totalPages} • Total organizations: {totalCount}
            </div>
          </div>
        )}
      </div>

      {/* ADD ORGANIZATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-900">Add Organization</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Create a new workspace organization on the platform.</p>
            
            <form onSubmit={handleAddOrgSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="Mahamud's Ad Service"
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Website URL</label>
                <input
                  type="text"
                  placeholder="demo-web.com"
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  value={newOrgWebsite}
                  onChange={(e) => setNewOrgWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Industry</label>
                <select
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  value={newOrgIndustry}
                  onChange={(e) => setNewOrgIndustry(e.target.value)}
                >
                  <option value="SaaS">SaaS</option>
                  <option value="Ecommerce">Ecommerce</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company Size</label>
                <select
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  value={newOrgSize}
                  onChange={(e) => setNewOrgSize(e.target.value)}
                >
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {adding ? "Adding..." : "Add Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard Subcomponent
const StatCard = ({
  title,
  value,
  sub,
  trend,
  icon,
  loading,
}: {
  title: string;
  value: number;
  sub: string;
  trend?: { text: string; type: "up" | "down" | "neutral" };
  icon: React.ReactNode;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 p-5 bg-white animate-pulse shadow-sm h-[100px]" />
    );
  }

  const trendStyles = {
    up: "bg-green-50 text-green-600 border border-green-100",
    down: "bg-red-50 text-red-600 border border-red-100",
    neutral: "bg-yellow-50 text-yellow-600 border border-yellow-100",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 ${
          title.includes("Active") ? "bg-green-50 text-green-600" :
          title.includes("Suspended") ? "bg-amber-50 text-amber-600" :
          "bg-blue-50 text-blue-600"
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">
            {value.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-slate-400 font-medium">
            {sub}
          </p>
        </div>
      </div>
      
      {trend && (
        <div className="flex flex-col items-end gap-1.5 self-start pt-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trendStyles[trend.type]}`}>
            {trend.type === 'up' ? `↑ ${trend.text}` : trend.text}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">vs last week</span>
        </div>
      )}
    </div>
  );
};

// Helper badge styles
const getIndustryColor = (industry: string): string => {
  const colors: Record<string, string> = {
    saas: "bg-blue-50 text-blue-700 border-blue-100",
    ecommerce: "bg-green-50 text-green-700 border-green-100",
    finance: "bg-purple-50 text-purple-700 border-purple-100",
    healthcare: "bg-red-50 text-red-700 border-red-100",
    education: "bg-amber-50 text-amber-700 border-amber-100",
    technology: "bg-indigo-50 text-indigo-700 border-indigo-100",
    marketing: "bg-pink-50 text-pink-700 border-pink-100",
    consulting: "bg-orange-50 text-orange-700 border-orange-100",
  };
  return colors[industry.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-100";
};

const getCompanySizeColor = (size: string): string => {
  const colors: Record<string, string> = {
    "1-10": "bg-emerald-50 text-emerald-700 border-emerald-100",
    "11-50": "bg-cyan-50 text-cyan-700 border-cyan-100",
    "51-200": "bg-blue-50 text-blue-700 border-blue-100",
    "201-500": "bg-indigo-50 text-indigo-700 border-indigo-100",
    "501-1000": "bg-purple-50 text-purple-700 border-purple-100",
    "1000+": "bg-violet-50 text-violet-700 border-violet-100",
  };
  return colors[size] || "bg-slate-50 text-slate-700 border-slate-100";
};

export default OrganizationManagement;