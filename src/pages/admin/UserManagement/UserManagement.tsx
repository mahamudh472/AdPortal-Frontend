import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  CheckCircle,
  Ban,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";
import { formatToLocalDate, parseUTCDate } from "@/lib/dateUtils";

import type {
  UserItem,
  UserStatus,
  ActionMenuPosition,
  UserStats,
  UserListResponse,
  ApiUser,
} from "@/types/userManagement";

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

// API functions
const fetchUserStats = async (): Promise<UserStats> => {
  const response = await api.get('/admin/user-management/');
  return response.data;
};

// Updated fetchUserList with better error handling
const fetchUserList = async (page: number, search?: string): Promise<UserListResponse> => {
  // Always start with page 1 for new searches
  let url = `/admin/user-management-list/?page=${page}`;
  
  // Add search parameter if provided
  if (search && search.trim()) {
    const encodedSearch = encodeURIComponent(search.trim());
    url += `&search=${encodedSearch}`;
    
    if (import.meta.env.DEV) {
      console.log(`🔍 Searching users with: "${search}"`);
      console.log(`📡 API URL: ${url}`);
    }
  }
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    // Handle 404 specifically for invalid page
    if (error.response?.status === 404 && error.response?.data?.detail === "Invalid page.") {
      // If page is invalid, try fetching page 1
      if (import.meta.env.DEV) {
        console.log('⚠️ Invalid page, falling back to page 1');
      }
      
      // Reconstruct URL with page=1
      const fallbackUrl = url.replace(/page=\d+/, 'page=1');
      const response = await api.get(fallbackUrl);
      return response.data;
    }
    throw error;
  }
};

// Update user status API call
const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  // Use only the actual user ID (not email)
  if (import.meta.env.DEV) {
    console.log(`📡 Updating user ID ${userId} status to: ${status}`);
  }
  await api.patch(`/admin/user-management/${userId}/`, { status });
};

