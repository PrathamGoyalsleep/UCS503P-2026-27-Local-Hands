const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function safeJson(response, fallbackMsg) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (response.status === 404) {
      throw new Error(
        "Payment route not found (404). Please stop and restart your backend server (run 'npm start' in code/backend) so the new Razorpay routes take effect."
      );
    }
    throw new Error(`Server returned ${response.status}: ${text.slice(0, 120)}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || fallbackMsg || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function createPaymentIntent(bookingId, token) {
  const response = await fetch(`${API_URL}/api/payments/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookingId })
  });

  return safeJson(response, "Failed to initialize payment");
}

export async function confirmDemoPayment(bookingId, paymentIntentId, token) {
  const response = await fetch(`${API_URL}/api/payments/confirm-demo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookingId, paymentIntentId })
  });

  return safeJson(response, "Failed to confirm demo payment");
}

export async function createRazorpayOrder(bookingId, token) {
  const response = await fetch(`${API_URL}/api/payments/razorpay/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookingId })
  });

  return safeJson(response, "Failed to create Razorpay order");
}

export async function verifyRazorpayPayment({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }, token) {
  const response = await fetch(`${API_URL}/api/payments/razorpay/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    })
  });

  return safeJson(response, "Payment verification failed");
}

export async function getPaymentByBooking(bookingId, token) {
  const response = await fetch(`${API_URL}/api/payments/booking/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return safeJson(response, "Failed to fetch payment details");
}

export async function getPaymentDetails(paymentId, token) {
  const response = await fetch(`${API_URL}/api/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return safeJson(response, "Failed to fetch payment receipt");
}
