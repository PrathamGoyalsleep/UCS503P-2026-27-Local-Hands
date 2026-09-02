# Week 3 : Defining & Testing Authentication Flows

# Auth Test Cases

## Goal:
Define test scenarios for the newly built JWT Authentication APIs (Customer Login, Worker Login, Admin Login).

## Relevant Context
We need to guarantee that unauthorized users cannot access protected routes, and that duplicate emails are rejected.

## Key Observation
Testing manually via Postman is slow. Writing Jest test cases allows us to automate the verification process.

## Solution
- Created `code/backend/tests/auth.test.js`.
- Defined test cases for successful registration, duplicate account rejection (HTTP 400), and Admin login.

