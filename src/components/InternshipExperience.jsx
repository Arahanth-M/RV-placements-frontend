import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function InternshipExperience() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExperiences() {
      try {
        const res = await axios.get("http://localhost:7779/api/experiences", {
          withCredentials: true,
        });

        setFiles(Array.isArray(res.data) ? res.data : []);
        setIsLoggedIn(true); 
      } catch (err) {
        console.error("❌ Error fetching experiences:", err);

        if (err.response && err.response.status === 401) {
          setIsLoggedIn(false); 
        } else {
          setError("Could not load internship experiences.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, []);

  const toggleExpand = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  
  if (!isLoggedIn) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50">
        <p className="text-gray-700 text-lg font-medium">
          Please{" "}
          <span
            className="text-indigo-600 font-semibold cursor-pointer"
            onClick={() => navigate("/login")}
          >
            login
          </span>{" "}
          to view the data.
        </p>
      </div>
    );
  }

  if (loading) return <p className="p-4 text-gray-600">Loading experiences...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">Internship Experiences</h1>

      {files.length === 0 ? (
        <p className="text-gray-600">No experiences found.</p>
      ) : (
        files.map((file, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-lg shadow-md bg-white cursor-pointer"
            onClick={() => toggleExpand(idx)}
          >
            <h2 className="font-semibold text-lg flex justify-between items-center">
              {file.key}
              <span className="text-sm text-gray-500">
                {openIndex === idx ? "▲ Collapse" : "▼ Expand"}
              </span>
            </h2>

            {openIndex === idx && (
              <div
                className="mt-3 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: file.html }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default InternshipExperience;


