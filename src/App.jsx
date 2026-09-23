import { useLayoutEffect } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, Link } from "react-router-dom";
import appStore from "./utils/appStore";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import { ThemeProvider } from "./utils/ThemeContext";
import DauPresenceTracker from "./components/DauPresenceTracker";
import { InterviewLockProvider, useInterviewLock } from "./utils/InterviewLockContext";
import { ProductTourProvider } from "./context/ProductTourContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PlatformFooter from "./components/PlatformFooter";
import Home from "./components/Home";
import AuthCallback from "./components/AuthCallback";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedPlatformAdminRoute from "./components/ProtectedPlatformAdminRoute";
import ProtectedSpcRoute from "./components/ProtectedSpcRoute";
import Resources from "./components/Resources";
import AdminDashboard from "./components/AdminDashboard";
import PlatformAdminDashboard from "./components/PlatformAdminDashboard";
import JdImportPage from "./components/JdImportPage";
import MinCgpaGapsPage from "./components/MinCgpaGapsPage";
import RvitmDataPage from "./components/RvitmDataPage";
import Events from "./components/Events";
import Analytics from "./components/Analytics";
import Developers from "./components/Developers";
import StudentProfilePage from "./components/StudentProfilePage";
import MySubmissionsPage from "./components/MySubmissionsPage";
import PlacementPopupWrapper from "./components/PlacementPopupWrapper";
import Leaderboard from "./components/Leaderboard";
import AIInterviews from "./components/AIInterviews";
import GeneralMockInterviewPage from "./components/GeneralMockInterviewPage";
import InterviewAnalyticsPage from "./components/InterviewAnalyticsPage";
import InterviewSlotsPage from "./components/InterviewSlotsPage";
import PrepPathPage from "./components/PrepPathPage";
import Feedback from "./components/Feedback";
import UserManual from "./components/UserManual";
import ResumeBuilderPage from "./components/ResumeBuilderPage";
import SPCDashboard from "./components/SPCDashboard";
import SPCPlacementForm from "./components/SPCPlacementForm";
import SPCConversionForm from "./components/SPCConversionForm";
import GeneralStatsPage from "./components/GeneralStats/GeneralStatsPage";
import GeneralCompanyList from "./components/GeneralCompanyList";
import GeneralPricingPage from "./components/GeneralPricingPage";
import GeneralDataEntryPage from "./components/GeneralDataEntryPage";
import AIInterviewDataEntryPage from "./components/AIInterviewDataEntryPage";
import AboutPage from "./components/legal/AboutPage";
import TermsPage from "./components/legal/TermsPage";
import PrivacyPage from "./components/legal/PrivacyPage";
import RefundPage from "./components/legal/RefundPage";
import ShippingPage from "./components/legal/ShippingPage";
import PublicPricingPage from "./components/legal/PublicPricingPage";
import PlatformLanding from "./components/PlatformLanding";
import CollegeOnboarding from "./components/CollegeOnboarding";
import { RESUME_BUILDER_ENABLED } from "./utils/constants";
import {
  TENANT_BASE,
  GENERAL_BASE,
  isAppShellPath,
  tenantPath,
} from "./constants/tenant.js";
import {
  canAccessRvceTenant,
  canAccessGeneralTenant,
  isPlatformAdminUser,
  isOnboardedInstitutionUser,
} from "./utils/collegeScope.js";
import { TenantShellProvider } from "./context/TenantShellContext.jsx";

function PublicLegalShell() {
  return (
    <TenantShellProvider base={GENERAL_BASE}>
      <div className="flex min-h-screen flex-col bg-theme-app text-theme-primary">
        <header className="border-b border-theme bg-theme-sidebar px-6 py-4">
          <Link
            to="/"
            className="font-serif text-xl tracking-tight text-theme-primary"
          >
            lastminute<span className="italic text-theme-accent">placementprep</span>
          </Link>
        </header>
        <main className="flex-grow">
          <Outlet />
        </main>
        <PlatformFooter />
      </div>
    </TenantShellProvider>
  );
}

