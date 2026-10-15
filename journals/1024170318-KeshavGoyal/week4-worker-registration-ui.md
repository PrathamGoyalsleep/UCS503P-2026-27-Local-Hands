# Week 4 : Worker Registration & Admin UI

# Building the Worker Profile Form and Admin Dashboard

## Goal:

Let users with the 'worker' role submit a service profile, and give admins a dashboard to review those applications.

## Relevant Context

The worker registration form must collect service category, experience, charges, location, and phone number, then `POST` them to `/api/workers`. Profiles come back with a `pending` status, so the worker needs clear feedback that their application is awaiting approval rather than live. The admin dashboard consumes the approval endpoints to list applications and change their status.

## Key Observation

Since the backend rejects a second profile for the same `userId`, the form has to check for an existing profile on mount and switch into a read-only or edit view instead of letting the worker submit again and hit an error. On the admin side, an approval action changes data on the server, so the list must refresh optimistically for the action to feel immediate.

## Solution

- Built `pages/WorkerRegister.jsx` with a controlled form, a category dropdown, numeric validation on experience and charges, and a phone number pattern check.
- Fetched the logged-in user's existing profile on mount so returning workers see their current details and status instead of a blank form.
- Added a status panel that surfaces the `pending` state with an explanatory message about admin verification.
- Built `pages/AdminDashboard.jsx` with tabs for Pending, Approved, and Rejected applications, rendering each entry through the shared `WorkerCard` and `StatusBadge` components.
- Wired Approve and Reject buttons to the admin endpoints with a confirmation modal, then updated the local list on success so the row moves tabs without a full reload.
- Handled loading and empty states across both pages so the UI never renders a bare white screen while requests are in flight.
