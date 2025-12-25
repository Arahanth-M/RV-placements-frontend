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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#302C2C' }}>
      <p className="p-4 text-slate-400">Loading experiences...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#302C2C' }}>
      <p className="p-4 text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center text-white">Internship Experiences</h1>
        {files.length === 0 ? (
          <p className="text-slate-400 text-center">No experiences found.</p>
        ) : (
          files.map((file, idx) => (
            <div
              key={idx}
              className="p-4 border border-slate-800 rounded-lg shadow-md bg-slate-900/70 backdrop-blur cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => toggleExpand(idx)}
            >
              <h2 className="font-semibold text-lg flex justify-between items-center text-white">
                {file.key}
                <span className="text-sm text-slate-400">
                  {openIndex === idx ? "▲ Collapse" : "▼ Expand"}
                </span>
              </h2>
              {openIndex === idx && (
                <div
                  className="mt-3 prose max-w-none prose-invert prose-slate"
                  style={{ color: '#cbd5e1' }}
                  dangerouslySetInnerHTML={{ __html: file.html }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InternshipExperience;