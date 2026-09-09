# Week 5 : Customer Search & Admin APIs

# Implementing Search & Approval

## Goal:
Build the Admin Approval endpoints so admins can process worker applications, and create a powerful Customer Search API with ranking logic.

## Relevant Context
The frontend needs a way to fetch only approved workers based on search criteria (category and location). Furthermore, the Admin dashboard needs specific endpoints to fetch all pending workers and update their status.

## Key Observation
Sorting results purely by database insertion order is poor UX. We must integrate ranking logic so higher-rated workers appear first.

## Solution
- Built `GET /api/workers` and added regex pattern matching for category/location filters.
- Implemented **Ranking Logic** by chaining `.sort({ rating: -1 })` to the query, fulfilling the advanced requirement.
- Created `controllers/adminController.js` with endpoints to `getAllWorkers`, `approveWorker`, and `rejectWorker`.
- Secured admin routes using `authorize('admin')` middleware.
- **Twilio SMS Integration:** Installed the Twilio SDK and created `utils/smsService.js` to automatically dispatch an SMS notification to the worker's phone number the exact moment their profile status is updated to "approved".

