# Week 1 : Project Setup & Requirements

# Frontend Initialization

## Goal:

Understand exactly what we're building and initialize the React client application.

## Relevant Context

We need to set up a React frontend using Vite and configure client-side routing for the ServeConnect application. The folder structure should include pages, components, services, and context so the app stays organized as features are added each week. The API base URL must be configurable through environment variables rather than hardcoded.

## Key Observation

The sprint plan mandates that the React development server must run cleanly and that routing be in place before any feature work begins. Vite was chosen over Create React App for faster builds and hot module replacement. The structure must be modular enough to absorb authentication, search, booking, chat, and payment screens later.

## Solution

- Scaffolded the project with `npm create vite@latest` using the React template and installed dependencies (`react-router-dom`, `axios`).
- Organized the directory structure (`pages`, `components`, `services`, `context`, `assets`) to prepare for a component-driven architecture.
- Configured `react-router-dom` in `App.jsx` with `BrowserRouter` and placeholder routes for Home, Login, and Register.
- Created `services/api.js` with a central Axios instance reading the backend URL from `.env` (`VITE_API_URL`).
- Built a shared `Navbar` and `Footer` layout so every page renders with consistent chrome.
