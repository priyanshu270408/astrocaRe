# ASTROCARE Backend

Offline-capable astronaut health monitoring API built with Node.js, Express, TypeScript, MongoDB and Socket.IO.

## Important scope

This is a hackathon/demo software backend, not a certified medical device or flight system. Alert limits in `src/services/alertService.ts` are demonstration values only. Do not use them for diagnosis, treatment or real astronaut operations. Obtain mission-approved thresholds and clinical validation before any real use.

## Requirements

- Node.js 20+
- MongoDB Community Server running locally
- npm

## 1. Install

```bash
npm install
```

Copy `.env.example` to `.env` and update `JWT_SECRET`.

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

macOS/Linux:
```bash
cp .env.example .env
```

## 2. Start local MongoDB

Install MongoDB Community Server and ensure its service is running. Default connection:
`mongodb://127.0.0.1:27017/astrocare`

This setup does not require internet after Node dependencies have been installed and MongoDB is running locally. The first `npm install` does require internet unless packages are already cached.

## 3. Create demo admin and astronaut

```bash
npm run seed:admin
```

Default local demo credentials:
- Email: `admin@astrocare.local`
- Password: `AstroCare@12345`

Change these immediately for any shared environment. You can override them with `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before running the seed script.

## 4. Start API

```bash
npm run dev
```

API: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

## 5. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@astrocare.local",
  "password": "AstroCare@12345"
}
```

Copy the returned token. For protected routes, send:
`Authorization: Bearer YOUR_TOKEN`

## Main endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/astronauts` | List astronauts |
| POST | `/api/astronauts` | Add astronaut |
| GET | `/api/astronauts/:astronautId` | Get astronaut |
| POST | `/api/telemetry` | Add one reading |
| POST | `/api/telemetry/sync` | Sync offline batch (up to 500) |
| GET | `/api/telemetry/:astronautId?limit=100` | Reading history |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| PATCH | `/api/alerts/:id/resolve` | Resolve alert |
| GET | `/api/mission/status` | Mission overview |
| POST | `/api/dev/simulate` | Create one demo reading (development only) |

All routes except `/api/health` and `/api/auth/login` require a bearer token.

## 6. Test telemetry

Use Postman or curl with your token:

```bash
curl -X POST http://localhost:5000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "astronautId": "ASTRO001",
    "heartRate": 78,
    "spo2": 98,
    "temperature": 36.8,
    "source": "manual-test",
    "clientRecordId": "manual-test-000001"
  }'
```

Run continuous demo readings in a second terminal:

```bash
npm run simulate
```

## Offline-first design

- Run the API and MongoDB on the local mission computer / laptop / onboard network.
- The frontend should write readings to IndexedDB first, with a unique `clientRecordId`.
- If the local API is unreachable, keep records in an IndexedDB pending queue.
- When the API becomes reachable, POST batches to `/api/telemetry/sync`.
- Only remove records from the pending queue when the response says `success: true`.
- The unique `clientRecordId` index makes retrying a batch idempotent (retries do not create duplicate telemetry documents).
- Socket.IO provides live updates to connected clients on the local network. It is not a substitute for durable storage or offline queueing.

This server itself needs to be running locally to accept data. MongoDB is local; no cloud database is required for this mode.

## Socket.IO events

Connect to `http://localhost:5000` from the frontend and listen for:
- `telemetry:new`
- `alert:new`
- `alert:updated`

## Build production JavaScript

```bash
npm run build
npm start
```

## Connect your React frontend

Set the frontend API base URL to `http://localhost:5000/api` for local development. Set `CORS_ORIGIN` to the exact frontend origin(s), comma-separated. Do not expose this API to the public internet without TLS, strong secrets, hardened authentication, access controls, backups and security review.


## Email notifications
Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `backend/.env`. For Gmail, enable 2-Step Verification and create a Google App Password; do not use your regular Gmail password. New engineer registrations receive a welcome email, and newly opened threshold alerts are emailed to `ALERT_EMAIL` (or `ADMIN_EMAIL`). If SMTP is not configured, account creation and telemetry continue, but emails are skipped and a warning is logged.