// Helper function to transform API user data to component format
const transformApiUser = (apiUser: ApiUser, index: number): UserItem => {
  // Generate initials from full_name or email
  const getName = () => {
    if (apiUser.full_name) {
      return apiUser.full_name;
    }
    return apiUser.email.split('@')[0];
  };

  const getInitials = () => {
    if (apiUser.full_name) {
      return apiUser.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return apiUser.email.substring(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatToLocalDate(dateString);
  };

  // Get last active time
  const getLastActive = () => {
    if (!apiUser.last_login) return 'Never';
    const lastLogin = parseUTCDate(apiUser.last_login);
    if (!lastLogin) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Map API status to component status
  const mapStatus = (apiStatus: string): UserStatus => {
    switch (apiStatus.toLowerCase()) {
      case 'active':
        return 'active';
      case 'suspended':
        return 'suspended';
      case 'inactive':
        return 'inactive';
      default:
        return 'inactive';
    }
  };

  return {
    id: apiUser.id || `${apiUser.email}-${index}`,
    name: getName(),
    email: apiUser.email,
    initials: getInitials(),
    plan: "Growth",
    status: mapStatus(apiUser.status),
    campaigns: 0,
    totalSpend: 0,
    joined: formatDate(apiUser.joined_at),
    lastActive: getLastActive(),
    isAdmin: apiUser.is_admin || false, // Add admin flag
  };
};

/* =========================
   COMPONENT
========================= */

const ITEMS_PER_PAGE = 10;

const UserManagement: React.FC = () => {
  // Get current admin email from localStorage or context
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("");
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: { value: 0, last_week: 0 },
    active_users: 0,
    suspended_users: 0,
    trial_users: 0,
  });
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Ref for action menu to detect clicks outside
  const actionMenuRef = useRef<HTMLDivElement>(null);
  
  // Debounce search term
  const debouncedSearch = useDebounce(searchInputValue, 500);

  const [actionPos, setActionPos] = useState<ActionMenuPosition>({
    vertical: "bottom",
    horizontal: "right",
  });

  // Get current admin email on mount
  useEffect(() => {
    // Get admin email from localStorage or auth context
    // Adjust this based on where you store the admin email
    const adminEmail = localStorage.getItem('adminEmail') || '';
    setCurrentAdminEmail(adminEmail);
  }, []);

  // Use click outside hook to close action menu
  useClickOutside(actionMenuRef, () => {
    if (openAction) {
      setOpenAction(null);
    }
  });

  // Fetch stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Handle search and page changes
  useEffect(() => {
    // Update search term when debounced value changes
    setSearchTerm(debouncedSearch);
    
    // Reset to page 1 when search changes
    if (debouncedSearch !== searchTerm) {
      setPage(1);
    }
  }, [debouncedSearch]);

  // Fetch users when page or search term changes
  useEffect(() => {
    loadUsers();
  }, [page, searchTerm]);

  // Load user statistics
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load user list with search
  const loadUsers = async () => {
    setLoading(true);
    try {
      if (import.meta.env.DEV && searchTerm) {
        console.log(`🔎 Searching for: "${searchTerm}" on page ${page}`);
      }
      
      const data = await fetchUserList(page, searchTerm);
      
      if (import.meta.env.DEV) {
        console.log(`📊 Found ${data.count} total results`);
        console.log(`📄 Showing page ${page} with ${data.results.length} users`);
      }
      
      const transformedUsers = data.results.map((apiUser, index) => 
        transformApiUser(apiUser, index)
      );
      
      setUsers(transformedUsers);
      setTotalCount(data.count);
      setNextPage(data.next);
      setPrevPage(data.previous);
      
      // If we got results but page might be invalid, update page from response
      if (data.next) {
        const nextPageMatch = data.next.match(/page=(\d+)/);
        if (nextPageMatch && nextPageMatch[1]) {
          // Current page is valid
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      
      // Reset to page 1 on error
      if (page !== 1) {
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculatePosition = (btn: HTMLButtonElement): ActionMenuPosition => {
    const rect = btn.getBoundingClientRect();

    const vertical: ActionMenuPosition["vertical"] =
      window.innerHeight - rect.bottom < 140 && rect.top > 140
        ? "top"
        : "bottom";

    const horizontal: ActionMenuPosition["horizontal"] =
      window.innerWidth - rect.right < 160 && rect.left > 160
        ? "left"
        : "right";

    return { vertical, horizontal };
  };

  const updateStatus = async (userId: string, newStatus: UserStatus) => {
    // Store the original user data for rollback in case of error
    const originalUser = users.find(u => u.id === userId);
    if (!originalUser) return;

    // Check if this is the current admin user
    if (originalUser.email === currentAdminEmail) {
      toast.error("You cannot change your own account status");
      setOpenAction(null);
      return;
    }

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    setOpenAction(null);
    setUpdatingUserId(userId);

    try {
      // Call API to update status
      await updateUserStatus(userId, newStatus);
      
      // Refresh stats after status update
      await loadStats();
      
      toast.success(`User status updated to ${newStatus} successfully`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      
      // Rollback on error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? originalUser : u))
      );
      
      toast.error('Failed to update user status. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle action button click
  const handleActionClick = (e: React.MouseEvent, userId: string) => {
    const user = users.find(u => u.id === userId);
    
    // Check if this is the current admin user
    if (user?.email === currentAdminEmail) {
      toast.error("You cannot change your own account status");
      return;
    }
    
    setActionPos(calculatePosition(e.currentTarget as HTMLButtonElement));
    setOpenAction(openAction === userId ? null : userId);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setPage(1);
  };

  // Handle page change with validation
  const goToNextPage = () => {
    if (nextPage) {
      const nextPageNum = page + 1;
      // Check if next page would be valid
      if (nextPageNum <= Math.ceil(totalCount / ITEMS_PER_PAGE)) {
        setPage(nextPageNum);
      }
    }
  };

  const goToPrevPage = () => {
    if (prevPage && page > 1) {
      setPage(page - 1);
    }
  };

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];
    
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  // Show loading state
  const showInitialLoading = statsLoading && loading && page === 1 && !searchTerm;

  if (showInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH REFRESH */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">User management</h1>
          <p className="text-sm text-slate-500">
            Manage all platform users and their subscriptions
          </p> 
        </div> 

       
        
        
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.total_users.value} 
          sub={`+${stats.total_users.last_week} this week`}
          loading={statsLoading}
        />
        <StatCard 
          title="Active Users" 
          value={stats.active_users} 
          sub={`${stats.total_users.value ? ((stats.active_users / stats.total_users.value) * 100).toFixed(1) : 0}% of total`} 
          variant="green"
          loading={statsLoading}
        />
        <StatCard 
          title="Suspended" 
          value={stats.suspended_users} 
          sub="Requires attention" 
          variant="yellow"
          loading={statsLoading}
        />
        <StatCard 
          title="Trial Users" 
          value={stats.trial_users} 
          sub="Converting well" 
          variant="blue"
          loading={statsLoading}
        />
      </div>

      {/* SEARCH AND RESULTS COUNT */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 mb-3">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm outline-none"
            value={searchInputValue}
            onChange={handleSearchChange}
          />
          {searchInputValue && (
            <button
              onClick={clearSearch}
              className="text-slate-400 hover:text-slate-600 px-2 text-lg font-bold"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></span>
                {searchTerm ? `Searching for "${searchTerm}"...` : 'Loading...'}
              </span>
            ) : (
              <>
                Showing {users.length} of {totalCount} total users
                {searchTerm && ` for "${searchTerm}"`}
              </>
            )}
          </span>
          {searchTerm && !loading && (
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 ">
              <tr>
                <th className="p-3  w-[260px] text-left">User</th>
                <th className="p-3 w-[120px]">Status</th>
                <th className="p-3 w-[120px]">Joined</th>
                <th className="p-3 w-[120px]">Last Active</th>
                <th className="p-3 w-[80px] text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length > 0 ? (
                users.map((u) => {
                  const isCurrentAdmin = u.email === currentAdminEmail;
                  
                  return (
                    <tr key={u.id} className={`border-t hover:bg-slate-50 ${isCurrentAdmin ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                            {u.initials}
                          </div>
                          <div>
                            <p className="font-medium">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {updatingUserId === u.id ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></span>
                            <span className="text-xs text-slate-500">Updating...</span>
                          </span>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(u.status)}`}>
                            {u.status}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">{u.joined}</td>
                      <td className="p-3 text-center">{u.lastActive}</td>

                      <td className="p-3 text-right relative">
                        <button
                          onClick={(e) => handleActionClick(e, u.id)}
                          className={`p-1 hover:bg-slate-100 rounded transition-colors ${
                            isCurrentAdmin ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={updatingUserId === u.id || isCurrentAdmin}
                          title={isCurrentAdmin ? "You cannot change your own status" : "Change user status"}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openAction === u.id && (
                          <div
                            ref={actionMenuRef}
                            className={`absolute z-50 w-36 rounded-xl border bg-white shadow-lg
                              ${actionPos.vertical === "top" ? "bottom-10" : "top-10"}
                              ${actionPos.horizontal === "left" ? "right-8" : "right-8"}
                            `}
                          >
                            <Action 
                              label="Active" 
                              icon={<CheckCircle size={14} />} 
                              color="text-green-600" 
                              onClick={() => updateStatus(u.id, "active")}
                              disabled={updatingUserId === u.id || u.status === "active"}
                            />
                            <Action 
                              label="Suspended" 
                              icon={<Ban size={14} />} 
                              color="text-yellow-600" 
                              onClick={() => updateStatus(u.id, "suspended")}
                              disabled={updatingUserId === u.id || u.status === "suspended"}
                            />
                            <Action 
                              label="Inactive" 
                              icon={<XCircle size={14} />} 
                              color="text-red-600" 
                              onClick={() => updateStatus(u.id, "inactive")}
                              disabled={updatingUserId === u.id || u.status === "inactive"}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    {searchTerm ? (
                      <div>
                        <p className="text-lg font-medium mb-2">🔍 No results found</p>
                        <p className="text-sm mb-4">No users matching "{searchTerm}"</p>
                        <button
                          onClick={clearSearch}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      'No users found'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 0 && users.length > 0 && (
        <>
        
          <div className="flex items-center justify-between">
            <button
              disabled={!prevPage || page === 1}
              onClick={goToPrevPage}
              className="flex items-center gap-1 rounded-lg border lg:px-3 px-2 py-1 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="flex gap-2 items-center">
              {getPageNumbers().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="px-2 text-slate-400">...</span>
                  ) : (
                    <button
                      onClick={() => setPage(pageNum as number)}
                      className={`h-8 w-8 rounded-lg transition-colors ${
                        page === pageNum 
                          ? "bg-blue-600 text-white" 
                          : "border hover:bg-slate-50"
                      }`}
                      disabled={pageNum === page}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              disabled={!nextPage || page === totalPages}
              onClick={goToNextPage}
              className="flex items-center gap-1 rounded-lg  border lg:px-3 px-2 py-1 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          {/* Page info */}
          <div className="text-center text-xs text-slate-500">
            Page {page} of {totalPages} • Total users: {totalCount}
            {searchTerm && ` • Search results for "${searchTerm}"`}
          </div>
        </>
      )}
    </div>
  );
};

// Helper components
const StatCard = ({
  title,
  value,
  sub,
  variant,
  loading,
}: {
  title: string;
  value: number;
  sub: string;
  variant?: "green" | "yellow" | "blue";
  loading?: boolean;
}) => {
  const styles = {
    green: "border-green-300 bg-green-50 text-green-600",
    yellow: "border-yellow-300 bg-yellow-50 text-yellow-600",
    blue: "border-blue-300 bg-blue-50 text-blue-600",
  };

  if (loading) {
    return (
      <div className="rounded-xl border p-4 bg-white animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 lg:text-start text-center ${variant ? styles[variant] : "bg-white"}`}>
      <p className="text-sm">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs">{sub}</p>
    </div>
  );
};

const Action = ({
  label,
  icon,
  color,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
      color
    } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
  >
    {icon}
    {label}
  </button>
);

const statusBadge = (status: UserStatus) => {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "suspended") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

export default UserManagement;