# Week 4 : Validation & Admin Rules

# Validation Middleware

## Goal:
Ensure that no worker can create a profile with invalid data, missing fields, or negative charges. 

## Relevant Context
If dirty data gets into the database, the Admin dashboard and Customer search will crash or display incorrectly.

## Key Observation
Validation should happen *before* the request reaches the database controller. 

## Solution
- Created `code/backend/middleware/validationMiddleware.js`.
- Implemented rules to check for required fields (`phone`, `category`, `experience`, `charges`, `location`).
- Added numerical checks (preventing negative experience or charges).
- Placed this middleware in front of the `POST /api/workers` route to enforce data integrity.

