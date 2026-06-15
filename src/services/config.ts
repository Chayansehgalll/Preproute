// API configuration - production backend gateway
export const API_CONFIG = {
  BASE_URL: "https://admin-moderator-backend-staging.up.railway.app/api",
};

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
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}