## Week 6 - Scheduling & Booking APIs

**Tasks Completed:**
- Created the `Booking` schema in `models/Booking.js` mapping `customerId` (User) and `workerId` (Worker).
- Built `POST /api/bookings` in `bookingController.js` to handle booking creation.
- Implemented **Double-Booking Prevention** logic to ensure a worker cannot be booked for the same date and time if their status is pending or accepted.
- Built `GET /api/bookings/my-bookings` which smartly checks `req.user.role` to return either the customer's requested bookings or the worker's assigned bookings.
- Linked booking routes into `server.js`.
- **Database Expansion:** Updated `seed.js` to populate the database with a wider variety of test workers across different locations (Painter in Delhi, Cleaning in Chandigarh, AC Repair in Ludhiana) to fully test search and booking functionality.

**Challenges:**
- The worker populating logic was tricky for `my-bookings` because the worker ID is separate from the User ID. Fixed it by doing a dual query.

**Next Steps:**
- Add Socket.io for Real-Time chat.

