import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore"; 
import { AuthProvider } from "./utils/AuthContext";
import { PremiumProvider } from "./utils/PremiumContext";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import AuthCallback from "./components/AuthCallback";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import InternshipExperience from "./components/InternshipExperience";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
// PAYMENT GATEWAY INTEGRATION - COMMENTED OUT
// import Premium from "./components/Premium";
import Resources from "./components/Resources";
import Leetcode from "./components/Leetcode";
import Feedback from "./components/Feedback";
import AdminDashboard from "./components/AdminDashboard";
import Events from "./components/Events";
import Analytics from "./components/Analytics";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";
import ShippingPolicy from "./components/ShippingPolicy";
import CancellationRefund from "./components/CancellationRefund";
import Developers from "./components/Developers";
import GlobalChatbot from "./components/GlobalChatbot";
import StudentProfilePage from "./components/StudentProfilePage";
import PlacementPopupWrapper from "./components/PlacementPopupWrapper";


function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <AuthProvider>
          <PremiumProvider>
            <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#302C2C' }}>
              <Sidebar />

              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/companystats" element={<CompanyStats />} />
                  <Route 
                    path="/companies/:id" 
                    element={
                      <ProtectedRoute>
                        <CompanyDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/internshipExperience" 
                    element={
                      <ProtectedRoute>
                        <InternshipExperience />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/contact" element={<Contact />} />
                  {/* PAYMENT GATEWAY INTEGRATION - COMMENTED OUT */}
                  {/* <Route path="/premium" element={<Premium />} /> */}
                  <Route 
                    path="/resources" 
                    element={
                      <ProtectedRoute>
                        <Resources />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/leetcode" 
                    element={
                      <ProtectedRoute>
                        <Leetcode />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/feedback" 
                    element={
                      <ProtectedRoute>
                        <Feedback />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/events" 
                    element={
                      <ProtectedRoute>
                        <Events />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    } 
                  />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/cancellation" element={<CancellationRefund />} />
                  <Route path="/developers" element={<Developers />} />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <StudentProfilePage />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>

              <Footer />
              <GlobalChatbot />
              <PlacementPopupWrapper />
            </div>
            </PremiumProvider>
          </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;