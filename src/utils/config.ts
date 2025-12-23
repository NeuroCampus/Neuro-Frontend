// API configuration - supports both development and production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_ENDPOINT = `${API_BASE_URL}/api`; // Add /api suffix for all API calls

const TOKEN_REFRESH_TIMEOUT = 10000; // 10 seconds timeout for token refresh requests

export { API_BASE_URL, API_ENDPOINT, TOKEN_REFRESH_TIMEOUT };