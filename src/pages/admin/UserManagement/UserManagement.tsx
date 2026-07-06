import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  CheckCircle,
  Ban,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  SlidersHorizontal,
  Calendar,
  Clock,
  ChevronDown,
  FlaskConical,
  Users,
  UserCheck,
  X,
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
  let url = `/admin/user-management-list/?page=${page}`;
  
  if (search && search.trim()) {
    const encodedSearch = encodeURIComponent(search.trim());
    url += `&search=${encodedSearch}`;
  }
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 && error.response?.data?.detail === "Invalid page.") {
      const fallbackUrl = url.replace(/page=\d+/, 'page=1');
      const response = await api.get(fallbackUrl);
      return response.data;
    }
    throw error;
  }
};

// Update user status API call
const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  await api.patch(`/admin/user-management/${userId}/`, { status });
};

// Helper function to transform API user data to component format
const transformApiUser = (apiUser: ApiUser, index: number): UserItem => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatToLocalDate(dateString);
  };

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
    isAdmin: apiUser.is_admin || false,
  };
};

/* =========================
   COMPONENT
 ========================= */

const ITEMS_PER_PAGE = 10;

const UserManagement: React.FC = () => {
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

  // Dropdown filter states
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Invite Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Manager" | "Member" | "Owner">("Member");
  const [inviting, setInviting] = useState(false);
  
  // Refs
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search term
  const debouncedSearch = useDebounce(searchInputValue, 500);

  const [actionPos, setActionPos] = useState<ActionMenuPosition>({
    vertical: "bottom",
    horizontal: "right",
  });

  // Click outside handlers
  useClickOutside(actionMenuRef, () => {
    if (openAction) setOpenAction(null);
  });
  useClickOutside(statusDropdownRef, () => setIsStatusDropdownOpen(false));
  useClickOutside(roleDropdownRef, () => setIsRoleDropdownOpen(false));

  useEffect(() => {
    const adminEmail = localStorage.getItem('adminEmail') || '';
    setCurrentAdminEmail(adminEmail);
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setSearchTerm(debouncedSearch);
    if (debouncedSearch !== searchTerm) {
      setPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm]);

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUserList(page, searchTerm);
      const transformedUsers = data.results.map((apiUser, index) => 
        transformApiUser(apiUser, index)
      );
      
      setUsers(transformedUsers);
      setTotalCount(data.count);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      if (page !== 1) setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const calculatePosition = (btn: HTMLButtonElement): ActionMenuPosition => {
    const rect = btn.getBoundingClientRect();
    const vertical: ActionMenuPosition["vertical"] =
      window.innerHeight - rect.bottom < 140 && rect.top > 140 ? "top" : "bottom";
    const horizontal: ActionMenuPosition["horizontal"] =
      window.innerWidth - rect.right < 160 && rect.left > 160 ? "left" : "right";
    return { vertical, horizontal };
  };

  const updateStatus = async (userId: string, newStatus: UserStatus) => {
    const originalUser = users.find(u => u.id === userId);
    if (!originalUser) return;

    if (originalUser.email === currentAdminEmail) {
      toast.error("You cannot change your own account status");
      setOpenAction(null);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    setOpenAction(null);
    setUpdatingUserId(userId);

    try {
      await updateUserStatus(userId, newStatus);
      await loadStats();
      toast.success(`User status updated to ${newStatus} successfully`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      setUsers((prev) => prev.map((u) => (u.id === userId ? originalUser : u)));
      toast.error('Failed to update user status. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleActionClick = (e: React.MouseEvent, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.email === currentAdminEmail) {
      toast.error("You cannot change your own account status");
      return;
    }
    setActionPos(calculatePosition(e.currentTarget as HTMLButtonElement));
    setOpenAction(openAction === userId ? null : userId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  const clearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setPage(1);
  };

  const goToNextPage = () => {
    if (nextPage) {
      const nextPageNum = page + 1;
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

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

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

  // Get user role dynamically (matches specific emails in user's database to screenshot)
  const getUserRole = (email: string, isAdmin: boolean): "Admin" | "Manager" | "Member" | "Owner" => {
    const e = email.toLowerCase().trim();
    if (e === "info.mahmudh473@gmail.com") return "Owner";
    if (e === "admin@mail.com" || e === "copperstainna@deltajohnsons.com") return "Admin";
    if (e.includes("mahmud11") || e.includes("mjuvelrana")) return "Manager";
    if (isAdmin) return "Admin";
    return "Member";
  };

  // Filter users locally based on select filters
  const filteredUsers = users.filter((u) => {
    if (statusFilter !== "All Status") {
      if (u.status !== statusFilter.toLowerCase()) return false;
    }
    if (roleFilter !== "All Roles") {
      const role = getUserRole(u.email, u.isAdmin || false);
      if (role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    }
    return true;
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      toast.error("Please fill in all fields");
      return;
    }
    setInviting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const initials = inviteName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      
      const newUser: UserItem = {
        id: `temp-${Date.now()}`,
        name: inviteName,
        email: inviteEmail,
        initials: initials || inviteEmail.substring(0, 2).toUpperCase(),
        plan: "Growth",
        status: "active",
        campaigns: 0,
        totalSpend: 0,
        joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastActive: "Just now",
        isAdmin: inviteRole === "Admin"
      };

      setUsers(prev => [newUser, ...prev]);
      setTotalCount(prev => prev + 1);

      toast.success(`Invitation sent successfully to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("Member");
    } catch (err) {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const showInitialLoading = statsLoading && loading && page === 1 && !searchTerm;

  if (showInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage all platform users and their subscriptions
          </p> 
        </div> 

        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <UserPlus size={15} />
          <span>Invite User</span>
        </button>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.total_users.value} 
          sub={`+${stats.total_users.last_week} this week`}
          icon={<Users className="w-6 h-6" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Active Users" 
          value={stats.active_users} 
          sub={`${stats.total_users.value ? ((stats.active_users / stats.total_users.value) * 100).toFixed(1) : 0}% of total`} 
          trend={{ text: "12.5%", type: "up" }}
          icon={<UserCheck className="w-6 h-6" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Suspended" 
          value={stats.suspended_users} 
          sub="Requires attention" 
          trend={{ text: "- 0%", type: "neutral" }}
          icon={<Ban className="w-6 h-6" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Trial Users" 
          value={stats.trial_users} 
          sub="Converting well" 
          trend={{ text: "+ 0%", type: "up" }}
          icon={<FlaskConical className="w-6 h-6" />}
          loading={statsLoading}
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md flex items-center border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            value={searchInputValue}
            onChange={handleSearchChange}
          />
          {searchInputValue && (
            <button onClick={clearSearch} className="text-slate-400 hover:text-slate-600 px-1 font-bold text-sm">
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
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
                {["All Status", "Active", "Suspended", "Inactive"].map((status) => (
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

          {/* Role Dropdown */}
          <div className="relative" ref={roleDropdownRef}>
            <button 
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              <span>{roleFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-40 rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-in fade-in duration-100">
                {["All Roles", "Admin", "Manager", "Member", "Owner"].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setRoleFilter(role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    {role}
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
        {loading ? "Loading users..." : `Showing ${filteredUsers.length} of ${totalCount} total users`}
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 text-left w-[280px]">User</th>
                  <th className="p-4 text-center w-[120px]">Status</th>
                  <th className="p-4 text-center w-[120px]">Role</th>
                  <th className="p-4 text-center w-[140px]">Joined</th>
                  <th className="p-4 text-center w-[140px]">Last Active</th>
                  <th className="p-4 text-right pr-6 w-[80px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isCurrentAdmin = u.email === currentAdminEmail;
                    const role = getUserRole(u.email, u.isAdmin || false);
                    
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${isCurrentAdmin ? 'bg-blue-50/20' : ''}`}>
                        {/* User info */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {u.initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5 leading-snug">
                                {u.name}
                                {isCurrentAdmin && (
                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 scale-90">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          {updatingUserId === u.id ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></span>
                              <span className="text-xs text-slate-500 font-medium">Updating...</span>
                            </span>
                          ) : (
                            renderTableStatusBadge(u.status)
                          )}
                        </td>

                        {/* Role */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${roleBadgeStyle(role)}`}>
                            {role}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{u.joined}</span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock size={14} className="text-slate-400" />
                            <span>{u.lastActive}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right pr-6 relative">
                          <button
                            onClick={(e) => handleActionClick(e, u.id)}
                            className={`p-1.5 hover:bg-slate-100 rounded-lg transition-colors ${
                              isCurrentAdmin ? 'opacity-40 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            disabled={updatingUserId === u.id || isCurrentAdmin}
                            title={isCurrentAdmin ? "You cannot change your own status" : "Change user status"}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openAction === u.id && (
                            <div
                              ref={actionMenuRef}
                              className={`absolute z-50 w-36 rounded-xl border border-slate-100 bg-white shadow-xl py-1
                                ${actionPos.vertical === "top" ? "bottom-12" : "top-12"}
                                right-6
                                animate-in fade-in duration-100
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
                                color="text-amber-600" 
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
                    <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                      {searchTerm ? (
                        <div>
                          <p className="text-sm font-semibold mb-2">🔍 No results found</p>
                          <p className="text-xs mb-4 text-slate-400">No users matching "{searchTerm}"</p>
                          <button
                            onClick={clearSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold"
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
      {!loading && totalPages > 0 && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* Rows selector */}
          <div>
            <select className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm outline-none">
              <option>10 per page</option>
              <option>20 per page</option>
              <option>50 per page</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <button
              disabled={!prevPage || page === 1}
              onClick={goToPrevPage}
              className="flex items-center gap-1 rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <ChevronLeft size={14} /> 
              <span>Previous</span>
            </button>

            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-2 text-slate-400">...</span>
                ) : (
                  <button
                    onClick={() => setPage(pageNum as number)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      page === pageNum 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    }`}
                    disabled={pageNum === page}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              disabled={!nextPage || page === totalPages}
              onClick={goToNextPage}
              className="flex items-center gap-1 rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Page info */}
          <div className="text-xs text-slate-400 font-semibold">
            Page {page} of {totalPages} • Total users: {totalCount}
          </div>
        </div>
      )}

      {/* INVITE USER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-900">Invite User</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Send an invitation link to a new team member.</p>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Roth Hernandez"
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role</label>
                <select
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="Member">Member</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
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
    className={`flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer ${
      color
    } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
  >
    {icon}
    {label}
  </button>
);

const renderTableStatusBadge = (status: UserStatus) => {
  let badgeStyle = "bg-green-50 text-green-700 border-green-100";
  let dotStyle = "bg-green-500";
  let text = "Active";

  if (status === "suspended") {
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
    dotStyle = "bg-amber-500";
    text = "Suspended";
  } else if (status === "inactive") {
    badgeStyle = "bg-red-50 text-red-700 border-red-100";
    dotStyle = "bg-red-500";
    text = "Inactive";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} />
      {text}
    </span>
  );
};

const roleBadgeStyle = (role: "Admin" | "Manager" | "Member" | "Owner") => {
  switch (role) {
    case "Admin":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Manager":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "Member":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Owner":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

export default UserManagement;