# HackBuddy

HackBuddy is a hackathon teammate-discovery and team-formation platform designed to help participants find people whose skills complete their team.

## Architecture

HackBuddy is a full-stack application composed of:
- **Frontend:** React + Vite (configured for eventual deployment on Vercel)
- **Backend:** Node.js + Express (currently designed to run locally on your laptop)
- **Database:** SQLite using `better-sqlite3`

## Features

- **Google Authentication:** Login is strictly handled via Google Identity Services.
- **Email Access Policy:** Configurable access (e.g., allowing all emails or restricting to specific domains like `vitstudent.ac.in`).
- **Phone Collection:** Users provide their phone number during onboarding. Contact sharing is explicit and one-way within accepted matches.
- **Profile Matching:** The engine calculates a Complement Score based on missing skills.
- **Match Rooms:** Instead of free-form chat, accepted connections open a structured Match Room to compare selected Problem Statements and explicitly share contact details.

## Local Development

### 1. Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`).
Ensure you provide at minimum the `GOOGLE_CLIENT_ID` for authentication to work.

### 2. Database Setup

The SQLite database (`server/data/hackbuddy.db`) is automatically initialized with the required schema when the backend server starts. 
*Note: No dummy/fake user profiles are seeded.*

### 3. Running the Application

To run both the frontend dev server and the backend concurrently:
```bash
npm install
npm run dev:all
```
- Frontend runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:4000`

### 4. Administrator Setup

Administrative authorization is managed securely via a local private file. 
Place your configured superadmin JSON inside `.private/admins.json`. 
**Do not commit this file.** The server will parse this file and map roles to authenticated Google users.



## Vercel + Laptop Backend Concept

The frontend is designed to be deployed on Vercel, while the backend and database currently reside on your local machine.
For the deployed Vercel frontend to reach your local backend API during real-world testing, you will need to expose your local port `4000` using a secure tunnel (e.g., Cloudflare Tunnel or ngrok).

Once you have a tunnel URL, set the environment variable in your Vercel project:
```
VITE_API_BASE_URL=https://your-tunnel-url.com/api
```
And add your Vercel deployment URL to the backend's allowed origins:
```
FRONTEND_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
```
(Again, restart the backend for `.env` changes to take effect).
