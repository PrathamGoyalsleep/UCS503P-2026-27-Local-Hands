# Week 2 : System Design & API Definitions

# Architecture Documentation

## Goal:
Create a complete Use-Case diagram and map out the required API endpoints so the Backend developer knows exactly what to build.

## Relevant Context
The backend and frontend need a "contract" so they can work in parallel. 

## Key Observation
The most complex part of the system is the Admin Approval workflow, which sits exactly between registration and search.

## Solution
- Created `docs/system-design.md`.
- Wrote the Use-Case Diagram mapping out Customer, Worker, and Admin interactions.
- Defined the exact REST API routes (e.g., `POST /api/workers`, `GET /api/workers`) required for the MVP.

