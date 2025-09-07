import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore"; 
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import Contact from "./components/Contact";
import Chatbot from "./components/Chatbot";
import Resources from "./components/Resources";
import InternshipExperience from "./components/InternshipExperience";

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <div className="flex flex-col min-h-screen">
          <Header />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/companystats" element={<CompanyStats />} />
              <Route path="/companies/:id" element={<CompanyDetails />} /> 
              <Route path="/internshipExperience" element={<InternshipExperience />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/resources" element={<Resources />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
