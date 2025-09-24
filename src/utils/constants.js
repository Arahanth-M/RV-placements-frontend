// export const BASE_URL = location.hostname === "localhost" ? "http://localhost:7779" : "/api/";

// export const BASE_URL =
//   location.hostname === "localhost"
//     ? "http://localhost:7779"
//     : "http://lastminuteplacementprep.in/api";
// ✅ Fixed base URL to properly handle both development and production



// export const BASE_URL = location.hostname === "localhost"
//   ? "http://localhost:7779/api"  // Include /api for localhost
//   : "http://lastminuteplacementprep.in/api";  // Include /api for production



export const BASE_URL = location.hostname === "localhost"
  ? "http://localhost:7779"
  : "https://lastminuteplacementprep.in";
