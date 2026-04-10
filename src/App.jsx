import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore";
import { AuthProvider } from "./utils/AuthContext";
import { PremiumProvider } from "./utils/PremiumContext";
import { ThemeProvider } from "./utils/ThemeContext";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import AuthCallback from "./components/AuthCallback";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
// PAYMENT GATEWAY INTEGRATION - COMMENTED OUT
// import Premium from "./components/Premium";
import Resources from "./components/Resources";
import AdminDashboard from "./components/AdminDashboard";
import Events from "./components/Events";
import Analytics from "./components/Analytics";
import Developers from "./components/Developers";
import GlobalChatbot from "./components/GlobalChatbot";
import StudentProfilePage from "./components/StudentProfilePage";
import PlacementPopupWrapper from "./components/PlacementPopupWrapper";
import Leaderboard from "./components/Leaderboard";
import AIInterviews from "./components/AIInterviews";


function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <AuthProvider>
          <PremiumProvider>
            <ThemeProvider>
              <div className="flex flex-col min-h-screen bg-theme-app text-theme-primary">
                <Sidebar />

              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/companystats" element={<CompanyStats />} />
                  <Route path="/category" element={<CompanyStats />} />
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/companies/:id" 
                    element={
                      <ProtectedRoute>
                        <CompanyDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
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
                    path="/interviews"
                    element={
                      <ProtectedRoute>
                        <AIInterviews />
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
                  <Route path="/team" element={<Developers />} />
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
            </ThemeProvider>
          </PremiumProvider>
          </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;