// API configuration - change this to switch between mock and real backend
export const API_CONFIG = {
  // Set to true to use the real API
  USE_REAL_API: true,
  // Base URL of the real API
  BASE_URL: "https://admin-moderator-backend-staging.up.railway.app/api",
  // Fall back to mock data if real API calls fail
  FALLBACK_TO_MOCK_ON_FAILURE: true,
};

// Simple real-API fetch wrapper with JWT header
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem("preproute_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !endpoint.includes("login")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}