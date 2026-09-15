## Week 6 - Booking API Testing & Workflow

**Tasks Completed:**
- Wrote full end-to-end integration tests for the Week 6 Booking Module in `tests/booking.test.js`.
- Verified that customers can successfully create bookings using valid JWTs.
- Tested Double-Booking constraint: Sent overlapping date/time data to ensure the backend properly rejects the second booking with a 400 error.
- Verified worker booking retrieval (`GET /my-bookings`).
- Tested status update endpoints for Workers accepting the booking.

**Challenges:**
- Populating the test database with a valid Worker profile was complex because it requires a user ID link, so I wrote setup blocks using Supertest to dynamically register users before running the booking tests.

**Next Steps:**
- Test real-time WebSockets next week when the Chat feature is integrated.

