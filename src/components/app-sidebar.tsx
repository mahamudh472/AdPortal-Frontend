import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Send,
  BarChart3,
  Sparkles,
  FileText,
  Users,
  Settings,
  CreditCard,
  BriefcaseBusiness,
  Crown,
  ArrowRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { logout } from "../features/auth/AuthThunks";
import api from "@/lib/axios";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import AccountDropdown from "./AccountDropdown/AccountDropdown";

// Clean user menu items
const userItems = [
  { title: "Dashboard", url: "/user-dashboard/dashboard", icon: Home },
  { title: "Campaigns", url: "/user-dashboard/campaigns", icon: Send },
  { title: "Analytics", url: "/user-dashboard/analytics", icon: BarChart3 },
  { title: "AI Insights", url: "/user-dashboard/ai-tools", icon: Sparkles },
  { title: "Reports", url: "/user-dashboard/reports", icon: FileText },
  { title: "Team", url: "/user-dashboard/team", icon: Users },
  { title: "Settings", url: "/user-dashboard/settings", icon: Settings },
];

const adminItems = [
  { title: "Dashboard", url: "/admin-dashboard/dashboard", icon: Home },
  {
    title: "User Management",
    url: "/admin-dashboard/user-management",
    icon: Users,
  },
  {
    title: "Organization Management",
    url: "/admin-dashboard/organization-management",
    icon: BriefcaseBusiness,
  },
  { title: "Finance", url: "/admin-dashboard/finance", icon: CreditCard },
  {
    title: "Platform Analytics",
    url: "/admin-dashboard/platform-analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    url: "/admin-dashboard/reports",
    icon: FileText,
  },
  {
    title: "Contact Messages",
    url: "/admin-dashboard/contact-management",
    icon: FileText,
  },
  { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
];

interface CurrentPlan {
  plan_name: string;
  campaign_limit: number | "Unlimited";
  campaign_used: number;
}

const getOrgId = (): string | null => {
  try {
    const savedOrg = localStorage.getItem("selectedOrganization");
    if (savedOrg) {
      const parsed = JSON.parse(savedOrg);
      if (parsed?.id) return parsed.id;
    }
  } catch {
    // ignore
  }
  return null;
};

const isHighestTierPlan = (planName: string): boolean => {
  if (!planName) return false;
  const name = planName.toLowerCase().trim();
  return name === "scale" || name.includes("scale") || name.includes("enterprise") || name.includes("unlimited");
};

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, organizations, selectedOrganization } = useAppSelector((state) => state.auth);

  const isAdmin = user?.is_admin || false;

  const parsedSelectedOrganization = (() => {
    if (!selectedOrganization) return null;
    try {
      return JSON.parse(selectedOrganization) as { id: string; name: string | null };
    } catch {
      return null;
    }
  })();

  const [planData, setPlanData] = useState<CurrentPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [noSubscription, setNoSubscription] = useState(false);

  const fetchCurrentPlan = async () => {
    const org_id = getOrgId();
    if (!org_id) {
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    setNoSubscription(false);
    setPlanData(null);
    try {
      const response = await api.get(`/finance/get-current-plan/?org_id=${org_id}`);
      const plan: CurrentPlan =
        response.data?.current_plan ?? (response.data?.plan_name ? response.data : null);
      if (plan) {
        setPlanData(plan);
      } else {
        setNoSubscription(true);
      }
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 404) {
        setNoSubscription(true);
        setPlanData(null);
      }
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      fetchCurrentPlan();
    }

    const handleOrgChange = () => {
      if (!isAdmin) {
        fetchCurrentPlan();
      }
    };

    window.addEventListener("organizationChanged", handleOrgChange);
    return () => window.removeEventListener("organizationChanged", handleOrgChange);
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate("/auth/signin");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/auth/signin");
    }
  };

  const isItemActive = (title: string, itemUrl: string) => {
    if (title === "Dashboard") {
      return pathname === "/user-dashboard/dashboard" || pathname === "/user-dashboard";
    }
    return pathname === itemUrl || (itemUrl !== "/user-dashboard/dashboard" && pathname.startsWith(itemUrl));
  };

  const renderMenu = (items: typeof userItems) =>
    items.map((item) => {
      const isActive = isItemActive(item.title, item.url);
      const Icon = item.icon;

      return (
        <SidebarMenuItem key={item.title} className="relative">
          {isActive && (
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-6 w-1 bg-[#2563EB] rounded-r-sm z-10" />
          )}
          <SidebarMenuButton
            asChild
            className={`group mx-1.5 my-0.5 rounded-md px-3 py-2 text-xs transition-all ${
              isActive
                ? "bg-[#EFF6FF] text-[#2563EB] font-semibold pl-4"
                : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Link to={item.url} className="flex items-center gap-3 w-full">
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-[#2563EB]" : "text-slate-500 group-hover:text-slate-700"
                }`}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar className="border-r border-slate-100 bg-white pr-2">
      <SidebarContent className="flex h-full flex-col justify-between py-4">
        {/* TOP SECTION */}
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-4 mb-3">
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765309106/Rectangle_ktqcsy.png"
              alt="AdPortal Logo"
              className="h-[55px] w-[180px] object-contain"
            />
          </Link>

          {/* Menu Items */}
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {isAdmin ? renderMenu(adminItems) : renderMenu(userItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* BOTTOM SECTION */}
        <div className="px-3 space-y-3 pt-4">
          {/* Dynamic Subscription Card */}
          {!isAdmin && (
            <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 text-xs shadow-sm space-y-2.5">
              {planLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-9 bg-slate-200 rounded-xl w-full"></div>
                </div>
              ) : noSubscription ? (
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-1">
                    <Crown className="w-4 h-4 text-indigo-500" />
                    <span>Current Plan</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mb-1">No Active Plan</div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    You don't have an active subscription.
                  </p>
                  <Link to="/user-dashboard/subscriptions" className="block">
                    <button className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 transition-all">
                      <span>View Plans</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              ) : planData ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                      <Crown className="w-4 h-4 text-indigo-500" />
                      <span className="capitalize">{planData.plan_name}</span>
                    </div>
                  </div>

                  {/* Campaign Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{
                        width:
                          planData.campaign_limit === "Unlimited"
                            ? "100%"
                            : `${Math.min(
                                100,
                                Math.round(
                                  (planData.campaign_used /
                                    (planData.campaign_limit as number)) *
                                    100
                                )
                              )}%`,
                      }}
                    ></div>
                  </div>

                  {/* Campaign Usage Count */}
                  <div className="text-[11px] text-slate-500 mb-3 font-medium">
                    {planData.campaign_limit === "Unlimited"
                      ? `${planData.campaign_used} campaigns used (Unlimited)`
                      : `${planData.campaign_used} of ${planData.campaign_limit} campaigns used`}
                  </div>

                  {/* Dynamic Button: Manage Plan for top tier (e.g. Scale), Upgrade Plan otherwise */}
                  <Link to="/user-dashboard/subscriptions" className="block">
                    <button className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 transition-all">
                      <span>{isHighestTierPlan(planData.plan_name) ? "Manage Plan" : "Upgrade Plan"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* Bottom Left Account Dropdown / Switch Organization Button */}
          {!isAdmin && (
            <AccountDropdown
              first_name={user?.first_name || ""}
              email={user?.email || ""}
              avatar={user?.avatar}
              organizations={organizations}
              selectedOrganization={parsedSelectedOrganization}
              onLogout={handleLogout}
            />
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}