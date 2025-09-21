// export const BASE_URL = location.hostname === "localhost" ? "http://localhost:7779" : "/api/";

export const BASE_URL =
  location.hostname === "localhost"
    ? "http://localhost:5000/api" // <-- backend dev URL
    : "http://lastminuteplacementprep.in/api"; // <-- production backend
