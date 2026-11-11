import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Dashboard
const UserDashboard = lazy(() => import("./pages/Dashboard/UserDashboard/UserDashboard/Dashboard"));
import DashboardLayout from "./DashboardLayout";

// Campaign pages
const Campaigns = lazy(() => import("./pages/Dashboard/UserDashboard/Campaigns/Campaigns"));

// Create Campaign (NEW)
const CreateCampaignLayout = lazy(() => import("./pages/create-campaign/CreateCampaignLayout"));
const Step2Platforms = lazy(() => import("./pages/create-campaign/Step2Platforms"));
const Step3Objective = lazy(() => import("./pages/create-campaign/Step3Objective"));
const Step4Audience = lazy(() => import("./pages/create-campaign/Step4Audience"));
const Step5Budget = lazy(() => import("./pages/create-campaign/Step5Budget"));
const Step6Creative = lazy(() => import("./pages/create-campaign/Step6Creative"));
const Step7Review = lazy(() => import("./pages/create-campaign/Step7Review"));
const CampaignsViewDetails = lazy(() => import("./pages/Dashboard/UserDashboard/Campaigns/campaignsViewDetails/CampaignsViewDetails"));
import Root from "./pages/Root";
const Home = lazy(() => import("./pages/Home/Home"));
const AiTools = lazy(() => import("./components/AITools/AiTools"));
const Analytics = lazy(() => import("./components/Analytics/Analytics"));
const Reports = lazy(() => import("./components/Reports/Reports"));
const Subscriptions = lazy(() => import("./components/Analytics/Subscriptions/Subscriptions"));
const Team = lazy(() => import("./components/Team/Team"));
const Settings = lazy(() => import("./components/Settings/UserSettings"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement/UserManagement"));
const CampaignMonitoring = lazy(() => import("./pages/admin/CampaignMonitoring/CampaignMonitoring"));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration/ContentModeration"));
const Finance = lazy(() => import("./pages/admin/Finance/Finance"));
const PlatformAnalytics = lazy(() => import("./pages/admin/PlatformAnalytics/PlatformAnalytics"));
const AdminSetting = lazy(() => import("./pages/admin/AdminSetting/AdminSetting"));

const Location = lazy(() => import("./Location/Location"));
const AdminReports = lazy(() => import("./pages/admin/AdminReport/AdminReports"));
const SignIn = lazy(() => import("./components/Auth/SignIn"));
const SignUp = lazy(() => import("./components/Auth/SignUp"));
const ForgetPassword = lazy(() => import("./components/Auth/ForgetPassword"));
const CheckEmail = lazy(() => import("./components/Auth/CheckEmail"));
const NewPassword = lazy(() => import("./components/Auth/NewPassword"));
const HowItWorksPage = lazy(() => import("./pages/Home/HowItWorksPage/HowItWorksPage"));
const Pricing = lazy(() => import("./pages/Home/Pricing/Pricing"));
const FeaturesPage = lazy(() => import("./pages/Home/Features.tsx/FeaturesPage"));
import ErrorPage from "./pages/ErrorPage/ErrorPage";
const Step1CampaignName = lazy(() => import("./pages/create-campaign/Step1CampaignName"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions/TermsConditions"));
const SecurityPage = lazy(() => import("./pages/SecurityPage/SecurityPage"));
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));
const ContactUs = lazy(() => import("./pages/Contact/ContactUs"));

const AcceptInvite = lazy(() => import("./components/Team/AcceptInvite"));
const UpdateCampaignLayout = lazy(() => import("./pages/update-campaign/UpdateCampaignLayout"));
const MetaAuthCallback = lazy(() => import("./components/Settings/MetaAuthCallback"));
const GoogleAuthCallback = lazy(() => import("./components/Settings/GoogleAuthCallback"));
const TiktokAuthCallback = lazy(() => import("./components/Settings/TiktokAuthCallback"));
const UpdateStep1CampaignName = lazy(() => import("./pages/update-campaign/UpdateStep1CampaignName"));
const UpdateStep2Platforms = lazy(() => import("./pages/update-campaign/UpdateStep2Platforms"));
const UpdateStep3Objective = lazy(() => import("./pages/update-campaign/UpdateStep3Objective"));
const UpdateStep5Budget = lazy(() => import("./pages/update-campaign/UpdateStep5Budget"));
const UpdateStep6Creative = lazy(() => import("./pages/update-campaign/UpdateStep6Creative"));
const UpdateStep4Audience = lazy(() => import("./pages/update-campaign/UpdateStep4Audience"));
const UpdateStep7Review = lazy(() => import("./pages/update-campaign/UpdateStep7Review"));
const OrganizationManagement = lazy(() => import("./pages/admin/Organization/OrganizationManagement"));
const UserNotificationPage = lazy(() => import("./Notification/UserNotificationPage"));
const AdminContact = lazy(() => import("./pages/Contact/AdminContact"));
const AdminNotificationPage = lazy(() => import("./Notification/AdminNotificationPage"));

const Payment = lazy(() => import("./components/Payment/Payment"));

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
    element: <ProtectedRoute role="user"><DashboardLayout /></ProtectedRoute>,
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
    element: <ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>,
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