function LegalInfoRoutes() {
  return (
    <>
      <Route path="about" element={<AboutPage />} />
      <Route path="terms" element={<TermsPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="refund" element={<RefundPage />} />
      <Route path="shipping" element={<ShippingPage />} />
    </>
  );
}

const PUBLIC_ROOT_PATHS = new Set([
  "/",
  "/onboard",
  "/about",
  "/terms",
  "/privacy",
  "/refund",
  "/shipping",
  "/pricing",
  "/contact",
]);

/** Reset window scroll on client-side navigation (e.g. home marquee → company details). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** `/rvce` is only for signed-in `@rvce.edu.in` accounts (login + OAuth callback exempt).
 *  Platform owners may also enter campus dashboards. */
function TenantAccessGate() {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  const path = String(location.pathname || "");
  const isExempt =
    path === tenantPath("/login") ||
    path === tenantPath("/auth/callback") ||
    path.startsWith(`${tenantPath("/auth/callback")}`);

  if (isExempt) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-app text-theme-secondary">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessRvceTenant(user) && !isSuperAdmin && !isPlatformAdminUser(user)) {
    return <Navigate to={GENERAL_BASE} replace />;
  }

  return <Outlet />;
}

/** `/general` for signed-in students outside an onboarded campus tenant.
 *  Platform owners may stay on `/general` even with a campus email. */
