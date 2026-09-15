# Week 5 : Ranking Logic & Search Endpoints Test

# API Verification & Integration Testing

## Goal:
Verify that the `GET /api/workers` endpoint correctly filters data by category/location and accurately sorts the results by rating (Ranking Logic).

## Relevant Context
Customers rely on accurate search results. If the ranking logic is broken, low-rated workers might appear above highly-rated professionals, ruining the user experience.

## Key Observation
We must assert that the array returned by the API is perfectly sorted by the `rating` attribute in descending order.

## Solution
- Created `tests/search.test.js` using Jest and Supertest.
- Implemented tests to check query parameter filtering (category and location).
- Wrote a dedicated test block to mathematically verify that `worker[0].rating >= worker[1].rating` to prove the ranking algorithm works.

