import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { experienceAPI } from "../utils/api";

function InternshipExperience() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchExperiences() {
      try {
        const res = await experienceAPI.getExperiences();
        setFiles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Error fetching experiences:", err);
        if (err.response && err.response.status === 401) {
          setError("Please login to view experiences.");
        } else {
          setError("Could not load internship experiences.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchExperiences();
    } else {
      setLoading(false);
      setError("Please login to view experiences.");
    }
  }, [user]);

  const toggleExpand = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

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