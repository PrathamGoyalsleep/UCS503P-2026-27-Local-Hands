const API_URL = import.meta.env.VITE_API_URL;

export async function registerWorker(workerData, token) {
  const response = await fetch(`${API_URL}/api/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(workerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Worker registration failed");
  }

  return data;
}