function GeneralAccessGate() {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-app text-theme-secondary">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isSuperAdmin || isPlatformAdminUser(user)) {
    return <Outlet />;
  }

  if (isOnboardedInstitutionUser(user)) {
    return <Navigate to={TENANT_BASE} replace />;
  }

  if (!canAccessGeneralTenant(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function AppShell({ base }) {
  const { isInterviewLocked } = useInterviewLock();

  return (
    <TenantShellProvider base={base}>
      <div className="flex flex-col min-h-screen bg-theme-app text-theme-primary">
        {!isInterviewLocked && <Header />}

        <main
          className={`flex-grow pb-2 px-2 sm:px-4 md:px-6 ${
            isInterviewLocked ? "pt-0" : "pt-3 sm:pt-5"
          }`}
        >
          <Outlet />
        </main>

        {!isInterviewLocked &&
          (base === GENERAL_BASE ? <PlatformFooter /> : <Footer />)}
        {!isInterviewLocked && base === TENANT_BASE ? <PlacementPopupWrapper /> : null}
      </div>
    </TenantShellProvider>
  );
}

function StudentFeatureRoutes({
  includeIndexHome = true,
  includeLeaderboard = true,
  flatCompanyList = false,
  generalInterviewHub = false,
} = {}) {
  return (
    <>
      {includeIndexHome ? <Route index element={<Home />} /> : null}
      <Route
        path="companystats"
        element={flatCompanyList ? <GeneralCompanyList /> : <CompanyStats />}
      />
      <Route
        path="category"
        element={flatCompanyList ? <GeneralCompanyList /> : <CompanyStats />}
      />
      <Route path="general-stats" element={<GeneralStatsPage />} />
      {includeLeaderboard ? (
        <Route
          path="leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
      ) : (
        <Route path="leaderboard" element={<Navigate to={GENERAL_BASE} replace />} />
      )}
      <Route path="feedback" element={<Feedback />} />
      <Route path="user-manual" element={<UserManual />} />
      <Route
        path="companies/:id"
        element={
          <ProtectedRoute>
            <CompanyDetails />
          </ProtectedRoute>
        }
      />
      <Route path="contact" element={<Contact />} />
      <Route
        path="resources"
        element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />
      <Route
        path="interviews"
        element={
          <ProtectedRoute>
            {generalInterviewHub ? <GeneralMockInterviewPage /> : <AIInterviews />}
          </ProtectedRoute>
        }
      />
      <Route
        path="prep-path"
        element={
          <ProtectedRoute>
            <PrepPathPage />
          </ProtectedRoute>
        }
      />
      <Route path="team" element={<Developers />} />
      <Route
        path="profile"
        element={
          <ProtectedRoute>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="my-submissions"
        element={
          <ProtectedRoute>
            <MySubmissionsPage />
          </ProtectedRoute>
        }
      />
      {RESUME_BUILDER_ENABLED ? (
        <Route
          path="resume-builder"
          element={
            <ProtectedRoute>
              <ResumeBuilderPage />
            </ProtectedRoute>
          }
        />
      ) : null}
    </>
  );
}

function TenantRoutes() {
  return (
    <Route path={TENANT_BASE} element={<TenantAccessGate />}>
      <Route element={<AppShell base={TENANT_BASE} />}>
        {StudentFeatureRoutes()}
        <Route
          path="interview-slots"
          element={
            <ProtectedRoute>
              <InterviewSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="admin/jd-import"
          element={
            <ProtectedAdminRoute>
              <JdImportPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="admin/min-cgpa"
          element={
            <ProtectedAdminRoute>
              <MinCgpaGapsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="admin/rvitm-data"
          element={
            <ProtectedAdminRoute>
              <RvitmDataPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="spc-dashboard"
          element={
            <ProtectedSpcRoute>
              <SPCDashboard />
            </ProtectedSpcRoute>
          }
        />
        <Route
          path="spc/form"
          element={
            <ProtectedSpcRoute>
              <SPCPlacementForm />
            </ProtectedSpcRoute>
          }
        />
        <Route
          path="spc/conversion-details"
          element={
            <ProtectedSpcRoute>
              <SPCConversionForm />
            </ProtectedSpcRoute>
          }
        />
      </Route>
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="login" element={<Login />} />
    </Route>
  );
}

function GeneralRoutes() {
  return (
    <Route path={GENERAL_BASE} element={<GeneralAccessGate />}>
      <Route element={<AppShell base={GENERAL_BASE} />}>
        <Route index element={<PlatformLanding embedded />} />
        <Route path="pricing" element={
            <ProtectedRoute>
              <GeneralPricingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <ProtectedPlatformAdminRoute>
              <PlatformAdminDashboard />
            </ProtectedPlatformAdminRoute>
          }
        />
        <Route
          path="data-entry"
          element={
            <ProtectedPlatformAdminRoute>
              <GeneralDataEntryPage />
            </ProtectedPlatformAdminRoute>
          }
        />
        <Route
          path="data-entry/:companyId"
          element={
            <ProtectedPlatformAdminRoute>
              <GeneralDataEntryPage />
            </ProtectedPlatformAdminRoute>
          }
        />
        <Route
          path="ai-interview-data-entry"
          element={
            <ProtectedPlatformAdminRoute>
              <AIInterviewDataEntryPage />
            </ProtectedPlatformAdminRoute>
          }
        />
        {LegalInfoRoutes()}
        {StudentFeatureRoutes({
          includeIndexHome: false,
          includeLeaderboard: false,
          flatCompanyList: true,
          generalInterviewHub: true,
        })}
        <Route
          path="interview-slots"
          element={
            <ProtectedRoute>
              <InterviewSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="interview-analytics"
          element={
            <ProtectedRoute>
              <InterviewAnalyticsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Route>
  );
}

/** Old bookmarks like /category → /rvce/category. Does not touch public roots or app shells. */
function LegacyTenantRedirect() {
  const location = useLocation();
  if (
    PUBLIC_ROOT_PATHS.has(location.pathname) ||
    isAppShellPath(location.pathname) ||
    location.pathname.startsWith("/api")
  ) {
    return null;
  }
  return (
    <Navigate
      to={`${TENANT_BASE}${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <ScrollToTop />
        <AuthProvider>
          <DauPresenceTracker />
          <ThemeProvider>
            <InterviewLockProvider>
              <ProductTourProvider>
                <Routes>
                  <Route path="/" element={<PlatformLanding />} />
                  <Route path="/onboard" element={<CollegeOnboarding />} />
                  <Route element={<PublicLegalShell />}>
                    {LegalInfoRoutes()}
                    <Route path="pricing" element={<PublicPricingPage />} />
                    <Route path="contact" element={<Contact />} />
                  </Route>
                  {TenantRoutes()}
                  {GeneralRoutes()}
                  <Route path="*" element={<LegacyTenantRedirect />} />
                </Routes>
              </ProductTourProvider>
            </InterviewLockProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;