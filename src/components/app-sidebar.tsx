// import { Link, useLocation } from "react-router-dom";
// import {
//   Home,
//   Megaphone,
//   Wand2,
//   BarChart3,
//   FileText,
//   CreditCard,
//   Users,
//   Settings,
//   LogOut,
// } from "lucide-react";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar";

// import type { UserRole } from "@/types/auth";

// const CURRENT_ROLE: UserRole = "admin";

// const userItems = [
//   { title: "Dashboard", url: "/user-dashboard/dashboard", icon: Home },
//   { title: "Campaigns", url: "/user-dashboard/campaigns", icon: Megaphone },
//   { title: "AI Tools", url: "/user-dashboard/ai-tools", icon: Wand2 },
//   { title: "Analytics", url: "/user-dashboard/analytics", icon: BarChart3 },
//   { title: "Reports", url: "/user-dashboard/reports", icon: FileText },
//   { title: "Subscription", url: "/user-dashboard/subscriptions", icon: CreditCard },
//   { title: "Team", url: "/user-dashboard/team", icon: Users },
//   { title: "Settings", url: "/user-dashboard/settings", icon: Settings },
// ];

// const adminItems = [
//   { title: "Dashboard", url: "/admin-dashboard/dashboard", icon: Home },
//   { title: "User Management", url: "/admin-dashboard/user-management", icon: Users },
//   { title: "Campaigns Monitoring", url: "/admin-dashboard/campaigns-monitoring", icon: Megaphone },
//   { title: "Content Moderation", url: "/admin-dashboard/content-moderation", icon: FileText },
//   { title: "Finance", url: "/admin-dashboard/finance", icon: CreditCard },
//   { title: "Platform Analytics", url: "/admin-dashboard/platform-analytics", icon: BarChart3 },
//   { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
// ];

// const ACTIVE_BG = "#2D6FF8";
// const ACTIVE_TEXT = "#FFFFFF";
// const INACTIVE_TEXT = "#4B5563";
// const INACTIVE_ICON = "#6B7280";

// export function AppSidebar() {
//   const { pathname } = useLocation();

//   const isAdmin = CURRENT_ROLE === "admin";
//   const items = isAdmin ? adminItems : userItems;

//   return (
//     <Sidebar className="border-r bg-white pr-2">
//       <SidebarContent className="flex h-full flex-col justify-between py-4">
//         {/* TOP */}
//         <div>
//           {/* Logo */}
//           <div className="flex items-center gap-2 px-4">
//             <img
//               src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765309106/Rectangle_ktqcsy.png"
//               alt="AdPortal Logo"
//               className="h-[66px] w-[200px] object-contain"
//             />
//           </div>

//           {/* MENU */}
//           <SidebarGroup>
//             <SidebarGroupContent>
//               <SidebarMenu>
//                 {items.map((item) => {
//                   const isActive =
//                     pathname === item.url ||
//                     pathname.startsWith(item.url + "/");

//                   const Icon = item.icon;

//                   return (
//                     <SidebarMenuItem key={item.title}>
//                       <SidebarMenuButton
//                         asChild
//                         className="group mx-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
//                         style={{
//                           backgroundColor: isActive ? ACTIVE_BG : "transparent",
//                           color: isActive ? ACTIVE_TEXT : INACTIVE_TEXT,
//                         }}
//                       >
//                         <Link to={item.url} className="flex items-center gap-3">
//                           <Icon
//                             className="h-4 w-4"
//                             style={{
//                               color: isActive ? ACTIVE_TEXT : INACTIVE_ICON,
//                             }}
//                           />
//                           <span className="truncate">{item.title}</span>
//                         </Link>
//                       </SidebarMenuButton>
//                     </SidebarMenuItem>
//                   );
//                 })}
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>

//           {/* PLAN CARD (ONLY USER) */}
//           {!isAdmin && (
//             <div className="mx-4 mt-6 rounded-2xl bg-[#F6F7FB] p-4 text-xs text-gray-600 shadow-sm">
//               <div className="mb-2 text-sm font-semibold text-gray-800">
//                 Growth Plan
//               </div>
//               <div className="mb-2 text-[11px] text-gray-500">
//                 65 of 100 campaigns used
//               </div>
//               <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
//                 <div
//                   className="h-full rounded-full bg-[#2D6FF8]"
//                   style={{ width: "65%" }}
//                 />
//               </div>
//               <button className="w-full rounded-lg bg-[#2D6FF8] py-1.5 text-xs font-medium text-white">
//                 Upgrade Plan
//               </button>
//             </div>
//           )}
//         </div>

//         {/* LOGOUT */}
//         <div className="mt-4 border-t border-gray-100 pt-4">
//           <button className="mx-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50">
//             <LogOut className="h-4 w-4" />
//             <span>Log out</span>
//           </button>
//         </div>
//       </SidebarContent>
//     </Sidebar>
//   );
// }









// import { Link, useLocation } from "react-router-dom";
// import {
//   Home,
//   Megaphone,
//   Wand2,
//   BarChart3,
//   FileText,
//   CreditCard,
//   Users,
//   Settings,
//   LogOut,
//   Flag,
//   DollarSign,
// } from "lucide-react";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar";

