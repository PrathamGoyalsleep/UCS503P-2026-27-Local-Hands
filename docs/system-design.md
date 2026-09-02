# ServeConnect: System Design & API Requirements
**Author:** Pratham Goyal (Team Lead)

## 1. Complete Workflow
1. **Worker Registration:** Service professional registers with category, charges, and location. Profile status defaults to `pending`.
2. **Admin Verification:** Admin logs in, views `pending` workers, and approves or rejects them.
3. **Customer Search:** Customer searches by category and location. Only `approved` workers are visible.
4. **Connection:** Customer views the worker profile and clicks "Call Now" (or Books time slot).
5. **Post-Service:** Customer leaves a 1-5 star rating and a review.

## 2. Use-Case Diagram
```mermaid
usecaseDiagram
    actor Customer
    actor Worker
    actor Admin

    Customer --> (Search Workers)
    Customer --> (View Profile & Call)
    Customer --> (Leave Review)

    Worker --> (Register Profile)
    Worker --> (Manage Availability)

    Admin --> (View Pending Workers)
    Admin --> (Approve / Reject Workers)
```

## 3. User Roles & Permissions
* **Customer:** Can read approved worker profiles, create reviews, create bookings.
* **Worker:** Can create a worker profile, update own profile.
* **Admin:** Has full access. Can read all pending profiles, approve/reject workers, and delete reviews.

## 4. API Requirements Summary
* `POST /api/auth/register` (Public)
* `POST /api/auth/login` (Public)
* `POST /api/workers` (Private - Worker only)
* `GET /api/workers` (Public - Search with query params)
* `PUT /api/admin/workers/:id/approve` (Private - Admin only)

