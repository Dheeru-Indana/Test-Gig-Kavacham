import { createBrowserRouter } from 'react-router';
import React, { Suspense } from 'react';
import Root from './pages/Root';
import Welcome from './pages/onboarding/Welcome';
// Keep critical flow standard, split everything else
import PhoneInput from './pages/onboarding/PhoneInput';
import BasicDetails from './pages/onboarding/BasicDetails';
import IncomeSandbox from './pages/onboarding/IncomeSandbox';
import PlanSelection from './pages/onboarding/PlanSelection';
import Payment from './pages/onboarding/Payment';
import Success from './pages/onboarding/Success';

const Dashboard = React.lazy(() => import('./pages/worker/Dashboard'));
const DisruptionLive = React.lazy(() => import('./pages/worker/DisruptionLive'));
const ClaimsHistory = React.lazy(() => import('./pages/worker/ClaimsHistory'));
const PolicyManagement = React.lazy(() => import('./pages/worker/PolicyManagement'));
const PolicyDocument = React.lazy(() => import('./pages/worker/PolicyDocument'));
const Notifications = React.lazy(() => import('./pages/worker/Notifications'));
const Settings = React.lazy(() => import('./pages/worker/Settings'));
const AppSettings = React.lazy(() => import('./pages/worker/AppSettings'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminHeatMap = React.lazy(() => import('./pages/admin/HeatMap'));
const AdminClaimsPipeline = React.lazy(() => import('./pages/admin/ClaimsPipeline'));
const AdminFraudReview = React.lazy(() => import('./pages/admin/FraudReview'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminProtectedRoute = React.lazy(() => import('./routes/AdminProtectedRoute'));
import { ProtectedRoute } from './routes/ProtectedRoute';

const NotFound = React.lazy(() => import('./pages/NotFound'));

// A sleek fallback for Suspense matching the dark fintech theme
const SuspenseFallback = () => (
   <div className="w-full h-full min-h-screen flex items-center justify-center bg-background pointer-events-none">
     <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
   </div>
);

// Wrapper
const Loadable = (Component: any) => (props: any) => (
  <Suspense fallback={<SuspenseFallback />}>
    <Component {...props} />
  </Suspense>
);

const Protected = (Component: any) => (props: any) => (
  <Suspense fallback={<SuspenseFallback />}>
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  </Suspense>
);

const ProtectedAdmin = (Component: any) => (props: any) => (
  <Suspense fallback={<SuspenseFallback />}>
    <AdminProtectedRoute>
      <Component {...props} />
    </AdminProtectedRoute>
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Welcome },
      
      // Onboarding Flow
      { path: 'login', Component: PhoneInput },
      { path: 'register', Component: PhoneInput },
      { path: 'onboarding/welcome', Component: Welcome },
      { path: 'onboarding/phone', Component: PhoneInput },
      { path: 'onboarding/details', Component: BasicDetails },
      { path: 'onboarding/sandbox', Component: IncomeSandbox },
      { path: 'onboarding/plans', Component: PlanSelection },
      { path: 'onboarding/payment', Component: Payment },
      { path: 'onboarding/success', Component: Success },
      
      // Worker App
      { path: 'dashboard', Component: Protected(Dashboard) },
      { path: 'disruption-live', Component: Protected(DisruptionLive) },
      { path: 'claims-history', Component: Protected(ClaimsHistory) },
      { path: 'policy-management', Component: Protected(PolicyManagement) },
      { path: 'policy-document', Component: Protected(PolicyDocument) },
      { path: 'notifications', Component: Protected(Notifications) },
      { path: 'settings', Component: Protected(Settings) },
      { path: 'app-settings', Component: Loadable(AppSettings) },
      
      // Admin Dashboard
      { path: 'admin/login', Component: Loadable(AdminLogin) },
      { path: 'admin/dashboard', Component: ProtectedAdmin(AdminDashboard) },
      { path: 'admin/heat-map', Component: ProtectedAdmin(AdminHeatMap) },
      { path: 'admin/claims-pipeline', Component: ProtectedAdmin(AdminClaimsPipeline) },
      { path: 'admin/fraud-review', Component: ProtectedAdmin(AdminFraudReview) },
      { path: 'admin/analytics', Component: ProtectedAdmin(AdminAnalytics) },
      
      { path: '*', Component: Loadable(NotFound) },
    ],
  },
]);
