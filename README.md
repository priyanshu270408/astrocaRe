# ASTROCARE — Full-Stack Astronaut Health Monitoring Platform

An exact, faithful, production-ready reproduction of the **ASTROCARE** platform (built for the **2026 NASA Space Apps Challenge · Astronaut health**).

---

## 🚀 How to Run the Website (Instant 1-Click Launch)

### Option 1: Standalone Browser Launch (No installation required)
Simply double-click:
📂 **[`web/index.html`](web/index.html)**

The website runs 100% self-contained in your default browser (Chrome, Edge, Firefox, Opera) with complete animations, live streaming telemetry, interactive charts, and local offline persistence.

---

### Option 2: Full-Stack Mode with Live REST API Backend
Double-click:
▶ **[`start.bat`](start.bat)** (or run `python server.py`)

This launches the included Python 3 server on:
👉 **`http://localhost:8000`**

- **API Health Check**: `http://localhost:8000/api/health`
- **Demo Telemetry API**: `http://localhost:8000/api/telemetry/demo/HLX-07`
- **Alerts API**: `http://localhost:8000/api/alerts`

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Quick Action |
|---|---|---|---|
| **Mission Medical Officer / Admin** | `admin@astrocare.local` | `AstroCare@12345` | Click **"⚡ Fill Admin"** on login screen |
| **Flight Engineer** | `engineer@mission.org` | `Password@123` | Click **"⚡ Fill Engineer"** on login screen |

---

## 🌟 Included Features & Systems

1. **Space Apps Challenge Landing Page**:
   - Shooting-star canvas particle physics engine.
   - Hero section with orbital rings, astronaut mission photo, live pulsing heart-rate card, and risk assessment pill.
   - 8 Space Medicine Problem cards, 3 Solution stages, and 9 Core Feature cards with `● LIVE IN DEMO` tags.
   - AI Health Monitoring auditable risk detection card with supporting readings chips.
   - Interactive Digital Health Twin with stylized humanoid silhouette and telemetry callout tags.
   - Mission Safety and modular Technology Stack matrices.

2. **Mission Control Access Gate**:
   - Clean dark-theme authentication card with starfield backdrop.
   - Toggle between "Sign in" and "Create engineer account".
   - "Continue with saved session (offline)" button for immediate reconnection.

3. **Mission Operations Dashboard**:
   - Live telemetry charts with SVG Cartesian grid, dual line graphs (Heart Rate pink, SpO2 cyan), and threshold dashed lines.
   - 4 Vital Signs cards with status indicators and live sparklines.
   - Health Data Simulator:
     - Streaming toggle (▶ Resume / Ⅱ Pause every 3 seconds).
     - "＋ Generate one reading" button.
     - Anomaly Injection selector (Elevated HR, Low SpO2, High Temperature) with instant alert generation and toast notifications!
   - Real-time Alerts list with one-click **Acknowledge** and **Resolve** workflow.
   - Sleep 7-night bar chart and Radiation Dose progress gauge.

4. **Physiological Telemetry Health Monitoring**:
   - 6 System consoles: **Cardiovascular**, **Oxygen (SpO₂)**, **Temperature**, **Physical Activity**, **Sleep**, and **Radiation Exposure**.
   - Time-range filters: `24 Hours`, `7 Days`, `30 Days`, and `Custom`.
   - Comprehensive night-by-night sleep data table with guideline compliance highlights.

5. **Manual Telemetry Entry & Offline Sync**:
   - Form for recording manual astronaut vital signs and wellness data.
   - Real-time rule evaluation (fires alerts if values exceed mission thresholds).
   - LocalStorage offline queue that stores entries when disconnected and automatically synchronizes when connectivity is restored.
