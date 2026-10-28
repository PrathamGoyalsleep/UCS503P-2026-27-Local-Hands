const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function parseResponse(response, fallbackMsg) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // If response was not JSON (e.g. 404/500 HTML from server or network proxy)
    throw new Error(
      response.status === 404
        ? `${fallbackMsg}: Endpoint not found (404). Please ensure the backend server is running and updated.`
        : `${fallbackMsg} (Status ${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(data?.message || fallbackMsg);
  }
  return data;
}

export async function getAdminStats(token) {
  const response = await fetch(`${API_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseResponse(response, "Failed to fetch admin stats");
}

export async function getAllWorkers(token, filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.set("status", filters.status);
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.category) queryParams.set("category", filters.category);
  if (filters.location) queryParams.set("location", filters.location);
  if (filters.sort) queryParams.set("sort", filters.sort);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await fetch(`${API_URL}/api/admin/workers${qs}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseResponse(response, "Failed to fetch workers");
}

// Keep legacy alias for backward compatibility
export async function getPendingWorkers(token) {
  return getAllWorkers(token);
}

export async function getWorkerDetails(id, token) {
  const response = await fetch(`${API_URL}/api/admin/workers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseResponse(response, "Failed to fetch worker details");
}

export async function approveWorker(id, token) {
  const response = await fetch(`${API_URL}/api/admin/workers/${id}/approve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  return await parseResponse(response, "Failed to approve worker");
}

export async function rejectWorker(id, token, reason = "") {
  const response = await fetch(`${API_URL}/api/admin/workers/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return await parseResponse(response, "Failed to reject worker");
}