// /* =========================
//    MENU CONFIG
// ========================= */

// const userItems = [
//   { title: "Dashboard", url: "/user-dashboard/dashboard", icon: Home },
//   { title: "Campaigns", url: "/user-dashboard/campaigns", icon: Megaphone },
//   { title: "AI Tools", url: "/user-dashboard/ai-tools", icon: Wand2 },
//   { title: "Analytics", url: "/user-dashboard/analytics", icon: BarChart3 },
//   { title: "Reports", url: "/user-dashboard/reports", icon: FileText },
//   {
//     title: "Subscription",
//     url: "/user-dashboard/subscriptions",
//     icon: CreditCard,
//   },
//   { title: "Team", url: "/user-dashboard/team", icon: Users },
//   { title: "Settings", url: "/user-dashboard/settings", icon: Settings },
// ];

// const adminItems = [
//   { title: "Dashboard", url: "/admin-dashboard/dashboard", icon: Home },
//   {
//     title: "User Management",
//     url: "/admin-dashboard/user-management",
//     icon: Users,
//   },
//   {
//     title: "Campaigns Monitoring",
//     url: "/admin-dashboard/campaigns-monitoring",
//     icon: Megaphone,
//   },
//   {
//     title: "Content Moderation",
//     url: "/admin-dashboard/content-moderation",
//     icon: Flag,
//   },
//   { title: "Finance", url: "/admin-dashboard/finance", icon: DollarSign },
//   {
//     title: "Platform Analytics",
//     url: "/admin-dashboard/platform-analytics",
//     icon: BarChart3,
//   },
//   {
//     title: "Reports",
//     url: "/admin-dashboard/reports",
//     icon: FileText,
//   },
//   { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
// ];

// /* =========================
//    STYLES
// ========================= */
// const ACTIVE_BG = "#2D6FF8";
// const ACTIVE_TEXT = "#FFFFFF";
// const INACTIVE_TEXT = "#4B5563";
// const INACTIVE_ICON = "#6B7280";

// /* =========================
//    COMPONENT
// ========================= */


// console.log(userItems);

// export function AppSidebar() {
//   const { pathname } = useLocation();

//   const renderMenu = (items: typeof adminItems) =>
//     items.map((item) => {
//       const isActive =
//         pathname === item.url || pathname.startsWith(item.url + "/");

//       const Icon = item.icon;

//       return (
//         <SidebarMenuItem key={item.title}>
//           <SidebarMenuButton
//             asChild
//             className="group mx-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
//             style={{
//               backgroundColor: isActive ? ACTIVE_BG : "transparent",
//               color: isActive ? ACTIVE_TEXT : INACTIVE_TEXT,
//             }}
//           >
//             <Link to={item.url} className="flex items-center gap-3">
//               <Icon
//                 className="h-4 w-4"
//                 style={{
//                   color: isActive ? ACTIVE_TEXT : INACTIVE_ICON,
//                 }}
//               />
//               <span className="truncate">{item.title}</span>
//             </Link>
//           </SidebarMenuButton>
//         </SidebarMenuItem>
//       );
//     });

//   return (
//     <Sidebar className="border-r bg-white pr-2">
//       <SidebarContent className="flex h-full flex-col justify-between py-4">
//         {/* TOP */}
//         <div>
//           {/* Logo */}
//           <div className="flex items-center gap-2 px-4">
//             <img
//               src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765309106/Rectangle_ktqcsy.png"
//               alt="AdPortal Logo"
//               className="h-[66px] w-[200px] object-contain"
//             />
//           </div>

//           {/* ================= ADMIN MENU ONLY ================= */}
//           <SidebarGroup className="mt-0">
//             <SidebarGroupLabel>
//               <span className="px-4 hidden text-xs font-semibold uppercase text-gray-400">
//                 Admin
//               </span>
//             </SidebarGroupLabel>
//             <SidebarGroupContent>
//               <SidebarMenu>{renderMenu(adminItems)}</SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>

//           {/* PLAN CARD */}
//           <div className="mx-4 mt-6 hidden rounded-2xl bg-[#F6F7FB] p-4 text-xs text-gray-600 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="text-sm text-gray-800">Current Plan</div>
//               <img
//                 src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765998031/Icon_15_geshwh.png"
//                 alt=""
//               />
//             </div>

//             <div className="mt-2 mb-2 text-sm font-semibold text-gray-800">
//               Growth Plan
//             </div>

//             <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
//               <div
//                 className="h-full rounded-full bg-[#2D6FF8]"
//                 style={{ width: "65%" }}
//               />
//             </div>

//             <div className="mb-2 text-[11px] text-gray-500">
//               65 of 100 campaigns used
//             </div>

//             <button className="w-full rounded-lg bg-[#2D6FF8] py-1.5 text-xs font-medium text-white">
//               Upgrade Plan
//             </button>
//           </div>
//         </div>

