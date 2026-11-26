const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function registerUser(userData) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
  } catch (netErr) {
    throw new Error("Cannot connect to server. Please verify your backend server is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Registration failed.");
  }

  return data;
}

export async function loginUser(credentials) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
  } catch (netErr) {
    throw new Error("Cannot connect to server. Please verify your backend server is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Invalid email or password.");
  }

  return data;
}

export async function getCurrentUser(token) {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      // Endpoint 404 (server not yet restarted) or 500: do not treat as auth failure
      return null;
    }

    return await response.json();
  } catch (err) {
    if (err.message === "UNAUTHORIZED") {
      throw err;
    }
    // Network or server unreachable: do not treat as auth failure
    return null;
  }
}
