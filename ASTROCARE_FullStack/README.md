# ASTROCARE — Full-stack astronaut health monitoring demo

This bundle combines the supplied React/Vite frontend, the Health Monitoring telemetry page, and the supplied Express/MongoDB backend. The page keeps its reference design and reads its cardiovascular, oxygen and temperature chart series from the backend when seeded data is available. It falls back to clearly labelled local demo data if the API or database is offline.

> **Safety/data note:** Seeded values are synthetic demonstration data. This is a hackathon prototype, not a medical device, flight-certified system, or connection to NASA systems. Thresholds are illustrative and must be configured and reviewed by qualified medical/flight personnel before any real use.

## Stack

- Frontend: React 18, TypeScript, Vite, Recharts, Lucide
- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB
- Security: Helmet, rate limiting, JWT authentication, Zod validation
- Realtime: Socket.IO server events

## Requirements

- Node.js 20+
- MongoDB Community Server or MongoDB Atlas connection string

## 1. Start MongoDB

Run MongoDB locally, or create a MongoDB Atlas database and copy its connection string.

## 2. Configure and start backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.

```bash
npm run seed:demo
npm run seed:admin
npm run dev
```

Backend runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

Demo seeding creates astronaut `HLX-07` and 223 synthetic readings across the telemetry schema. It does not overwrite a populated set. Admin seeding creates the local demo account:

- Email: `admin@astrocare.local`
- Password: `AstroCare@12345`

Change this password and the JWT secret before exposing the backend publicly. The frontend does not embed credentials or a JWT.

## 3. Start frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The Vite development server proxies `/api` to `http://localhost:5000`.

For a separately hosted backend, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL=https://your-backend.example.com`.

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | API health check |
| GET | `/api/telemetry/demo/:astronautId` | Public, read-only | Demo dashboard readings |
| POST | `/api/auth/login` | Public | Issue JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/telemetry/:astronautId` | JWT | Read stored telemetry |
| POST | `/api/telemetry` | JWT | Ingest one reading |
| POST | `/api/telemetry/sync` | JWT | Sync offline batch (max 500) |
| GET/POST | `/api/astronauts` | JWT / medical or admin for create | Crew management |
| GET | `/api/alerts` | JWT | List alerts |
| PATCH | `/api/alerts/:id/acknowledge` | JWT | Acknowledge alert |
| PATCH | `/api/alerts/:id/resolve` | JWT | Resolve alert |
| GET | `/api/mission/status` | JWT | Mission summary |
| POST | `/api/dev/simulate` | JWT, admin/medical, development only | Generate one synthetic reading |

Example login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@astrocare.local","password":"AstroCare@12345"}'
```

Pass the returned token as `Authorization: Bearer <token>` to protected endpoints.

## Offline behaviour

The health page retains a local synthetic fallback so it can still render if the API is unavailable. The backend supports idempotent offline batch ingestion via `POST /api/telemetry/sync` using `clientRecordId`. This bundle does not claim a full service-worker/PWA offline cache or automatic browser queue sync; those are follow-on implementation tasks.

## Build

```bash
# Terminal 1
cd backend && npm install && npm run build

# Terminal 2
cd frontend && npm install && npm run build
```

## Important implementation notes

- The public demo route is read-only and returns only the selected astronaut's demo telemetry. All write, crew-management, alert-management and mission routes remain JWT-protected.
- Telemetry supports heart rate, SpO₂, temperature, blood pressure, aerobic/resistance activity, sleep duration/quality, and daily/cumulative radiation fields.
- The current page's activity, sleep and radiation chart layouts retain illustrative reference values; the API data model accepts these additional measurements, while the current live chart binding is implemented for heart rate, blood pressure, SpO₂ and temperature.


## Multi-engineer workflow and offline entry
- Engineers can create their own account from the app (self-registration always assigns the `engineer` role).
- Each signed-in engineer can enter an astronaut's vital readings from the Data Entry page.
- The API evaluates demo advisory rules and opens/updates alerts when configured thresholds are crossed. Suggestions are decision-support prompts, not diagnoses.
- If the browser loses connectivity after an engineer has signed in, new readings are stored in that browser's local queue and submitted to `/api/telemetry/sync` when connectivity returns.
- Offline mode is device/browser-local. First-time sign-in, cross-device sharing, and server synchronization require a network connection. Do not clear browser site data before queued readings have synced.
- The offline queue is stored in localStorage for this prototype; use encrypted IndexedDB and a managed device policy before operational deployment.
- All displayed thresholds and suggestions are illustrative demo rules, not clinically validated or flight-certified limits.


## Quick start for the multi-engineer demo
1. Start MongoDB.
2. In `backend`, copy `.env.example` to `.env`, set a private `JWT_SECRET` (32+ random characters), and set a non-demo admin password.
3. Run `npm install`, then `npm run seed:admin` once to create the initial admin and demo astronaut `ASTRO001`.
4. Run `npm run dev` in `backend`.
5. In `frontend`, set `VITE_API_URL=http://localhost:5000`, run `npm install`, then `npm run dev`.
6. Open the Vite URL, choose Open dashboard, then create an engineer account. Each self-registered account is assigned the Engineer role.
7. Open Data Entry and submit readings for `ASTRO001`. Open Alerts & Notifications to review any generated alert and its suggested next step.

The browser keeps a session and an offline reading queue on that device. After an internet/server connection returns, queued readings are posted to the authenticated batch-sync endpoint. Offline use does not mean multiple disconnected devices can exchange data; each device syncs to the shared server when it reconnects.

## Local setup (Windows / VS Code)

1. Install Node.js LTS and MongoDB Community Server. Start the MongoDB service.
2. In `backend`, copy `.env.example` to `.env`. Set a unique `JWT_SECRET` (32+ characters) and your MongoDB URI.
3. In a terminal:
   ```powershell
   cd backend
   npm install
   npm run seed:admin
   npm run dev
   ```
4. In a second terminal:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
5. Open the Vite URL (normally `http://localhost:5173`). The Vite dev proxy forwards `/api` to `http://localhost:5000`; keep both terminals open.
6. Create an engineer account from the login screen. For an admin login, use the credentials configured in `backend/.env` after running `npm run seed:admin`.

### Email setup

Email is optional for local development. To send welcome emails to newly registered engineers and email alerts to mission control, set the SMTP values in `backend/.env` (see `.env.example`). With Gmail, turn on 2-Step Verification and create an App Password; use that 16-character App Password as `SMTP_PASS`, not your normal Gmail password. Set `ALERT_EMAIL` to the mission-control inbox. Restart the backend after editing `.env`. If SMTP is not configured, the application still works, but email delivery is skipped and logged in the backend terminal.

### Important

This is a hackathon prototype using rule-based advisory thresholds and sample/demo data. It is not a medical device or flight-certified system. All health alerts must be reviewed under mission-approved medical procedures.
