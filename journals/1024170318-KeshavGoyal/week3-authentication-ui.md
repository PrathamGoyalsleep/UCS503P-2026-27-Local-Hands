# Week 3 : Authentication

# Building Login, Register & Protected Routes

## Goal:

Implement the Login and Register screens and restrict pages to authenticated users with the correct role.

## Relevant Context

The backend exposes `/api/auth/register` and `/api/auth/login`, both returning a JWT on success. The frontend needs to store that token, attach it to every subsequent request, and stop unauthenticated users from reaching customer, worker, or admin pages. The registration form also has to let a user pick their role so the backend records it correctly.

## Key Observation

Storing the token in component state alone loses the session on refresh, so it must be persisted and rehydrated on app load. Because the token carries the user's role, route protection can be handled by a single wrapper component that checks both "is logged in" and "is allowed" instead of repeating the check inside each page.

## Solution

- Created `context/AuthContext.jsx` to hold the current user and token, persisting both to `localStorage` and restoring them when the app mounts.
- Built `pages/Login.jsx` and `pages/Register.jsx` with client-side validation for email format, password length, and required fields.
- Implemented `components/ProtectedRoute.jsx`, which redirects unauthenticated visitors to `/login` and sends users with the wrong role to an unauthorized page.
- Added an Axios request interceptor in `services/api.js` to attach `Authorization: Bearer <token>` to every outgoing call.
- Added a response interceptor to clear the stored session and redirect to login whenever the API returns `401`.
- Made the Navbar reactive to auth state, showing Login/Register when signed out and the role-specific dashboard link plus Logout when signed in.
