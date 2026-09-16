# Week 2 : Database + UI Design

# Designing Wireframes & the Component System

## Goal:

Design the UI wireframes for every user flow and build the reusable component base as per the sprint requirements.

## Relevant Context

While the backend designed its collections, the frontend needed matching screens for the core application flows of ServeConnect:
- **Customer flow**: search workers, view a worker profile, request a booking.
- **Worker flow**: register a service profile, view incoming booking requests.
- **Admin flow**: review pending applications and approve or reject them.
- **Shared flow**: login, register, and a chat screen reserved for the Week 7 feature.

## Key Observation

Wireframing all flows before coding revealed which UI pieces repeat across pages — worker cards, status badges, form inputs, and modals appear in almost every screen. Building these once as shared components avoids duplicated CSS later. The wireframes also had to mirror the backend field names (category, experience, charges, location, status) so the forms map directly onto the Mongoose schemas.

## Solution

- Produced low-fidelity wireframes in Figma for the customer, worker, and admin journeys and reviewed them with the team.
- Created `components/WorkerCard.jsx` to display a worker's name, category, location, charges, and rating in a single reusable tile.
- Created `components/StatusBadge.jsx` rendering colour-coded badges for the `pending`, `approved`, and `rejected` states.
- Built shared form controls (`InputField`, `SelectField`, `Button`) so validation styling stays consistent across every form.
- Defined a global stylesheet with CSS variables for colours, spacing, and typography to keep the design system consistent.
