import React, { useEffect, useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  User,
  Trash2,
  X,
  Mail,
  AlertTriangle,
  Loader2,
  Users,
  UserCheck,
  Send,
  UserX,
  ChevronDown,
  Search,
  MoreVertical,
  ArrowRight,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../src/hooks/reduxHooks";
import {
  fetchTeamMembers,
  inviteTeamMember,
  fetchTeam,
  deleteTeamMember,
  updateTeamMemberRole,
} from "../../../src/features/Team/teamThunks";

import type { TeamMember, InviteForm } from "@/types/team";
import { clearTeamError, clearTeamMessage } from "@/features/Team/teamSlice";

// Get current user email from localStorage
const getCurrentUserEmail = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || null;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
  }
  return null;
};

const getOrgId = (): string | null => {
  const selectedOrg = localStorage.getItem("selectedOrganization");
  if (selectedOrg) {
    try {
      const parsed = JSON.parse(selectedOrg);
      if (parsed?.id) return parsed.id;
    } catch {}
  }

  const orgs = localStorage.getItem("organizations");
  if (orgs) {
    try {
      const parsed = JSON.parse(orgs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0][0];
      }
    } catch {}
  }

  return null;
};

const getInitials = (name: string | undefined | null): string => {
  if (!name || typeof name !== "string") return "MH";
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "MH";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const DEFAULT_MEMBER_FALLBACK: TeamMember = {
  id: 9991,
  role: "OWNER",
  status: "ACTIVE",
  user: {
    id: 1,
    email: "info.mahmud473@gmail.com",
    full_name: "Md. Mahmud Hasan",
  },
};

const Team: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, message, error, team, members } = useAppSelector(
    (state) => state.team
  );

  const [open, setOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    member: TeamMember | null;
  }>({ open: false, member: null });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");

  const [invite, setInvite] = useState<InviteForm>({
    email: "",
    role: "ADMIN",
  });

  const currentUserEmail = getCurrentUserEmail();

  // Initial data fetch
  useEffect(() => {
    const org_id = getOrgId();
    if (org_id) {
      Promise.all([
        dispatch(fetchTeam({ org_id })),
        dispatch(fetchTeamMembers({ org_id })),
      ]).catch(() => {
        toast.error("Failed to load team data");
      });
    }
  }, [dispatch]);

  // Handle redux messages and errors
  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(clearTeamMessage());
    }
    if (error) {
      dispatch(clearTeamError());
    }
  }, [message, error, dispatch]);

  const handleInvite = async () => {
    const org_id = getOrgId();

    if (!org_id) {
      toast.error("Organization not found");
      return;
    }

    if (!invite.email) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invite.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviteLoading(true);

    try {
      const result = await dispatch(
        inviteTeamMember({
          org_id,
          payload: {
            email: invite.email,
            role: invite.role,
          },
        })
      ).unwrap();

      if (result) {
        toast.success("Invitation sent successfully! Please check your email.");
        setInvite({ email: "", role: "ADMIN" });
        setOpen(false);

        await Promise.all([
          dispatch(fetchTeam({ org_id })),
          dispatch(fetchTeamMembers({ org_id })),
        ]);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || "Failed to send invitation";
      toast.error(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleUpdate = async (memberId: number, newRole: string) => {
    const org_id = getOrgId();
    if (!org_id) {
      toast.error("Organization not found");
      return;
    }

    setUpdatingId(memberId);

    try {
      const result = await dispatch(
        updateTeamMemberRole({
          org_id,
          member_id: memberId,
          role: newRole,
        })
      ).unwrap();

      if (result) {
        toast.success(`Updated to ${newRole} successfully!`);
        await dispatch(fetchTeamMembers({ org_id }));
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || "Failed to update role";
      toast.error(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.member) return;

    const org_id = getOrgId();
    if (!org_id) {
      toast.error("Organization not found");
      return;
    }

    setDeleteLoading(true);

    try {
      const result = await dispatch(
        deleteTeamMember({
          org_id,
          member_id: deleteModal.member.id,
        })
      ).unwrap();

      if (result) {
        setDeleteModal({ open: false, member: null });

        await Promise.all([
          dispatch(fetchTeam({ org_id })),
          dispatch(fetchTeamMembers({ org_id })),
        ]);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || "Failed to remove team member";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const displayMembers: TeamMember[] =
    Array.isArray(members) && members.length > 0 ? members : [DEFAULT_MEMBER_FALLBACK];

  const filteredMembers = displayMembers.filter((m) => {
    const name = m.user?.full_name || "";
    const email = m.user?.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "All" || m.role?.toUpperCase() === selectedRoleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const totalMembersCount = team?.total_members ?? displayMembers.length;
  const activeMembersCount = team?.active_members ?? displayMembers.filter((m) => m.status === "ACTIVE").length;
  const pendingInvitesCount = team?.pending_invitations ?? 0;
  const inactiveMembersCount = team?.inactive_members ?? 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Collaboration</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Invite team members and manage access
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          disabled={inviteLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-60"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* TOP 4 STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Members */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Members</p>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {totalMembersCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">All team members</p>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Users</p>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {activeMembersCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Currently active</p>
          </div>
        </div>

        {/* Card 3: Pending Invites */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Invites</p>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {pendingInvitesCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Awaiting acceptance</p>
          </div>
        </div>

        {/* Card 4: Inactive Members */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Inactive Members</p>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {inactiveMembersCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">No longer active</p>
          </div>
        </div>
      </div>

      {/* ROLES & PERMISSIONS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Roles & Permissions</h2>

        <div className="divide-y divide-slate-100">
          {/* Owner Role */}
          <div className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Owner</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Full access to all features, billing, and team management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-purple-50 text-purple-600 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                Full Access
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                All permissions
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Admin Role */}
          <div className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Admin</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Can manage campaigns, view analytics, and invite members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                Manage
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                Most permissions
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Member Role */}
          <div className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Member</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Can create and edit campaigns, view analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                Limited
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                Basic permissions
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* TEAM MEMBERS TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Team Members</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium self-end sm:self-auto">
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
          </span>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex items-center gap-3 flex-wrap text-xs pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-48 sm:w-56 bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 appearance-none focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 font-bold min-w-[220px]">Member</th>
                <th className="py-2.5 font-bold">Role</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold">Joined</th>
                <th className="py-2.5 font-bold">Last Active</th>
                <th className="py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No team members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const memberName = member.user?.full_name || "Md. Mahmud Hasan";
                  const memberEmail = member.user?.email || "info.mahmud473@gmail.com";
                  const memberRole = member.role || "OWNER";
                  const memberStatus = member.status || "ACTIVE";
                  const isOwner = memberRole.toUpperCase() === "OWNER";
                  const isSelf = memberEmail === currentUserEmail || member.id === 9991;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* MEMBER AVATAR & NAME */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {getInitials(memberName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{memberName}</p>
                              {isSelf && (
                                <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-1.5 py-0.2 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{memberEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE BADGE */}
                      <td className="py-3.5 pr-3">
                        <span
                          className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isOwner
                              ? "bg-purple-50 text-purple-600"
                              : memberRole.toUpperCase() === "ADMIN"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isOwner && <Crown className="w-3 h-3 text-purple-600" />}
                          <span>{memberRole.charAt(0).toUpperCase() + memberRole.slice(1).toLowerCase()}</span>
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3.5 pr-3">
                        <span
                          className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block ${
                            memberStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : memberStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* JOINED */}
                      <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                        Apr 20, 2026 • 10:30 AM
                      </td>

                      {/* LAST ACTIVE */}
                      <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                        Apr 20, 2026 • 10:30 AM
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (isOwner) {
                                toast.info("Owner account has full access permissions");
                                return;
                              }
                            }}
                            className="border border-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 hover:bg-slate-50 cursor-pointer shadow-sm transition-colors"
                          >
                            <span>Manage</span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          {!isSelf && !isOwner && (
                            <button
                              onClick={() => setDeleteModal({ open: true, member })}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEED MORE TEAM MEMBERS BANNER */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Need more team members?</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Upgrade your plan to add more team members and collaborate better.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/user-dashboard/subscriptions")}
          className="bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
        >
          <span>Upgrade Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* INVITE MEMBER MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 relative shadow-xl space-y-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-slate-900">Invite Team Member</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="colleague@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Role</label>
              <select
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as "ADMIN" | "MEMBER" })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="ADMIN">Admin (Can manage campaigns & view analytics)</option>
                <option value="MEMBER">Member (Basic access)</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                onClick={() => setOpen(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={inviteLoading || !invite.email}
                onClick={handleInvite}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-60 transition-all flex items-center gap-1.5"
              >
                {inviteLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Invite</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.open && deleteModal.member && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 relative shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Remove Team Member</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-bold text-slate-800">
                    {deleteModal.member.user?.full_name || deleteModal.member.user?.email}
                  </span>{" "}
                  from the team? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteModal({ open: false, member: null })}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-60 transition-all flex items-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;