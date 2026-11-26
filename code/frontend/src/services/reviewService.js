const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function createReview(reviewData, token) {
  const response = await fetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to submit review");
  }
  return data;
}

export async function getWorkerReviews(workerId) {
  const response = await fetch(`${API_URL}/api/reviews/worker/${workerId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch reviews");
  }
  return data;
}

export async function updateReview(reviewId, reviewData, token) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update review");
  }
  return data;
}

export async function deleteReview(reviewId, token) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete review");
  }
  return data;
}

