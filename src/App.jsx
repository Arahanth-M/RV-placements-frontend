import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import appStore from "./utils/appStore"; 
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import CompanyStats from "./components/CompanyStats";
import CompanyDetails from "./components/CompanyDetails";
import About from "./components/About";
import Contact from "./components/Contact";
import Chatbot from "./components/Chatbot";
import Resources from "./components/Resources";

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
              <Route path="/company/:id" element={<CompanyDetails />} />
              <Route path="/about" element={<About />} />
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
