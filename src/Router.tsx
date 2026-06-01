import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Dashboard
import UserDashboard from "./pages/Dashboard/UserDashboard/UserDashboard/Dashboard";
import DashboardLayout from "./DashboardLayout";

// Campaign pages
import Campaigns from "./pages/Dashboard/UserDashboard/Campaigns/Campaigns";

// Create Campaign (NEW)
import CreateCampaignLayout from "./pages/create-campaign/CreateCampaignLayout";
import Step2Platforms from "./pages/create-campaign/Step2Platforms";
import Step3Objective from "./pages/create-campaign/Step3Objective";
import Step4Audience from "./pages/create-campaign/Step4Audience";
import Step5Budget from "./pages/create-campaign/Step5Budget";
import Step6Creative from "./pages/create-campaign/Step6Creative";
import Step7Review from "./pages/create-campaign/Step7Review";
import CampaignsViewDetails from "./pages/Dashboard/UserDashboard/Campaigns/campaignsViewDetails/CampaignsViewDetails";
import Root from "./pages/Root";
import Home from "./pages/Home/Home";
import AiTools from "./components/AITools/AiTools";
import Analytics from "./components/Analytics/Analytics";
import Reports from "./components/Reports/Reports";
import Subscriptions from "./components/Analytics/Subscriptions/Subscriptions";
import Team from "./components/Team/Team";
import Settings from "./components/Settings/UserSettings";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement/UserManagement";
import CampaignMonitoring from "./pages/admin/CampaignMonitoring/CampaignMonitoring";
import ContentModeration from "./pages/admin/ContentModeration/ContentModeration";
import Finance from "./pages/admin/Finance/Finance";
import PlatformAnalytics from "./pages/admin/PlatformAnalytics/PlatformAnalytics";
import AdminSetting from "./pages/admin/AdminSetting/AdminSetting";

import Location from "./Location/Location";
import AdminReports from "./pages/admin/AdminReport/AdminReports";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import ForgetPassword from "./components/Auth/ForgetPassword";
import CheckEmail from "./components/Auth/CheckEmail";
import NewPassword from "./components/Auth/NewPassword";
import HowItWorksPage from "./pages/Home/HowItWorksPage/HowItWorksPage";
import Pricing from "./pages/Home/Pricing/Pricing";
import FeaturesPage from "./pages/Home/Features.tsx/FeaturesPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import Step1CampaignName from "./pages/create-campaign/Step1CampaignName";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions/TermsConditions";
import SecurityPage from "./pages/SecurityPage/SecurityPage";
import AboutUs from "./pages/AboutUs/AboutUs";
import ContactUs from "./pages/Contact/ContactUs";

import AcceptInvite from "./components/Team/AcceptInvite";
import UpdateCampaignLayout from "./pages/update-campaign/UpdateCampaignLayout";
import MetaAuthCallback from "./components/Settings/MetaAuthCallback";
import GoogleAuthCallback from "./components/Settings/GoogleAuthCallback";
import TiktokAuthCallback from "./components/Settings/TiktokAuthCallback";
import UpdateStep1CampaignName from "./pages/update-campaign/UpdateStep1CampaignName";
import UpdateStep2Platforms from "./pages/update-campaign/UpdateStep2Platforms";
import UpdateStep3Objective from "./pages/update-campaign/UpdateStep3Objective";
import UpdateStep5Budget from "./pages/update-campaign/UpdateStep5Budget";
import UpdateStep6Creative from "./pages/update-campaign/UpdateStep6Creative";
import UpdateStep4Audience from "./pages/update-campaign/UpdateStep4Audience";
import UpdateStep7Review from "./pages/update-campaign/UpdateStep7Review";
import OrganizationManagement from "./pages/admin/Organization/OrganizationManagement";
import UserNotificationPage from "./Notification/UserNotificationPage";
import AdminContact from "./pages/Contact/AdminContact";
import AdminNotificationPage from "./Notification/AdminNotificationPage";

