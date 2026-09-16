# Week 6 : Scheduling & Bookings

# Building the Booking UI & Date/Time Picker

## Goal:

Let customers reserve a specific time slot with an approved worker instead of only viewing their contact details.

## Relevant Context

The backend exposes Booking CRUD endpoints and rejects any slot where the worker is already engaged, so the frontend needs a date and time picker that collects the requested slot and sends it with the worker ID and service address. The booking then moves through a lifecycle — `pending` while the worker decides, then `accepted`, `rejected`, or `completed` — and both sides of the app need a view of that state. This replaces the placeholder booking button left on the worker profile page in Week 5.

## Key Observation

A customer should never be able to submit a slot that is already taken or in the past, so the picker has to disable those options rather than let the request fail server-side. Because the backend is the only authority on double-booking, the UI still has to handle a conflict response gracefully — two customers can pick the same slot within seconds of each other, and the loser needs a clear message instead of a generic error.

## Solution

- Built `components/BookingModal.jsx`, opened from the worker profile page, containing the date picker, time-slot selector, and a notes field for the customer's requirement.
- Integrated `react-datepicker` with past dates disabled and fetched the worker's already-booked slots on date change so unavailable times render greyed out.
- Handled the backend's conflict response by surfacing an inline "slot just got taken" message and refreshing the available slots without closing the modal.
- Built `pages/MyBookings.jsx` for customers, listing their requests with a `StatusBadge` for each state and a cancel action on pending ones.
- Built `pages/WorkerBookings.jsx` so workers see incoming requests with Accept and Reject actions, updating the list locally on success.
- Added a "Mark as completed" action on accepted bookings to close the loop and prepare the record for the Week 8 payment flow.
- Covered loading, empty, and error states on both booking lists so neither page renders blank while requests are in flight.
