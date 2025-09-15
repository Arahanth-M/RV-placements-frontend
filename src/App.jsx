// import { Provider } from "react-redux";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import appStore from "./utils/appStore"; 
// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import Home from "./components/Home";
// import Login from "./components/Login";
// import CompanyStats from "./components/CompanyStats";
// import CompanyDetails from "./components/CompanyDetails";
// import Contact from "./components/Contact";
// import Chatbot from "./components/Chatbot";
// import InternshipExperience from "./components/InternshipExperience";

// function App() {
//   return (
//     <Provider store={appStore}>
//       <BrowserRouter basename="/">
//         <div className="flex flex-col min-h-screen">
//           <Header />

//           <main className="flex-grow" >
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/login" element={<Login />} />
//               <Route path="/companystats" element={<CompanyStats />} />
//               <Route path="/companies/:id" element={<CompanyDetails />} /> 
//               <Route path="/internshipExperience" element={<InternshipExperience />} />
//               <Route path="/contact" element={<Contact />} />
//               <Route path="/chatbot" element={<Chatbot />} />
//             </Routes>
//           </main>

//           <Footer />
//         </div>
//       </BrowserRouter>
//     </Provider>
//   );
// }

// export default App;


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
import InternshipExperience from "./components/InternshipExperience";

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <div className="flex flex-col min-h-screen">
          {/* Fixed header */}
          <Header />

          {/* Add top padding equal to header height */}
          <main className="flex-grow pt-16 md:pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/companystats" element={<CompanyStats />} />
              <Route path="/companies/:id" element={<CompanyDetails />} /> 
              <Route path="/internshipExperience" element={<InternshipExperience />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chatbot" element={<Chatbot />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
