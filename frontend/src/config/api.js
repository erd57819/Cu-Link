// These are public API addresses, not credentials.
export const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || "https://culink-backend.onrender.com"
).replace(/\/+$/, "");

export const FASTAPI_URL = (
  process.env.REACT_APP_FASTAPI_URL || "https://culink-fastapi.onrender.com"
).replace(/\/+$/, "");
