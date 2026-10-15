# Week 5 : Customer Search & Discovery

# Building the Search Bar, Filters & Results Grid

## Goal:

Let customers search for approved workers by category and location, and present the ranked results clearly.

## Relevant Context

The backend exposes `GET /api/workers?category=plumber&location=delhi`, returning only approved workers already sorted by rating in descending order. The frontend needs a search bar, category and location filters, and a results grid built from the existing `WorkerCard` component. Clicking a card should open a detail view with the worker's full profile.

## Key Observation

Firing a request on every keystroke floods the backend with near-identical queries. Debouncing the input before calling the API keeps the search responsive without the extra load. It was also important not to re-sort results on the client, since the server already applies the ranking logic — reordering locally would silently undo it.

## Solution

- Built `pages/Search.jsx` with a search input plus category and location filter controls, holding all criteria in a single state object.
- Added a debounce (300ms) on the search input so the API is called only after the user pauses typing.
- Synced active filters to the URL query string so a search can be shared or survive a page refresh.
- Rendered results in a responsive grid of `WorkerCard` components, preserving the rating-based order returned by the API.
- Built `pages/WorkerProfile.jsx` showing the worker's full details, rating, and a placeholder booking button for the Week 6 feature.
- Added skeleton loaders during fetches and a friendly "no workers found" state with a prompt to widen the filters.
