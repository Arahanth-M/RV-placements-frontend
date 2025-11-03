import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore"; 
import { AuthProvider } from "./utils/AuthContext";
import { PremiumProvider } from "./utils/PremiumContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import AuthCallback from "./components/AuthCallback";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import InternshipExperience from "./components/InternshipExperience";
import ProtectedRoute from "./components/ProtectedRoute";
import Premium from "./components/Premium";
import Resources from "./components/Resources";
import Leetcode from "./components/Leetcode";
import Feedback from "./components/Feedback";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";
import ShippingPolicy from "./components/ShippingPolicy";
import CancellationRefund from "./components/CancellationRefund";
import GlobalChatbot from "./components/GlobalChatbot";


function App() {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const headerEl = document.querySelector("header");
    if (headerEl) {
      setHeaderHeight(headerEl.offsetHeight);
    }

    const handleResize = () => {
      if (headerEl) setHeaderHeight(headerEl.offsetHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <AuthProvider>
          <PremiumProvider>
            <div className="flex flex-col min-h-screen">
              <Header />

              <main className="flex-grow" style={{ paddingTop: headerHeight }}>
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
                  <Route path="/premium" element={<Premium />} />
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
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/cancellation" element={<CancellationRefund />} />
                </Routes>
              </main>

              <Footer />
              <GlobalChatbot />
            </div>
          </PremiumProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;