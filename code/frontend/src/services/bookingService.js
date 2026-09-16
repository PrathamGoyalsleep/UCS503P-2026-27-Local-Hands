export const getMyBookings = async (token) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to load bookings");
    return response.json();
};

export const createBooking = async (token, bookingData) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create booking");
    return data;
};

export const updateBookingStatus = async (token, id, status) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update booking");
    return data;
};