import Payment from "./components/Payment/Payment";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    
    
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
        {
        path: "privacy-policy",
        element: <PrivacyPolicy />
      },
      {
        path: "terms-and-conditions",
        element: <TermsConditions />
      },

      
            {
        path: "accept-invite/:token",
        element: <AcceptInvite />,
      },
     
      {
        path: "meta-auth-callback",
        element: <MetaAuthCallback />,
      },
      {
        path: "google-auth-callback",
        element: <GoogleAuthCallback />,
      },
      {
        path: "tiktok-auth-callback",
        element: <TiktokAuthCallback />,
      },
      {
        path: "features",
        element: <FeaturesPage />,
      },
      {
        path: "how-it-works",
        element: <HowItWorksPage />,
      },
      
      {
        path: "pricing",
        element: <Pricing />,
      },
    
   
      {
        path: "security",
        element: <SecurityPage />
      },
      {
        path: "about-us",
        element: <AboutUs />
      },
      {
        path: "contact-us",
        element: <ContactUs />
      }
    ],
  },

  {
    path: "/auth",
    children: [
      {
        index: true,
        element: <Navigate to="signin" replace />,
      },
      {
        path: "signin",
        element: <SignIn />,
      },
      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "forgot-password",
        element: <ForgetPassword />,
      },
      {
        path: "check-email",
        element: <CheckEmail />,
      },
      {
        path: "new-password",
        element: <NewPassword />,
      },
      {
        path: "location",
        element: <Location></Location>,
      },
    ],
  },

  {
    path: "/user-dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <UserDashboard />,
      },
      {
        path: "payment",
        element: <Payment />,

      },
      {
        path: "campaigns",
        element: <Campaigns />,
      },
      {
        path: "campaigns-view-details/:id",
        element: <CampaignsViewDetails />,
      },
      {
        path: "ai-tools",
        element: <AiTools />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "subscriptions",
        element: <Subscriptions />,
      },
      {
        path: "team",
        element: <Team />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "notifications",
        element: <UserNotificationPage />,
      },


      {
        path: "campaigns-create",
        element: <CreateCampaignLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="step-1" replace />,
          },
          {
            path: "step-1",
            element: <Step1CampaignName />,
          },
          {
            path: "step-2",
            element: <Step2Platforms />,
          },
          {
            path: "step-3",
            element: <Step3Objective />,
          },
          {
            path: "step-4",
            element: <Step4Audience />,
          },
          {
            path: "step-5",
            element: <Step5Budget />,
          },
          {
            path: "step-6",
            element: <Step6Creative />,
          },
          {
            path: "step-7",
            element: <Step7Review />
          },
        ],
      },


      {
        path: "campaigns-update/:id",
        element: <UpdateCampaignLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="update-step-1" replace />,
          },
          {
            path: "update-step-1",
            element: <UpdateStep1CampaignName />,
          },
          {
            path: "update-step-2",
            element: <UpdateStep2Platforms />,
          },
          {
            path: "update-step-3",
            element: <UpdateStep3Objective />,
          },
          {
            path: "update-step-4",
            element: <UpdateStep4Audience />,
          },
          {
            path: "update-step-5",
            element: <UpdateStep5Budget />,
          },
          {
            path: "update-step-6",
            element: <UpdateStep6Creative />,
          },
          {
            path: "update-step-7",
            element: <UpdateStep7Review />,
          },
        ],
      },


    ],
  },

  {
    path: "/admin-dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "user-management",
        element: <UserManagement />,
      },
      {
        path: "organization-management",
        element: <OrganizationManagement />,
      },
      {
        path: "campaigns-monitoring",
        element: <CampaignMonitoring />,
      },
      {
        path: "content-moderation",
        element: <ContentModeration />,
      },
      {
        path: "finance",
        element: <Finance />,
      },
      {
        path: "platform-analytics",
        element: <PlatformAnalytics />,
      },
      {
        path: "settings",
        element: <AdminSetting />,
      },
      {
        path: "reports",
        element: <AdminReports />,
      },
      {
        path: "contact-management",
        element: <AdminContact />,
      },
        {
        path: "notifications",
        element: <AdminNotificationPage />,
      },
    ],
  },
]);