//         {/* LOGOUT */}
//         <div className="mt-4 border-t border-gray-100 pt-4">
//           <button className="mx-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50">
//             <LogOut className="h-4 w-4" />
//             <span>Log out</span>
//           </button>
//         </div>
//       </SidebarContent>
//     </Sidebar>
//   );
// }











import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Megaphone,
  Wand2,
  BarChart3,
  FileText,
  CreditCard,
  Users,
  Settings,
  LogOut,
  BriefcaseBusiness,
} from "lucide-react";
// import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../src/hooks/reduxHooks";
import { logout } from "../../src/features/auth/AuthThunks";
import api from "@/lib/axios";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import AccountDropdown from "./AccountDropdown/AccountDropdown";

// Menu items
const userItems = [
  { title: "Dashboard", url: "/user-dashboard/dashboard", icon: Home },
  { title: "Campaigns", url: "/user-dashboard/campaigns", icon: Megaphone },
  { title: "AI Tools", url: "/user-dashboard/ai-tools", icon: Wand2 },
  { title: "Analytics", url: "/user-dashboard/analytics", icon: BarChart3 },
  { title: "Reports", url: "/user-dashboard/reports", icon: FileText },
  {
    title: "Subscription",
    url: "/user-dashboard/subscriptions",
    icon: CreditCard,
  },
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



const ACTIVE_BG = "#2D6FF8";
const ACTIVE_TEXT = "#FFFFFF";
const INACTIVE_TEXT = "#4B5563";
const INACTIVE_ICON = "#6B7280";

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

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, organizations, selectedOrganization } = useAppSelector((state) => state.auth);

  const isAdmin = user?.is_admin || false;


  // Parse selectedOrganization from JSON string to Organization object
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
      // Handle both {current_plan: {...}} and plan object at root
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
      // toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/auth/signin");
    }
  };

  

  const renderMenu = (items: typeof userItems) =>
    items.map((item) => {
      const isActive =
        pathname === item.url || pathname.startsWith(item.url + "/");

      const Icon = item.icon;

      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            className="group mx-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive ? ACTIVE_BG : "transparent",
              color: isActive ? ACTIVE_TEXT : INACTIVE_TEXT,
            }}
          >
            <Link to={item.url} className="flex items-center gap-3">
              <Icon
                className="h-4 w-4"
                style={{
                  color: isActive ? ACTIVE_TEXT : INACTIVE_ICON,
                }}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar className="border-r bg-white pr-2">
      <SidebarContent className="flex h-full flex-col justify-between py-4">
        {/* TOP */}
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-4">
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765309106/Rectangle_ktqcsy.png"
              alt="AdPortal Logo"
              className="h-[66px] w-[200px] object-contain"
            />
          </Link>

          {/* Account Dropdown only for user, not admin */}
          {!isAdmin && (
            <div className="px-1 py-1">
              <AccountDropdown
                first_name={user?.first_name || ""}
                email={user?.email || ""}
                avatar={user?.avatar}
                organizations={organizations}
                selectedOrganization={parsedSelectedOrganization}
              />
            </div>
          )}

          {/* Show admin menu if user is admin, otherwise show user menu */}
          {isAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel className="">
                <span className="px-4 text-xs font-semibold uppercase text-gray-400">
                  Admin
                </span> 
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {renderMenu(adminItems)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel className="">
                <span className="px-4 text-xs font-semibold uppercase text-gray-400">
                  User
                </span> 
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {renderMenu(userItems)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* PLAN CARD only for user, not admin */}
          {!isAdmin && (
            <div className="mx-4 mt-6 rounded-2xl bg-[#F6F7FB] p-4 text-xs text-gray-600 shadow-sm">
              {planLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded-xl w-full"></div>
                </div>
              ) : noSubscription ? (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">No Active Plan</div>
                  <div className="text-xs text-gray-500 mb-4">
                    You don't have an active subscription.
                  </div>
                  <Link to="/user-dashboard/subscriptions">
                    <button className="w-full cursor-pointer rounded-xl bg-[#2D6FF8] py-2 text-sm font-medium text-white hover:bg-[#1E5FD8] transition-colors">
                      View Plans
                    </button>
                  </Link>
                </div>
              ) : planData ? (
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      Current Plan
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 mb-2 capitalize">
                    {planData.plan_name}
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#2D6FF8] rounded-full transition-all"
                      style={{
                        width:
                          planData.campaign_limit === "Unlimited"
                            ? "0%"
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
                  <div className="text-xs text-gray-500 mb-4">
                    {planData.campaign_limit === "Unlimited"
                      ? `${planData.campaign_used} campaigns used (Unlimited)`
                      : `${planData.campaign_used} of ${planData.campaign_limit} campaigns used`}
                  </div>
                  <Link to="/user-dashboard/subscriptions">
                    <button className="w-full cursor-pointer rounded-xl bg-[#2D6FF8] py-2 text-sm font-medium text-white hover:bg-[#1E5FD8] transition-colors">
                      Upgrade Plan
                    </button>
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button 
            onClick={handleLogout}
            className="mx-4 flex cursor-pointer w-[calc(100%-2rem)] items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 " />
            <span>Log out</span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}