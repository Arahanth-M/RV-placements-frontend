import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore"; 
import { AuthProvider } from "./utils/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import Chatbot from "./components/Chatbot";
import InternshipExperience from "./components/InternshipExperience";
import ProtectedRoute from "./components/ProtectedRoute";


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
          <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-grow" style={{ paddingTop: headerHeight }}>
              <Routes>
                <Route path="/" element={<Home />} />
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
                <Route path="/chatbot" element={<Chatbot />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;