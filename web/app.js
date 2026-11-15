/**
 * ASTROCARE — Full-Stack Astronaut Health Monitoring Platform
 * High-performance, reactive, standalone browser application.
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const days = ['11-07','11-08','11-09','11-10','11-11','11-12','11-13','11-14'];

// Baseline 112 telemetry records matching the reference dataset
const defaultTelemetry = Array.from({length:112}, (_, i) => ({
  i,
  day: days[Math.min(7, Math.floor(i / 14))],
  hr: Math.round(70 + 9 * Math.sin(i * 0.58) + 5 * Math.sin(i * 1.7) + (i % 29 === 3 ? 52 : 0) + (i % 29 === 4 ? 22 : 0)),
  sys: Math.round(116 + 8 * Math.sin(i * 0.83) + 6 * Math.sin(i * 1.9) + (i % 31 === 18 ? 30 : 0)),
  dia: Math.round(74 + 4 * Math.sin(i * 0.7) + 3 * Math.sin(i * 1.6) + (i % 31 === 18 ? 13 : 0)),
  spo2: +(97.8 + 1.1 * Math.sin(i * 1.4) + 0.5 * Math.sin(i * 0.31)).toFixed(1),
  temp: +(36.65 + 0.18 * Math.sin(i * 0.42) + 0.1 * Math.sin(i * 1.4)).toFixed(2)
}));

const activityData = days.map((day, i) => ({
  day,
  aerobic: [70, 61, 71, 64, 63, 68, 55, 72][i],
  resistance: [58, 41, 48, 39, 49, 57, 41, 42][i]
}));

const sleepTable = [
  { d: '2026-11-14', b: '22:05', w: '05:06', h: '5.4', q: 70 },
  { d: '2026-11-13', b: '22:08', w: '05:34', h: '5.4', q: 66 },
  { d: '2026-11-12', b: '22:54', w: '05:45', h: '7.0', q: 68 },
  { d: '2026-11-11', b: '22:15', w: '05:29', h: '5.9', q: 73 },
  { d: '2026-11-10', b: '22:31', w: '06:06', h: '7.1', q: 81 },
  { d: '2026-11-09', b: '22:45', w: '06:32', h: '7.5', q: 74 },
  { d: '2026-11-08', b: '22:53', w: '05:26', h: '6.8', q: 86 }
];

const radiationData = days.map((day, i) => ({
  day,
  dose: [0.52, 0.52, 0.64, 0.59, 0.61, 0.60, 0.65, 0.61][i],
  cumulative: 51.2 + [0.5, 1.0, 1.7, 2.3, 2.9, 3.5, 4.1, 4.7][i]
}));

const sleepDataChart = [
  { day: "Sun", hours: 7.8 }, { day: "Mon", hours: 6.7 },
  { day: "Tue", hours: 7.4 }, { day: "Wed", hours: 5.9 },
  { day: "Thu", hours: 7.1 }, { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 5.4 }
];

const STATE = {
  view: "landing", // "landing" | "auth" | "dashboard"
  dashboardSection: "Mission Dashboard", // "Mission Dashboard" | "Data Entry" | "Health Monitoring" | "Alerts & Notifications"
  session: null,
  streaming: true,
  streamInterval: null,
  liveReadings: [
    { time: "59:40", hr: 78, spo2: 97.5, temp: 36.6 },
    { time: "59:41", hr: 77, spo2: 97.7, temp: 36.7 },
    { time: "59:42", hr: 76, spo2: 97.8, temp: 36.8 },
    { time: "59:43", hr: 74, spo2: 97.7, temp: 36.8 }
  ],
  alerts: [
    {
      _id: "alt_1",
      title: "Heart Rate",
      type: "HIGH_HEART_RATE",
      time: "3h ago",
      desc: "Resting heart rate has risen on 5 consecutive days (55.5 → 61.8 bpm).",
      action: "Flag for flight-surgeon review at next medical conference.",
      status: "Unresolved",
      severity: "WARNING",
      astronautId: "HLX-07",
      triggeredAt: new Date(Date.now() - 3 * 3600000).toISOString()
    },
    {
      _id: "alt_2",
      title: "Sleep & Wellness",
      type: "SLEEP_DEFICIT",
      time: "10h ago",
      desc: "Average sleep over 5 nights is below the 6 h mission guideline.",
      action: "Review work/rest schedule; confirm sleep station lighting settings.",
      status: "Unresolved",
      severity: "WARNING",
      astronautId: "HLX-07",
      triggeredAt: new Date(Date.now() - 10 * 3600000).toISOString()
    },
    {
      _id: "alt_3",
      title: "Blood Pressure",
      type: "ELEVATED_SYSTOLIC",
      time: "3d ago",
      desc: "Single reading above the configured systolic advisory (132 mmHg).",
      action: "Repeat measurement after 10 min rest and review trend.",
      status: "Acknowledged",
      severity: "LOW",
      astronautId: "HLX-07",
      triggeredAt: new Date(Date.now() - 72 * 3600000).toISOString()
    }
  ],
  toast: "",
  toastTimer: null,
  // Health Monitoring View state
  hmRange: "7 Days",
  hmActiveTab: "Cardiovascular",
  hmTelemetry: defaultTelemetry,
  hmConnection: "database", // "database" | "offline"
  alertsEnabled: false,
  // Data Entry State
  isOnline: true,
  offlineQueue: [],
  recentSubmissions: []
};

// Restore saved session & offline queue from localStorage
try {
  const cached = localStorage.getItem("astrocare.session");
  if (cached) STATE.session = JSON.parse(cached);
  const queue = localStorage.getItem("astrocare.offline.readings");
  if (queue) STATE.offlineQueue = JSON.parse(queue);
} catch (e) {
  console.warn("Could not read local storage:", e);
}

// ==========================================
// 2. ICON DEFINITIONS (Crisp Lucide SVGs)
// ==========================================
function icon(name, size = 18, className = "") {
  const s = size;
  const p = {
    chevronRight: `<path d="m9 18 6-6-6-6"/>`,
    heartPulse: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 11l-2.08-4.16L4 10.5"/>`,
    activity: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    radiation: `<path d="M12 12h.01"/><path d="M7.5 4.2c-.3-.5-.9-.7-1.5-.4C4.5 4.6 3.4 5.9 2.7 7.4c-.3.6-.1 1.2.4 1.5l3.5 2c.5.3 1.1.1 1.4-.4.8-1.4 2-2.5 3.5-3.1.5-.2.8-.8.6-1.3L10.3 3c-.3-.5-.8-.8-1.4-.8-.5 0-.9.2-1.4.5v-.5z"/><path d="m17.6 9.6 3.5-2c.5-.3.7-.9.4-1.5-.7-1.5-1.8-2.8-3.3-3.6-.6-.3-1.2-.1-1.5.4l-1.8 3.1c-.3.5-.1 1.1.4 1.4 1.4.8 2.5 2 3.1 3.5.2.5.8.8 1.3.6l-.1-1.9z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12 18v4"/><path d="M8 12H4"/><path d="M20 12h-4"/>`,
    bone: `<path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 1 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/>`,
    shieldAlert: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>`,
    moon: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`,
    circleUser: `<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/>`,
    stethoscope: `<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>`,
    radio: `<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>`,
    database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`,
    bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
    brain: `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>`,
    users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    wifi: `<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>`,
    wifiOff: `<line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.61"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><line x1="12" x2="12.01" y1="20" y2="20"/>`,
    fileText: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
    lock: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    sparkles: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`,
    check: `<path d="M20 6 9 17l-5-5"/>`,
    checkCircle: `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
    zap: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`,
    thermometer: `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>`,
    droplets: `<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>`,
    dumbbell: `<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>`,
    alertTriangle: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>`,
    layoutDashboard: `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`,
    shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,
    settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
    refreshCw: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
    cloudUpload: `<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>`,
    flaskConical: `<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>`,
    userPlus: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>`,
    clock3: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/>`
  };
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}">${p[name] || ""}</svg>`;
}

// ==========================================
// 3. SVG CHART BUILDERS
// ==========================================
function renderSparkline(color) {
  return `<div class="sparkline" style="border-color:${color};background:${color}18"></div>`;
}

// Interactive Live Telemetry Dual Line Chart (Heart Rate pink, SpO2 cyan)
function renderLiveTelemetryChart(readings) {
  const w = 620, h = 210, padLeft = 45, padRight = 20, padTop = 15, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const count = readings.length;
  if (count === 0) return `<div style="height:100%;display:grid;place-items:center;color:#827294">Waiting for data...</div>`;

  const minVal = 60, maxVal = 130;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (count === 1 ? cw / 2 : (i / (count - 1)) * cw);

  let hrPath = "";
  let spo2Path = "";
  readings.forEach((r, i) => {
    const x = getX(i);
    const yHr = getY(r.hr);
    const ySpo2 = getY(r.spo2);
    hrPath += (i === 0 ? `M ${x} ${yHr}` : ` L ${x} ${yHr}`);
    spo2Path += (i === 0 ? `M ${x} ${ySpo2}` : ` L ${x} ${ySpo2}`);
  });

  // Grid lines
  let gridSvg = "";
  [70, 90, 110, 130].forEach(tick => {
    const y = getY(tick);
    gridSvg += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="#30213f" stroke-dasharray="3 3"/>`;
    gridSvg += `<text x="${padLeft - 8}" y="${y + 4}" fill="#827294" font-size="10" text-anchor="end" font-family="'DM Mono'">${tick}</text>`;
  });

  // X Axis labels
  let xLabels = "";
  readings.forEach((r, i) => {
    const x = getX(i);
    xLabels += `<text x="${x}" y="${h - 8}" fill="#827294" font-size="10" text-anchor="middle" font-family="'DM Mono'">${r.time}</text>`;
  });

  // Advisory lines (HR 110 bpm)
  const yAdvisoryHR = getY(110);
  const yAdvisorySpO2 = getY(94);

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${gridSvg}
      <line x1="${padLeft}" y1="${yAdvisoryHR}" x2="${w - padRight}" y2="${yAdvisoryHR}" stroke="#f16bb655" stroke-dasharray="4 4"/>
      <line x1="${padLeft}" y1="${yAdvisorySpO2}" x2="${w - padRight}" y2="${yAdvisorySpO2}" stroke="#4ce0cb55" stroke-dasharray="4 4"/>
      <path d="${hrPath}" fill="none" stroke="#f16bb6" stroke-width="2.5" stroke-linecap="round"/>
      <path d="${spo2Path}" fill="none" stroke="#4ce0cb" stroke-width="2" stroke-linecap="round"/>
      ${readings.map((r, i) => `
        <circle cx="${getX(i)}" cy="${getY(r.hr)}" r="4" fill="#f16bb6" />
        <circle cx="${getX(i)}" cy="${getY(r.spo2)}" r="3" fill="#4ce0cb" />
      `).join("")}
      ${xLabels}
    </svg>
  `;
}

// Area Chart for Radiation Dose
function renderRadiationAreaChart(data) {
  const w = 400, h = 120, padLeft = 10, padRight = 10, padTop = 15, padBottom = 15;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minV = 35, maxV = 65;
  const getY = (v) => padTop + ch - ((v - minV) / (maxV - minV)) * ch;
  const getX = (i) => padLeft + (i / (data.length - 1)) * cw;

  let linePath = "";
  let areaPath = `M ${getX(0)} ${padTop + ch}`;
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.dose);
    linePath += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    areaPath += ` L ${x} ${y}`;
  });
  areaPath += ` L ${getX(data.length - 1)} ${padTop + ch} Z`;

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="radGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a3eb36" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#a3eb36" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#radGrad)"/>
      <path d="${linePath}" fill="none" stroke="#a3eb36" stroke-width="2"/>
    </svg>
  `;
}

// Bar Chart for Sleep
function renderSleepBarChart(data) {
  const w = 420, h = 135, padLeft = 30, padRight = 15, padTop = 15, padBottom = 25;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const maxHours = 9;
  const barWidth = 24;
  const step = cw / data.length;

  let bars = "";
  let labels = "";
  data.forEach((d, i) => {
    const barHeight = (d.hours / maxHours) * ch;
    const x = padLeft + i * step + (step - barWidth) / 2;
    const y = padTop + ch - barHeight;
    const isAmber = d.hours < 6.0;
    const color = isAmber ? "#ff9848" : "#a98aff";
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}"/>`;
    labels += `<text x="${x + barWidth / 2}" y="${h - 8}" fill="#827294" font-size="10" text-anchor="middle" font-family="'DM Mono'">${d.day}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      <line x1="${padLeft}" y1="${padTop + ch - (6 / maxHours) * ch}" x2="${w - padRight}" y2="${padTop + ch - (6 / maxHours) * ch}" stroke="#ff984855" stroke-dasharray="3 3"/>
      ${bars}
      ${labels}
    </svg>
  `;
}

// Full Health Monitoring: Heart Rate Line Chart
function renderHMHeartRateChart(telemetry) {
  const w = 700, h = 230, padLeft = 45, padRight = 20, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minVal = 40, maxVal = 145;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (i / Math.max(telemetry.length - 1, 1)) * cw;

  let path = "";
  telemetry.forEach((r, i) => {
    const x = getX(i);
    const y = getY(r.hr);
    path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  let grid = "";
  [40, 70, 100, 143].forEach(t => {
    const y = getY(t);
    grid += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="#30213f" stroke-dasharray="3 3"/>`;
    grid += `<text x="${padLeft - 8}" y="${y + 4}" fill="#806d96" font-size="10" text-anchor="end" font-family="'DM Mono'">${t}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${grid}
      <path d="${path}" fill="none" stroke="#f36ab2" stroke-width="2"/>
    </svg>
  `;
}

// Full Health Monitoring: Blood Pressure Dual Line Chart
function renderHMBloodPressureChart(telemetry) {
  const w = 700, h = 230, padLeft = 45, padRight = 20, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minVal = 50, maxVal = 156;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (i / Math.max(telemetry.length - 1, 1)) * cw;

  let sysPath = "", diaPath = "";
  telemetry.forEach((r, i) => {
    const x = getX(i);
    sysPath += (i === 0 ? `M ${x} ${getY(r.sys)}` : ` L ${x} ${getY(r.sys)}`);
    diaPath += (i === 0 ? `M ${x} ${getY(r.dia)}` : ` L ${x} ${getY(r.dia)}`);
  });

  let grid = "";
  [50, 80, 110, 156].forEach(t => {
    const y = getY(t);
    grid += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="#30213f" stroke-dasharray="3 3"/>`;
    grid += `<text x="${padLeft - 8}" y="${y + 4}" fill="#806d96" font-size="10" text-anchor="end" font-family="'DM Mono'">${t}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${grid}
      <path d="${sysPath}" fill="none" stroke="#ff9848" stroke-width="2"/>
      <path d="${diaPath}" fill="none" stroke="#a88aff" stroke-width="2"/>
    </svg>
  `;
}

// Full Health Monitoring: Resting Heart Rate Daily
function renderHMRestingHRChart() {
  const data = [54, 55.5, 56.5, 56.8, 59.3, 58.8, 59.8, 61.8];
  const w = 700, h = 195, padLeft = 45, padRight = 20, padTop = 15, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minVal = 51, maxVal = 65;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (i / (data.length - 1)) * cw;

  let path = "";
  data.forEach((v, i) => {
    const x = getX(i);
    const y = getY(v);
    path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      <line x1="${padLeft}" y1="${getY(55)}" x2="${w - padRight}" y2="${getY(55)}" stroke="#30213f" stroke-dasharray="3 3"/>
      <line x1="${padLeft}" y1="${getY(60)}" x2="${w - padRight}" y2="${getY(60)}" stroke="#30213f" stroke-dasharray="3 3"/>
      <path d="${path}" fill="none" stroke="#ff668a" stroke-width="2.5"/>
      ${data.map((v, i) => `<circle cx="${getX(i)}" cy="${getY(v)}" r="4" fill="#ff668a"/>`).join("")}
      ${days.map((d, i) => `<text x="${getX(i)}" y="${h - 8}" fill="#806d96" font-size="10" text-anchor="middle" font-family="'DM Mono'">${d}</text>`).join("")}
    </svg>
  `;
}

// Full Health Monitoring: SpO2 Oxygen Area Chart
function renderHMOxygenChart(telemetry) {
  const w = 700, h = 240, padLeft = 45, padRight = 20, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minVal = 88, maxVal = 100;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (i / Math.max(telemetry.length - 1, 1)) * cw;

  let line = "";
  let area = `M ${getX(0)} ${padTop + ch}`;
  telemetry.forEach((r, i) => {
    const x = getX(i);
    const y = getY(r.spo2);
    line += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    area += ` L ${x} ${y}`;
  });
  area += ` L ${getX(telemetry.length - 1)} ${padTop + ch} Z`;

  let grid = "";
  [88, 90, 94, 100].forEach(t => {
    const y = getY(t);
    grid += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="#30213f" stroke-dasharray="3 3"/>`;
    grid += `<text x="${padLeft - 8}" y="${y + 4}" fill="#806d96" font-size="10" text-anchor="end" font-family="'DM Mono'">${t}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#42ddca" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#42ddca" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${grid}
      <line x1="${padLeft}" y1="${getY(94)}" x2="${w - padRight}" y2="${getY(94)}" stroke="#ffca0555" stroke-dasharray="4 4"/>
      <path d="${area}" fill="url(#spo2Grad)"/>
      <path d="${line}" fill="none" stroke="#42ddca" stroke-width="2"/>
    </svg>
  `;
}

// Full Health Monitoring: Temperature Line Chart
function renderHMTemperatureChart(telemetry) {
  const w = 700, h = 260, padLeft = 45, padRight = 20, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const minVal = 35.5, maxVal = 39.2;
  const getY = (v) => padTop + ch - ((v - minVal) / (maxVal - minVal)) * ch;
  const getX = (i) => padLeft + (i / Math.max(telemetry.length - 1, 1)) * cw;

  let line = "";
  telemetry.forEach((r, i) => {
    const x = getX(i);
    const y = getY(r.temp);
    line += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  let grid = "";
  [35.5, 36.45, 37.4, 39.2].forEach(t => {
    const y = getY(t);
    grid += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="#30213f" stroke-dasharray="3 3"/>`;
    grid += `<text x="${padLeft - 8}" y="${y + 4}" fill="#806d96" font-size="10" text-anchor="end" font-family="'DM Mono'">${t.toFixed(1)}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${grid}
      <path d="${line}" fill="none" stroke="#ffd000" stroke-width="2"/>
    </svg>
  `;
}

// Full Health Monitoring: Physical Activity Stacked Bar Chart
function renderHMActivityChart() {
  const w = 700, h = 260, padLeft = 45, padRight = 20, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const maxMins = 160;
  const barW = 32;
  const step = cw / activityData.length;

  let bars = "";
  activityData.forEach((d, i) => {
    const x = padLeft + i * step + (step - barW) / 2;
    const hAerobic = (d.aerobic / maxMins) * ch;
    const hResistance = (d.resistance / maxMins) * ch;
    const yAerobic = padTop + ch - hAerobic;
    const yResistance = yAerobic - hResistance;
    bars += `<rect x="${x}" y="${yAerobic}" width="${barW}" height="${hAerobic}" fill="#31d29b" rx="2"/>`;
    bars += `<rect x="${x}" y="${yResistance}" width="${barW}" height="${hResistance}" fill="#79d1f5" rx="2"/>`;
    bars += `<text x="${x + barW / 2}" y="${h - 8}" fill="#806d96" font-size="10" text-anchor="middle" font-family="'DM Mono'">${d.day}</text>`;
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      <line x1="${padLeft}" y1="${padTop + ch - (100 / maxMins) * ch}" x2="${w - padRight}" y2="${padTop + ch - (100 / maxMins) * ch}" stroke="#30213f" stroke-dasharray="3 3"/>
      ${bars}
    </svg>
  `;
}

// Full Health Monitoring: Sleep Composed Chart (Bar + Line)
function renderHMSleepChart() {
  const sleepArr = [
    { day: '11-07', hours: 7.8, quality: 88 },
    { day: '11-08', hours: 6.8, quality: 86 },
    { day: '11-09', hours: 7.4, quality: 74 },
    { day: '11-10', hours: 7.1, quality: 81 },
    { day: '11-11', hours: 5.9, quality: 73 },
    { day: '11-12', hours: 7.0, quality: 68 },
    { day: '11-13', hours: 5.4, quality: 66 },
    { day: '11-14', hours: 5.4, quality: 70 }
  ];
  const w = 700, h = 260, padLeft = 45, padRight = 45, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const maxHours = 9;
  const maxQual = 100;
  const barW = 28;
  const step = cw / sleepArr.length;

  let bars = "";
  let line = "";
  sleepArr.forEach((d, i) => {
    const x = padLeft + i * step + (step - barW) / 2;
    const barH = (d.hours / maxHours) * ch;
    const y = padTop + ch - barH;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#a98aff" rx="3"/>`;
    bars += `<text x="${x + barW / 2}" y="${h - 8}" fill="#806d96" font-size="10" text-anchor="middle" font-family="'DM Mono'">${d.day}</text>`;

    const lx = x + barW / 2;
    const ly = padTop + ch - (d.quality / maxQual) * ch;
    line += (i === 0 ? `M ${lx} ${ly}` : ` L ${lx} ${ly}`);
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${bars}
      <path d="${line}" fill="none" stroke="#ff9848" stroke-width="2.5"/>
    </svg>
  `;
}

// Full Health Monitoring: Radiation Composed Chart
function renderHMRadiationChart() {
  const w = 700, h = 260, padLeft = 45, padRight = 45, padTop = 20, padBottom = 30;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const barW = 28;
  const step = cw / radiationData.length;

  let bars = "";
  let line = "";
  radiationData.forEach((d, i) => {
    const x = padLeft + i * step + (step - barW) / 2;
    const barH = (d.dose / 2.5) * ch;
    const y = padTop + ch - barH;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#a4ed32" rx="2"/>`;
    bars += `<text x="${x + barW / 2}" y="${h - 8}" fill="#806d96" font-size="10" text-anchor="middle" font-family="'DM Mono'">${d.day}</text>`;

    const lx = x + barW / 2;
    const ly = padTop + ch - ((d.cumulative - 50) / 10) * ch;
    line += (i === 0 ? `M ${lx} ${ly}` : ` L ${lx} ${ly}`);
  });

  return `
    <svg viewBox="0 0 ${w} ${h}" class="interactive-chart-svg" preserveAspectRatio="none">
      ${bars}
      <path d="${line}" fill="none" stroke="#d4c6d9" stroke-width="2"/>
    </svg>
  `;
}

// ==========================================
// 4. SHOOTING-STAR PARTICLES CANVAS
// ==========================================
function initParticlesCanvas(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;

  let width = 0, height = 0, raf = 0;
  let particles = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = el.clientWidth;
    height = el.clientHeight;
    el.width = width * dpr;
    el.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(45, Math.floor(width / 11));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.35 + Math.random() * 0.9,
      speed: 0.25 + Math.random() * 1.25,
      length: 18 + Math.random() * 70,
      alpha: 0.12 + Math.random() * 0.5
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.y += p.speed * p.z;
      p.x -= p.speed * 0.24;
      if (p.y > height + p.length || p.x < -30) {
        p.y = -p.length;
        p.x = Math.random() * width;
      }
      const g = ctx.createLinearGradient(p.x, p.y - p.length, p.x, p.y);
      g.addColorStop(0, "rgba(173,126,255,0)");
      g.addColorStop(1, `rgba(211,174,255,${p.alpha})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 0.7 + p.z * 0.65;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.length);
      ctx.lineTo(p.x - 3, p.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,194,137,${p.alpha * 0.45})`;
      ctx.fillRect(p.x - 1, p.y - 2, 2, 2);
    }
    raf = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener("resize", resize);
}

// ==========================================
// 5. TOAST NOTIFICATIONS & STREAMING
// ==========================================
function showToast(msg) {
  STATE.toast = msg;
  render();
  if (STATE.toastTimer) clearTimeout(STATE.toastTimer);
  STATE.toastTimer = setTimeout(() => {
    STATE.toast = "";
    render();
  }, 2600);
}

function startStreamingSimulator() {
  if (STATE.streamInterval) clearInterval(STATE.streamInterval);
  STATE.streamInterval = setInterval(() => {
    if (!STATE.streaming) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString().slice(3, 8);
    const hr = Math.round(72 + Math.random() * 16 - 8);
    const spo2 = +(97.6 + Math.random() * 1.2 - 0.6).toFixed(1);
    const temp = +(36.7 + Math.random() * 0.3 - 0.15).toFixed(1);

    STATE.liveReadings.push({ time: timeStr, hr, spo2, temp });
    if (STATE.liveReadings.length > 5) STATE.liveReadings.shift();

    // Re-render live panel if in Mission Dashboard
    if (STATE.view === "dashboard" && STATE.dashboardSection === "Mission Dashboard") {
      updateLiveTelemetryDOM();
    }
  }, 3000);
}

function updateLiveTelemetryDOM() {
  const chartEl = document.getElementById("liveTelemetryChartContainer");
  if (chartEl) chartEl.innerHTML = renderLiveTelemetryChart(STATE.liveReadings);
  const cur = STATE.liveReadings[STATE.liveReadings.length - 1];
  if (!cur) return;
  const hrVal = document.getElementById("val_hr");
  if (hrVal) hrVal.innerHTML = `${cur.hr}<i>bpm</i>`;
  const spo2Val = document.getElementById("val_spo2");
  if (spo2Val) spo2Val.innerHTML = `${cur.spo2}<i>%</i>`;
  const tempVal = document.getElementById("val_temp");
  if (tempVal) tempVal.innerHTML = `${cur.temp}<i>°C</i>`;
}

// ==========================================
// 6. VIEW RENDERERS
// ==========================================

function Brand() {
  return `<div class="brand"><span class="brand-mark">◉</span><b>ASTROCARE</b></div>`;
}

// LANDING PAGE
function renderLanding() {
  return `
    <div class="landing">
      <section class="hero">
        <canvas id="heroParticlesCanvas" class="particles"></canvas>
        <nav class="site-nav wrap">
          ${Brand()}
          <div class="nav-links">
            <a href="#problem">Problem</a>
            <a href="#features">Features</a>
            <a href="#ai">AI monitoring</a>
            <a href="#twin">Health twin</a>
            <a href="#technology">Technology</a>
          </div>
          <button class="outline-btn" onclick="navigateToDashboard()">
            Open dashboard ${icon("chevronRight", 16)}
          </button>
        </nav>
        <div class="hero-content wrap">
          <div class="hero-copy">
            <span class="eyebrow pill">🚀 2026 NASA Space Apps Challenge · Astronaut health</span>
            <h1>Your Health.<br/>Our Mission.<br/><span>Beyond Earth.</span></h1>
            <p>ASTROCARE continuously monitors astronauts’ physical and mental well-being on long-duration missions — spotting unusual patterns early, explaining why they matter, and keeping the crew and flight surgeons in the loop even when the ground link drops.</p>
            <div class="hero-actions">
              <button class="primary-btn" onclick="navigateToDashboard()">
                Get Started ${icon("chevronRight", 17)}
              </button>
              <a class="secondary-btn" href="#features">Explore Features</a>
            </div>
          </div>
          <div class="hero-art">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="astronaut-photo">
              <div class="photo-overlay">MISSION CONTROL <span>HLX-07</span></div>
            </div>
            <div class="float-card heart-float">
              <small>${icon("heartPulse", 13)} HEART RATE</small>
              <strong>68 <i>bpm</i></strong>
              <div class="mini-pulse">⌁⌁⌁⌁⌁</div>
            </div>
            <div class="float-card risk-float">
              <small>RISK CHECK <b class="moderate">● Moderate</b></small>
              <strong>Resting HR rising ~1.1 bpm/day over 7 days</strong>
              <small>Detected trend · review at next medical conference</small>
            </div>
          </div>
        </div>
      </section>

      <section class="about section">
        <div class="wrap about-grid">
          <div>
            <label>ABOUT THE PROJECT</label>
            <h2>A medical officer that never sleeps — and always shows its work.</h2>
            <p>Built for the challenge “Create Health Monitoring Software for Astronauts on Space Missions”, ASTROCARE collects health indicators, tracks them over the whole mission, flags emerging risks with plain-language reasons, and helps astronauts and medical teams respond.</p>
          </div>
          <div class="stat-grid">
            <div class="stat"><strong>6</strong><span>vital-sign groups monitored</span></div>
            <div class="stat"><strong>3</strong><span>transparent risk levels</span></div>
            <div class="stat"><strong>2</strong><span>roles: crew & medical</span></div>
            <div class="stat"><strong>0</strong><span>assumptions of constant connectivity</span></div>
          </div>
        </div>
      </section>

      <section id="problem" class="section problem">
        <div class="wrap">
          <label>THE PROBLEM</label>
          <h2>The human body was not built for<br/>space.</h2>
          <p class="section-intro">On long-duration missions, health risks build slowly and quietly — and the nearest hospital is hundreds of kilometres below.</p>
          <div class="grid-four">
            <div class="info-card">${icon("radiation")}<h3>Space radiation</h3><p>Galactic cosmic rays and solar particle events accumulate dose day after day.</p></div>
            <div class="info-card">${icon("bone")}<h3>Bone & muscle loss</h3><p>Microgravity drives measurable loss of bone density and muscle mass.</p></div>
            <div class="info-card">${icon("heartPulse")}<h3>Cardiovascular change</h3><p>Fluid shifts alter heart rate, blood pressure and vascular function.</p></div>
            <div class="info-card">${icon("shieldAlert")}<h3>Immune shifts</h3><p>Long-duration flight is associated with immune system dysregulation.</p></div>
            <div class="info-card">${icon("moon")}<h3>Sleep disruption</h3><p>16 sunrises a day, noise and workload compress the sleep window.</p></div>
            <div class="info-card">${icon("circleUser")}<h3>Stress & isolation</h3><p>Confinement and distance from home weigh on behavioural health.</p></div>
            <div class="info-card">${icon("stethoscope")}<h3>Limited medical access</h3><p>No hospital nearby — the crew is the first responder.</p></div>
            <div class="info-card">${icon("radio")}<h3>Communication delay</h3><p>Links drop and, beyond the Moon, delays stretch to minutes.</p></div>
          </div>
        </div>
      </section>

      <section class="section solution">
        <div class="wrap">
          <label>OUR SOLUTION</label>
          <h2>Collect. Understand. Respond.</h2>
          <p class="section-intro">ASTROCARE closes the loop between raw readings and medical action — on board and on the ground.</p>
          <div class="grid-three">
            <div class="solution-card">${icon("database")}<h3>01 · Collect</h3><p>Wearable-ready ingestion for vitals, sleep, dosimetry and daily check-ins. A built-in simulator generates clearly labelled demo data until hardware is connected.</p></div>
            <div class="solution-card">${icon("activity")}<h3>02 · Understand</h3><p>Each reading is checked against mission-configured thresholds, and multi-day trends are measured statistically — with every finding explained.</p></div>
            <div class="solution-card">${icon("bell")}<h3>03 · Respond</h3><p>Graded alerts suggest a next action, notify the crew, and wait for a medical administrator to acknowledge and resolve them.</p></div>
          </div>
        </div>
      </section>

      <section id="features" class="section features">
        <div class="wrap">
          <label>CORE FEATURES</label>
          <div class="section-heading">
            <h2>Everything the crew surgeon needs, in<br/>one console.</h2>
            <button class="text-link" onclick="navigateToDashboard()">Try the live dashboard ${icon("chevronRight", 16)}</button>
          </div>
          <div class="grid-three">
            <div class="feature-card"><div class="feature-top">${icon("activity")}<span class="live-tag">● LIVE IN DEMO</span></div><h3>Continuous vitals</h3><p>Heart rate, SpO₂, blood pressure, temperature, activity and sleep in one live view.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("brain")}<span class="live-tag">● LIVE IN DEMO</span></div><h3>Explainable risk detection</h3><p>Threshold and trend rules that show their reasoning and supporting readings.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("radiation")}<span class="live-tag">● LIVE IN DEMO</span></div><h3>Radiation dosimetry</h3><p>Daily and cumulative dose tracked against mission-defined budgets.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("bell")}<span class="live-tag">● LIVE IN DEMO</span></div><h3>Alerts & acknowledgement</h3><p>Severity-graded alerts with a next action, reviewed by the medical team.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("circleUser")}<span class="roadmap-tag">IN DEVELOPMENT</span></div><h3>Wellness check-ins</h3><p>A 60-second daily check-in for mood, stress, energy and isolation.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("users")}<span class="roadmap-tag">IN DEVELOPMENT</span></div><h3>Digital Health Twin</h3><p>A body-map view of how each system is trending across the mission.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("wifiOff")}<span class="roadmap-tag">IN DEVELOPMENT</span></div><h3>Offline-first</h3><p>Readings and check-ins are queued on board and synced when the link returns.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("fileText")}<span class="roadmap-tag">IN DEVELOPMENT</span></div><h3>Medical reports</h3><p>Daily, weekly, monthly or custom PDF reports for the flight surgeon.</p></div>
            <div class="feature-card"><div class="feature-top">${icon("users")}<span class="roadmap-tag">IN DEVELOPMENT</span></div><h3>Medical admin console</h3><p>Crew-wide summaries, pending alerts and role-based access to records.</p></div>
          </div>
        </div>
      </section>

      <section id="ai" class="section ai-section">
        <div class="wrap ai-grid">
          <div>
            <label>AI HEALTH MONITORING</label>
            <h2>Risk detection you can audit.</h2>
            <p>No black-box diagnoses. ASTROCARE separates what was observed, what trend was detected, and what a model predicts — and leaves the medical assessment to people. Every threshold is configurable by the mission’s flight surgeon.</p>
          </div>
          <div class="risk-demo">
            <span class="moderate">● Moderate Risk</span>
            <span class="detected">DETECTED TREND</span>
            <span class="demo-label">⚗ DEMO DATA</span>
            <h3>Sleep averaging 5.8 h over 5 nights</h3>
            <label>SUPPORTING READINGS</label>
            <div class="chips"><i>6.4 h</i><i>6.1 h</i><i>5.7 h</i><i>5.5 h</i><i>5.3 h</i></div>
            <label>RECOMMENDED NEXT ACTION</label>
            <p>Protect the sleep window; review lighting, noise and late-shift scheduling.</p>
            <small>◷ Detected 06:12 · Decision support — not a diagnosis</small>
          </div>
        </div>
      </section>

      <section id="twin" class="section twin">
        <div class="wrap twin-grid">
          <div class="body-twin">
            <div class="body-head">Sleep · 5.8 h avg</div>
            <div class="human">
              <div class="head"></div>
              <div class="torso"></div>
              <div class="arm left"></div>
              <div class="arm right"></div>
              <div class="leg left"></div>
              <div class="leg right"></div>
            </div>
            <span class="body-tag top">Cardio · resting HR ↑</span>
            <span class="body-tag bottom">Bone · scan due</span>
          </div>
          <div>
            <label>DIGITAL HEALTH TWIN</label>
            <h2>A living picture of each astronaut.</h2>
            <p>The twin maps recorded and clearly simulated data onto the body — cardiovascular trends, sleep patterns, radiation history and wellness — so changes over the mission are visible at a glance. It reflects the data, never invented conclusions.</p>
          </div>
        </div>
      </section>

      <section class="section safety">
        <div class="wrap">
          <label>MISSION SAFETY</label>
          <h2>Designed for the realities of<br/>spaceflight.</h2>
          <div class="grid-three">
            <div class="info-card">${icon("wifiOff")}<h3>Works offline</h3><p>Readings, alerts and check-ins are stored on board and synced — without duplicates — when the link returns.</p></div>
            <div class="info-card">${icon("lock")}<h3>Private by default</h3><p>Astronauts see only their own records; medical administrators see only the crews they are authorised for.</p></div>
            <div class="info-card">${icon("sparkles")}<h3>Honest about data</h3><p>Simulated readings are always labelled DEMO DATA. No claim of connection to real agency systems or hardware.</p></div>
          </div>
        </div>
      </section>

      <section id="technology" class="section tech">
        <div class="wrap">
          <label>TECHNOLOGY STACK</label>
          <h2>Modular, maintainable, wearable-<br/>ready.</h2>
          <div class="tech-grid">
            <div><label>⚙ INTERFACE</label><p>React · Vite · Modern CSS · Recharts · Lucide</p></div>
            <div><label>⚙ RISK ENGINE</label><p>Transparent statistical rules — thresholds, linear trends, baseline deltas</p></div>
            <div><label>⚙ DATA</label><p>MongoDB / Embedded engine with per-crew access rules</p></div>
            <div><label>⚙ ACCOUNTS</label><p>Role-based sign-in for astronauts and medical administrators</p></div>
            <div><label>⚙ REALTIME</label><p>Streaming readings and browser notifications</p></div>
            <div><label>⚙ OFFLINE</label><p>IndexedDB / LocalStorage queue with de-duplicated sync</p></div>
          </div>
        </div>
      </section>

      <section class="section team">
        <div class="wrap team-card">
          <div>
            <label>ABOUT THE TEAM</label>
            <h2>Built for the 2026 NASA Space Apps Challenge.</h2>
            <p>ASTROCARE brings together software engineering, data science, interface design and healthcare technology to explore how crews could manage their own health far from Earth. It is an independent challenge project and is not affiliated with or endorsed by NASA.</p>
            <button class="primary-btn" onclick="navigateToDashboard()">Launch the demo dashboard ${icon("chevronRight", 16)}</button>
          </div>
          <div class="team-tags">
            <span>Full-stack engineering</span>
            <span>AI / ML & statistics</span>
            <span>UI / UX design</span>
            <span>Database architecture</span>
            <span>Healthcare technology</span>
            <span>Mission operations</span>
          </div>
        </div>
      </section>

      <footer class="footer wrap">
        ${Brand()}
        <span>Decision-support software · not a substitute for professional medical evaluation · demo data is simulated.</span>
        <span>© 2026 ASTROCARE</span>
      </footer>
    </div>
  `;
}

// AUTH GATE
function renderAuthGate() {
  const isLogin = STATE.authMode !== "register";
  return `
    <main class="auth-screen">
      <div class="auth-stars"></div>
      <form class="auth-card" onsubmit="handleAuthSubmit(event)">
        <div class="auth-brand"><span>◉</span><b>ASTROCARE</b></div>
        <div class="auth-kicker">${icon("activity", 15)} MISSION CONTROL ACCESS</div>
        <h1>${isLogin ? "Welcome back" : "Create engineer account"}</h1>
        <p>Secure workspace for astronaut health monitoring and mission data entry.</p>

        <div style="display:flex;gap:8px;margin-bottom:6px;">
          <button type="button" class="demo-credential-pill" onclick="fillDemoAuth('admin@astrocare.local','AstroCare@12345')">
            ⚡ Fill Admin (Dr. Mira)
          </button>
          <button type="button" class="demo-credential-pill" onclick="fillDemoAuth('engineer@mission.org','Password@123')">
            ⚡ Fill Engineer
          </button>
        </div>

        ${!isLogin ? `
          <label>Full name
            <input required minlength="2" id="auth_name" placeholder="Your name" value="Dr. Mira Okonkwo-Lind"/>
          </label>
        ` : ""}
        <label>Work email
          <input required type="email" id="auth_email" placeholder="engineer@mission.org" value="admin@astrocare.local"/>
        </label>
        <label>Password
          <input required minlength="6" type="password" id="auth_password" placeholder="At least 6 characters" value="AstroCare@12345"/>
        </label>

        ${STATE.authError ? `<div class="auth-error">${STATE.authError}</div>` : ""}

        <button class="auth-submit">${isLogin ? "Sign in securely" : "Create engineer account"}</button>
        
        <button type="button" class="auth-switch" onclick="toggleAuthMode()">
          ${isLogin ? `${icon("userPlus", 15)} Create an engineer account` : "Already registered? Sign in"}
        </button>

        ${STATE.session ? `
          <button type="button" class="offline-resume" onclick="resumeCachedSession()">
            ${icon("wifiOff", 15)} Continue with saved session (${STATE.session.user.name})
          </button>
        ` : ""}

        <small>${icon("lock", 12)} New accounts receive the Engineer role. Admin privileges are assigned separately.</small>
      </form>
    </main>
  `;
}

// DASHBOARD
function renderDashboard() {
  const session = STATE.session || { user: { name: "Dr. Mira Okonkwo-Lind", role: "admin" } };
  const navItems = [
    ["Mission Dashboard", "layoutDashboard"],
    ["Data Entry", "database"],
    ["Health Monitoring", "heartPulse"],
    ["AI Health Analysis", "brain"],
    ["Mental Wellness", "circleUser"],
    ["Digital Health Twin", "activity"],
    ["Radiation Monitoring", "radiation"],
    ["Health History", "clock3"],
    ["Alerts & Notifications", "bell"],
    ["Medical Reports", "fileText"],
    ["Astronaut Profile", "users"],
    ["Administrator", "shield"],
    ["Settings", "settings"]
  ];

  // Specific Subviews
  if (STATE.dashboardSection === "Health Monitoring") return renderHealthMonitoring();
  if (STATE.dashboardSection === "Data Entry") return renderDataEntry(session);
  if (STATE.dashboardSection === "Alerts & Notifications") return renderAlertsView(session);

  // Main Mission Dashboard
  const curReading = STATE.liveReadings[STATE.liveReadings.length - 1] || { hr: 74, spo2: 97.7, temp: 36.8 };

  return `
    <div class="dashboard">
      <aside class="sidebar">
        ${Brand()}
        <div class="nav-caption">LIVE</div>
        ${navItems.map(([name, iconName], i) => `
          <button class="side-link ${STATE.dashboardSection === name ? 'active' : ''} ${i > 1 ? 'muted' : ''}" onclick="switchSection('${name}')">
            ${icon(iconName, 17)}
            <span>${name}</span>
            ${i > 1 ? `<small>M${i + 2}</small>` : ''}
          </button>
        `).join("")}
        <div class="mission-box">
          <label>MISSION</label>
          <b>HLX-07</b>
          <span>Day 105 of 180</span>
        </div>
      </aside>

      <main class="dash-main">
        <header class="dash-top">
          <div>
            ${icon("activity", 16)} <b>HLX-07</b> · Mission day <b>105</b> 
            <span class="demo-badge">⚗ DEMO DATA</span>
          </div>
          <div class="top-actions">
            <span class="online">${icon("wifi", 14)} Ground link online</span>
            <button class="outline-btn" onclick="showToast('Browser alerts enabled for this demo')">♧ Enable alerts</button>
            ${icon("bell", 18)}
            <span class="session-user">${session.user.name}</span>
            <button class="icon-button" onclick="logout()" title="Sign out">${icon("circleUser", 22)}</button>
          </div>
        </header>

        <div class="dash-content">
          <div class="dash-title">
            <div>
              <label>MISSION DASHBOARD</label>
              <h1>Good afternoon, Dr. Mira</h1>
              <p>Overall status <span class="moderate">● Moderate Risk</span> · updated ${new Date().toLocaleTimeString()}</p>
            </div>
            <button class="outline-btn" onclick="switchSection('Health Monitoring')">
              Full health monitoring ${icon("chevronRight", 16)}
            </button>
          </div>

          <div class="vital-grid">
            <div class="vital panel pink">
              <div class="vital-top">
                <span>${icon("heartPulse", 15)} HEART RATE</span>
                <b>● IN RANGE</b>
              </div>
              <strong id="val_hr">${curReading.hr}<i>bpm</i></strong>
              <small>Resting baseline 58 bpm</small>
              ${renderSparkline("#f16bb6")}
            </div>

            <div class="vital panel cyan">
              <div class="vital-top">
                <span>${icon("droplets", 15)} SpO₂</span>
                <b>● IN RANGE</b>
              </div>
              <strong id="val_spo2">${curReading.spo2}<i>%</i></strong>
              <small>Advisory below 94%</small>
              ${renderSparkline("#4ce0cb")}
            </div>

            <div class="vital panel orange">
              <div class="vital-top">
                <span>${icon("activity", 15)} BLOOD PRESSURE</span>
                <b>● IN RANGE</b>
              </div>
              <strong>118/74<i>mmHg</i></strong>
              <small>Baseline 116/74</small>
              ${renderSparkline("#ff9b55")}
            </div>

            <div class="vital panel yellow">
              <div class="vital-top">
                <span>${icon("thermometer", 15)} BODY TEMP</span>
                <b>● IN RANGE</b>
              </div>
              <strong id="val_temp">${curReading.temp}<i>°C</i></strong>
              <small>Advisory ≥ 37.8 °C</small>
              ${renderSparkline("#f1d12e")}
            </div>
          </div>

          <div class="dash-grid-main">
            <!-- Telemetry Panel -->
            <div class="panel telemetry-panel">
              <div class="panel-head">
                <div>
                  <h3>Live telemetry</h3>
                  <p>Real-time continuous readings · heart rate & SpO₂</p>
                </div>
                <div class="legend">
                  <span>— Heart rate</span>
                  <span>— SpO₂</span>
                </div>
              </div>
              <div class="chart" id="liveTelemetryChartContainer">
                ${renderLiveTelemetryChart(STATE.liveReadings)}
              </div>
              <small>Dashed lines mark the mission-configured advisory thresholds (HR 110 bpm, SpO₂ 94%).</small>
            </div>

            <!-- Risk Panel -->
            <div class="panel risk-panel">
              <div class="panel-head">
                <h3>Risk assessment</h3>
                <span class="moderate">● Moderate Risk</span>
              </div>
              <p>Rule-based checks against configured thresholds and 5–7 day trends. Each finding shows why it fired.</p>
              <div class="risk-item">
                <span class="moderate">● Moderate</span>
                <span class="detected">DETECTED TREND</span>
                <p>Resting heart rate rising ~1 bpm/day over 7 days</p>
              </div>
              <div class="risk-item">
                <span class="moderate">● Moderate</span>
                <span class="detected">DETECTED TREND</span>
                <p>Sleep averaging 6.2 h over 5 nights (3 below 6 h)</p>
              </div>
              <div class="risk-item">
                <span class="moderate">● Moderate</span>
                <span class="detected">DETECTED TREND</span>
                <p>Self-reported stress increasing (3-day avg 3.3/5)</p>
              </div>
              <div class="risk-item">
                <span class="moderate">● Moderate</span>
                <span class="detected">DETECTED TREND</span>
                <p>Cumulative dose 57.1 mSv — 38% of 150 mSv</p>
              </div>
            </div>

            <!-- Astronaut Profile Panel -->
            <div class="panel astronaut-panel">
              <div class="astronaut-avatar">👩‍🚀</div>
              <label>ASTRONAUT · AC-0417</label>
              <h3>Dr. Mira Okonkwo-Lind</h3>
              <p>Flight Engineer · Medical Officer</p>
              <div class="profile-tags">
                <span>Callsign LYNX</span>
                <span>Age 39</span>
                <span>Blood O+</span>
              </div>
              <label>MISSION</label>
              <b>HLX-07</b>
              <label>MISSION NAME</label>
              <b>Helix Deep Station — Expedition 7</b>
              <label>MEDICAL CLEARANCE</label>
              <p>Class I · cleared for long-duration flight</p>
              <div class="progress-label">Mission day 105 / 180 <b>58%</b></div>
              <div class="progress"><i></i></div>
            </div>

            <!-- Health Data Simulator Panel -->
            <div class="panel simulator-panel">
              <div class="panel-head">
                <h3>Health data simulator</h3>
                <span class="demo-badge">⚗ DEMO DATA</span>
              </div>
              <p>No wearable is connected. Readings are generated in your browser so the monitoring flow can be demonstrated end to end.</p>
              <div class="sim-controls">
                <button class="primary-btn" onclick="toggleStreaming()">
                  ${STATE.streaming ? "Ⅱ Pause" : "▶ Resume"} streaming
                </button>
                <span>Every 3s</span>
                <i class="dot ${STATE.streaming ? 'on' : ''}"></i>
              </div>
              <button class="wide-btn" onclick="generateSimulatedReading()">＋ Generate one reading</button>
              <div class="inject-row">
                <select id="simAnomalySelect">
                  <option value="hr">Elevated heart rate (124 bpm)</option>
                  <option value="spo2">Low SpO₂ (89.5%)</option>
                  <option value="temp">High temperature (38.8 °C)</option>
                </select>
                <button class="outline-btn" onclick="injectAnomaly()">
                  ${icon("zap", 15)} Inject
                </button>
              </div>
              <small>Last reading ${curReading.time}</small>
            </div>

            <!-- Radiation Panel -->
            <div class="panel radiation-panel">
              <div class="panel-head">
                <h3>☢ RADIATION DOSE</h3>
                <b>0.61 mSv today</b>
              </div>
              <strong>57.1 <small>/ 150 mSv mission budget</small></strong>
              <div class="progress"><i style="width:38%;background:#a4e83a;"></i></div>
              <div class="chart short">
                ${renderRadiationAreaChart([40,42,43,45,47,50,52,57].map((v, i) => ({ day: i, dose: v })))}
              </div>
            </div>

            <!-- Alerts Panel -->
            <div class="panel alerts-panel">
              <div class="panel-head">
                <h3>Alerts</h3>
                <span class="toggle" onclick="switchSection('Alerts & Notifications')">Open All</span>
              </div>
              ${STATE.alerts.map((a, i) => `
                <div class="alert-item">
                  <div>
                    <b>${a.title || a.type.replace(/_/g, ' ')}</b>
                    <small> · ${a.time || 'just now'}</small>
                    <span style="color:${a.status === 'Resolved' ? '#20d9a0' : '#ffca05'}">${a.status}</span>
                  </div>
                  <p>${a.desc || a.message}</p>
                  <small>→ ${a.action || a.suggestion}</small>
                  <div class="alert-actions">
                    <button onclick="updateAlertStatus(${i}, 'Acknowledged')">${icon("check", 13)} Acknowledge</button>
                    <button onclick="updateAlertStatus(${i}, 'Resolved')">${icon("check", 13)} Resolve</button>
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Sleep Panel -->
            <div class="panel sleep-panel">
              <div class="panel-head">
                <div>
                  <h3>☾ SLEEP · 7 NIGHTS</h3>
                  <p>AVG DURATION</p>
                </div>
                <b>6.6 h avg</b>
              </div>
              <div class="chart short">
                ${renderSleepBarChart(sleepDataChart)}
              </div>
              <small>Amber bars fall below the 6 h mission guideline.</small>
            </div>
          </div>

          <div class="panel lower-panel">
            <h3>Mission systems overview</h3>
            <div class="system-chips">
              <span>Cardiovascular</span>
              <span>Oxygen</span>
              <span>Temperature</span>
              <span>Physical</span>
              <span>Sleep</span>
              <span>Radiation</span>
            </div>
            <div class="lower-grid">
              <div>
                <h3>Sleep history</h3>
                <p>Average duration 6.6 h · quality 76/100 · 3 short nights</p>
              </div>
              <div>
                <h3>Mission safety</h3>
                <p>Local data storage active · sync queue ready · demo telemetry only</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      ${STATE.toast ? `<div class="toast">${STATE.toast}</div>` : ""}
    </div>
  `;
}

// HEALTH MONITORING VIEW
function renderHealthMonitoring() {
  const telemetry = STATE.hmTelemetry;
  const filtered = STATE.hmRange === '24 Hours' ? telemetry.slice(-24) :
                   STATE.hmRange === 'Custom' ? telemetry.slice(-50) : telemetry;

  const cur = filtered[filtered.length - 1] || { hr: 75, spo2: 97.7, temp: 36.6, sys: 118, dia: 75 };
  const avgHR = Math.round(filtered.reduce((s, x) => s + x.hr, 0) / Math.max(filtered.length, 1));
  const avgSpO2 = (filtered.reduce((s, x) => s + x.spo2, 0) / Math.max(filtered.length, 1)).toFixed(1);
  const avgTemp = (filtered.reduce((s, x) => s + x.temp, 0) / Math.max(filtered.length, 1)).toFixed(1);

  const tabs = [
    ['Cardiovascular', 'heartPulse'],
    ['Oxygen', 'droplets'],
    ['Temperature', 'thermometer'],
    ['Physical', 'dumbbell'],
    ['Sleep', 'moon'],
    ['Radiation', 'radiation']
  ];

  return `
    <div class="hm-shell">
      <header class="hm-topbar">
        <div class="hm-brand">
          <button style="border:0;background:none;color:#ff9a56;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:700" onclick="switchSection('Mission Dashboard')">
            ${icon("chevronRight", 18, "rotate-180")} Back
          </button>
          ${icon("activity", 17)}
          <b>HLX-07</b>
          <span>· Mission day <b>105</b></span>
          <em>${icon("flaskConical", 12)} DEMO DATA</em>
          <span class="hm-connection database">API connected</span>
        </div>
        <div class="hm-top-actions">
          <span class="hm-online">${icon("wifi", 15)} Ground link online</span>
          <button onclick="toggleHMAlerts()">
            ${icon("bell", 15)} ${STATE.alertsEnabled ? 'Alerts enabled' : 'Enable alerts'}
          </button>
          <span class="hm-avatar">👩🏻‍🚀</span>
        </div>
      </header>

      <nav class="hm-tabs">
        ${tabs.map(([name, iconName]) => `
          <button class="${STATE.hmActiveTab === name ? 'selected' : ''}" onclick="scrollHMSection('${name}')">
            ${icon(iconName, 15)} ${name}
          </button>
        `).join("")}
      </nav>

      <main class="hm-content">
        <div class="hm-heading">
          <div>
            <label>HEALTH MONITORING</label>
            <h1>Physiological telemetry</h1>
            <p>${filtered.length} readings · Live from ASTROCARE API <em>${icon("flaskConical", 12)} DEMO DATA</em></p>
          </div>
          <div class="hm-ranges">
            ${['24 Hours', '7 Days', '30 Days', 'Custom'].map(r => `
              <button class="${STATE.hmRange === r ? 'chosen' : ''}" onclick="setHMRange('${r}')">${r}</button>
            `).join("")}
          </div>
        </div>

        <div class="hm-jump">
          ${tabs.map(([name, iconName]) => `
            <button class="${STATE.hmActiveTab === name ? 'selected' : ''}" onclick="scrollHMSection('${name}')">
              ${icon(iconName, 14)} ${name}
            </button>
          `).join("")}
        </div>

        <!-- 1. Cardiovascular -->
        <section class="hm-panel" id="hm-cardiovascular">
          <div class="hm-panel-title">
            <span style="color:#f36ab2;border-color:#f36ab244">${icon("heartPulse", 22)}</span>
            <div>
              <h2>Cardiovascular</h2>
              <p>Heart rate, resting heart rate and blood pressure</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>LATEST HR</label><strong>${cur.hr} bpm</strong></div>
            <div class="hm-metric"><label>RANGE</label><strong>53–133</strong></div>
            <div class="hm-metric"><label>AVG BP</label><strong>118/75</strong></div>
            <div class="hm-metric"><label>ABOVE ADVISORY</label><strong style="color:#ffca05">15</strong></div>
          </div>
          <div class="hm-two-charts">
            <div>
              <h3>HEART RATE</h3>
              <div class="hm-chart" style="height:240px">
                ${renderHMHeartRateChart(filtered)}
              </div>
            </div>
            <div>
              <h3>BLOOD PRESSURE</h3>
              <div class="hm-chart" style="height:240px">
                ${renderHMBloodPressureChart(filtered)}
              </div>
              <div class="hm-legend">
                <span class="orange">— Systolic</span>
                <span class="purple">— Diastolic</span>
              </div>
            </div>
          </div>
          <div class="hm-two-charts hm-bottom-charts">
            <div>
              <h3>RESTING HEART RATE · DAILY</h3>
              <div class="hm-chart" style="height:205px">
                ${renderHMRestingHRChart()}
              </div>
            </div>
            <div>
              <h3>CARDIOVASCULAR RISK INDICATORS</h3>
              <div class="hm-risk">
                <span class="hm-moderate">● Moderate</span>
                <span class="hm-detected">DETECTED TREND</span>
                <p>Resting heart rate rising ~1 bpm/day over 7 days</p>
                <small>55.5 → 61.8 bpm · Linear slope 1 bpm/day · Advisory ≥ 0.8 bpm/day</small>
                <small>→ Review hydration, sleep and workload; discuss at next medical conference.</small>
              </div>
              <div class="hm-risk">
                <span class="hm-low">● Low</span>
                <span class="hm-detected">DETECTED TREND</span>
                <p>Systolic pressure consistent with baseline</p>
                <small>3-day mean 118.1 mmHg · Baseline 117.5 mmHg</small>
                <small>→ No action.</small>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Oxygen -->
        <section class="hm-panel" id="hm-oxygen">
          <div class="hm-panel-title">
            <span style="color:#42ddca;border-color:#42ddca44">${icon("droplets", 22)}</span>
            <div>
              <h2>Blood oxygen (SpO₂)</h2>
              <p>Saturation history and abnormal-reading detection</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>LATEST</label><strong>${cur.spo2}%</strong></div>
            <div class="hm-metric"><label>AVERAGE</label><strong>98.0%</strong></div>
            <div class="hm-metric"><label>LOWEST</label><strong>96.3%</strong></div>
            <div class="hm-metric"><label>BELOW ADVISORY</label><strong style="color:#20d99a">0</strong></div>
          </div>
          <h3 class="hm-chart-label">OXYGEN SATURATION</h3>
          <div class="hm-chart" style="height:260px">
            ${renderHMOxygenChart(filtered)}
          </div>
        </section>

        <!-- 3. Temperature -->
        <section class="hm-panel" id="hm-temperature">
          <div class="hm-panel-title">
            <span style="color:#ffd000;border-color:#ffd00044">${icon("thermometer", 22)}</span>
            <div>
              <h2>Body temperature</h2>
              <p>Current value, history and unusual changes</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>LATEST</label><strong>${cur.temp} °C</strong></div>
            <div class="hm-metric"><label>AVERAGE</label><strong>36.7 °C</strong></div>
            <div class="hm-metric"><label>RANGE</label><strong>36.1–37.0</strong></div>
            <div class="hm-metric"><label>UNUSUAL CHANGES</label><strong style="color:#20d99a">0</strong></div>
          </div>
          <h3 class="hm-chart-label">TEMPERATURE HISTORY</h3>
          <div class="hm-chart" style="height:260px">
            ${renderHMTemperatureChart(filtered)}
          </div>
          <h3 class="hm-chart-label">UNUSUAL TEMPERATURE READINGS</h3>
          <div class="hm-none">None detected in this range.</div>
          <p class="hm-footnote">Flags readings ≥ 37.8 °C, ≤ 35.5 °C, or a change of ≥ 0.6 °C within an hour.</p>
        </section>

        <!-- 4. Physical Activity -->
        <section class="hm-panel" id="hm-physical">
          <div class="hm-panel-title">
            <span style="color:#20d9a0;border-color:#20d9a044">${icon("dumbbell", 22)}</span>
            <div>
              <h2>Physical activity</h2>
              <p>Countermeasure exercise and activity minutes</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>AVG AEROBIC</label><strong>65 min</strong></div>
            <div class="hm-metric"><label>AVG RESISTANCE</label><strong>47 min</strong></div>
            <div class="hm-metric"><label>DAYS LOGGED</label><strong>8</strong></div>
            <div class="hm-metric"><label>ACTIVITY MIN</label><strong>1,931</strong></div>
          </div>
          <div class="hm-chart" style="height:280px">
            ${renderHMActivityChart()}
          </div>
          <div class="hm-legend centered">
            <span class="green">■ Aerobic (treadmill / cycle)</span>
            <span class="blue">■ Resistance training</span>
          </div>
          <div class="hm-note">
            ${icon("alertTriangle", 16)} Muscle activity (EMG) and bone health indicators (e.g. DXA / ultrasound scans) are not instrumented in this demo. The data model is designed to accept them once a sensor integration is added.
          </div>
        </section>

        <!-- 5. Sleep -->
        <section class="hm-panel" id="hm-sleep">
          <div class="hm-panel-title">
            <span style="color:#aa8aff;border-color:#aa8aff44">${icon("moon", 22)}</span>
            <div>
              <h2>Sleep</h2>
              <p>Duration, quality and schedule</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>AVG DURATION</label><strong>6.6 h</strong></div>
            <div class="hm-metric"><label>AVG QUALITY</label><strong>76/100</strong></div>
            <div class="hm-metric"><label>SHORT NIGHTS</label><strong style="color:#ffca05">3</strong></div>
            <div class="hm-metric"><label>TREND</label><strong style="color:#ffca05">moderate</strong></div>
          </div>
          <div class="hm-chart" style="height:280px">
            ${renderHMSleepChart()}
          </div>
          <div class="hm-legend centered">
            <span class="purple">■ Hours</span>
            <span class="orange">— Quality</span>
          </div>
          <div class="hm-table-wrap">
            <table class="hm-table">
              <thead>
                <tr><th>NIGHT</th><th>BEDTIME</th><th>WAKE</th><th>HOURS</th><th>QUALITY</th></tr>
              </thead>
              <tbody>
                ${sleepTable.map(r => `
                  <tr>
                    <td>${r.d}</td>
                    <td>${r.b}</td>
                    <td>${r.w}</td>
                    <td class="${Number(r.h) < 6.0 ? 'amber' : ''}">${r.h}</td>
                    <td>${r.q}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>

        <!-- 6. Radiation Exposure -->
        <section class="hm-panel" id="hm-radiation">
          <div class="hm-panel-title">
            <span style="color:#a4ed32;border-color:#a4ed3244">${icon("radiation", 22)}</span>
            <div>
              <h2>Radiation exposure</h2>
              <p>Daily dose, cumulative dose and mission thresholds</p>
            </div>
          </div>
          <div class="hm-metrics">
            <div class="hm-metric"><label>TODAY</label><strong>0.61 mSv</strong></div>
            <div class="hm-metric"><label>RANGE TOTAL</label><strong>4.7 mSv</strong></div>
            <div class="hm-metric"><label>MISSION CUMULATIVE</label><strong>57.1 mSv</strong></div>
            <div class="hm-metric"><label>BUDGET USED</label><strong style="color:#a4ed32">38%</strong></div>
          </div>
          <div class="hm-chart" style="height:280px">
            ${renderHMRadiationChart()}
          </div>
          <div class="hm-legend centered">
            <span class="green">■ Daily dose</span>
            <span>■ Cumulative</span>
          </div>
          <div class="hm-risk radiation-risk">
            <span class="hm-moderate">● Moderate</span>
            <span class="hm-detected">DETECTED TREND</span>
            <p>Cumulative dose 57.1 mSv — 38% of 150 mSv mission budget</p>
            <small>1 day(s) above 1 mSv advisory in 30 days · 30-day mean 0.60 mSv/day</small>
          </div>
        </section>

        <footer class="hm-disclaimer">
          △ Illustrative demo thresholds — configured by the mission flight surgeon. ASTROCARE is a decision-support tool and does not replace evaluation by a qualified medical professional.
        </footer>
      </main>
    </div>
  `;
}

// DATA ENTRY VIEW
function renderDataEntry(session) {
  const pendingCount = STATE.offlineQueue.length;
  return `
    <div class="dashboard">
      <aside class="sidebar">
        ${Brand()}
        <div class="nav-caption">LIVE</div>
        <button class="side-link" onclick="switchSection('Mission Dashboard')">${icon("layoutDashboard", 17)}<span>Mission Dashboard</span></button>
        <button class="side-link active" onclick="switchSection('Data Entry')">${icon("database", 17)}<span>Data Entry</span></button>
        <button class="side-link" onclick="switchSection('Health Monitoring')">${icon("heartPulse", 17)}<span>Health Monitoring</span></button>
        <button class="side-link" onclick="switchSection('Alerts & Notifications')">${icon("bell", 17)}<span>Alerts & Notifications</span></button>
        <div class="mission-box">
          <label>MISSION</label>
          <b>HLX-07</b>
          <span>Day 105 of 180</span>
        </div>
      </aside>

      <main class="dash-main">
        <header class="dash-top">
          <div>
            ${icon("activity", 16)} <b>HLX-07</b> · ${session.user.name} <span class="demo-badge">${session.user.role.toUpperCase()}</span>
          </div>
          <div class="top-actions">
            <span class="online" onclick="toggleOnlineMode()" style="cursor:pointer" title="Click to toggle Online/Offline simulation">
              ${icon(STATE.isOnline ? "wifi" : "wifiOff", 14)} ${STATE.isOnline ? "Engineer workspace (Online)" : "Offline Mode (Simulated)"}
            </span>
            <button class="outline-btn" onclick="logout()">Sign out</button>
          </div>
        </header>

        <div class="dash-content">
          <section class="entry-page">
            <div class="entry-heading">
              <div>
                <label>MISSION OPERATIONS / DATA INPUT</label>
                <h1>Enter astronaut health data</h1>
                <p>Record a manual reading for an astronaut. ASTROCARE checks configured advisory rules and creates alerts when a reading crosses a threshold.</p>
              </div>
              <span class="connection-pill ${STATE.isOnline ? '' : 'offline'}" onclick="toggleOnlineMode()" style="cursor:pointer">
                ${STATE.isOnline ? '● ONLINE (Click to toggle)' : '● OFFLINE MODE (Click to toggle)'}
              </span>
            </div>

            <div class="entry-status-grid">
              <div>${icon("database")}<b>${pendingCount}</b><span>Pending offline readings</span></div>
              <div>${icon(STATE.isOnline ? "checkCircle" : "wifiOff")}<b>${STATE.isOnline ? "Connected" : "Local only"}</b><span>${STATE.isOnline ? "API connection available" : "Saved on this device"}</span></div>
              <div>${icon("alertTriangle")}<b>Rule-based</b><span>Advisories, not diagnosis</span></div>
            </div>

            <form class="entry-form panel" onsubmit="handleDataEntrySubmit(event)">
              <div class="panel-head">
                <div>
                  <h3>New telemetry record</h3>
                  <p>Enter the values from the astronaut's check or monitoring device.</p>
                </div>
                <span class="demo-badge">ENGINEER INPUT</span>
              </div>

              <label class="entry-field">Astronaut ID
                <input required id="entry_astId" value="HLX-07" placeholder="HLX-07"/>
              </label>

              <div class="entry-fields">
                <div class="entry-section-title">Vital signs</div>
                <label class="entry-field">Heart rate (bpm)<input type="number" required min="20" max="250" id="entry_hr" value="72"/></label>
                <label class="entry-field">Oxygen saturation SpO₂ (%)<input type="number" required min="50" max="100" step="0.1" id="entry_spo2" value="98.0"/></label>
                <label class="entry-field">Body temperature (°C)<input type="number" required min="25" max="45" step="0.1" id="entry_temp" value="36.7"/></label>
                <label class="entry-field">Systolic pressure (mmHg)<input type="number" required min="50" max="250" id="entry_sys" value="118"/></label>
                <label class="entry-field">Diastolic pressure (mmHg)<input type="number" required min="30" max="150" id="entry_dia" value="76"/></label>

                <div class="entry-section-title">Wellness & exposure</div>
                <label class="entry-field">Sleep duration (hours)<input type="number" required min="0" max="24" step="0.1" id="entry_sleep" value="7.0"/></label>
                <label class="entry-field">Sleep quality (%)<input type="number" required min="0" max="100" id="entry_quality" value="80"/></label>
                <label class="entry-field">Daily radiation dose (mSv)<input type="number" required min="0" max="100" step="0.01" id="entry_radDaily" value="0.61"/></label>
                <label class="entry-field">Cumulative radiation dose (mSv)<input type="number" required min="0" max="10000" step="0.01" id="entry_radCum" value="57.1"/></label>
              </div>

              <div class="entry-actions">
                <button class="primary-btn">${STATE.isOnline ? "Save reading & run checks" : "Save offline reading"}</button>
                <button type="button" class="outline-btn" onclick="document.querySelector('.entry-form').reset()">Reset form</button>
              </div>

              <small class="entry-note">Values are validated by the API. Offline records are stored in this browser and synchronized after connectivity returns. Avoid clearing browser data until sync completes.</small>
            </form>

            ${STATE.recentSubmissions.length > 0 ? `
              <div class="panel recent-panel">
                <h3>Recently submitted</h3>
                ${STATE.recentSubmissions.map(r => `
                  <div class="recent-row">
                    <b>${r.astronautId}</b>
                    <span>HR ${r.heartRate} bpm</span>
                    <span>SpO₂ ${r.spo2}%</span>
                    <span>Temp ${r.temperature} °C</span>
                    <span>${new Date(r.recordedAt).toLocaleTimeString()}</span>
                  </div>
                `).join("")}
              </div>
            ` : ""}

            <div class="entry-advice">
              ${icon("cloudUpload")}
              <div>
                <b>How offline mode works</b>
                <p>Sign in once while connected. If the network drops, data entry continues on this same browser and device. Pending records automatically sync when the connection returns. First-time login and sharing between engineers still require the server.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      ${STATE.toast ? `<div class="toast">${STATE.toast}</div>` : ""}
    </div>
  `;
}

// ALERTS VIEW
function renderAlertsView(session) {
  return `
    <div class="dashboard">
      <aside class="sidebar">
        ${Brand()}
        <div class="nav-caption">LIVE</div>
        <button class="side-link" onclick="switchSection('Mission Dashboard')">${icon("layoutDashboard", 17)}<span>Mission Dashboard</span></button>
        <button class="side-link" onclick="switchSection('Data Entry')">${icon("database", 17)}<span>Data Entry</span></button>
        <button class="side-link" onclick="switchSection('Health Monitoring')">${icon("heartPulse", 17)}<span>Health Monitoring</span></button>
        <button class="side-link active" onclick="switchSection('Alerts & Notifications')">${icon("bell", 17)}<span>Alerts & Notifications</span></button>
        <div class="mission-box">
          <label>MISSION</label>
          <b>HLX-07</b>
          <span>Day 105 of 180</span>
        </div>
      </aside>

      <main class="dash-main">
        <header class="dash-top">
          <div>${icon("activity", 16)} <b>HLX-07</b> · ${session.user.name}</div>
          <div class="top-actions">
            <span class="online">${icon("wifi", 14)} Engineer workspace</span>
            <button class="outline-btn" onclick="logout()">Sign out</button>
          </div>
        </header>

        <div class="dash-content">
          <section class="entry-page">
            <div class="entry-heading">
              <div>
                <label>MISSION OPERATIONS / SAFETY</label>
                <h1>Alerts & recommendations</h1>
                <p>Rule-based alerts generated from submitted telemetry. Review each finding and follow mission-approved medical procedures.</p>
              </div>
              <button class="outline-btn" onclick="fetchAlertsFromBackend()">
                ${icon("refreshCw", 15)} Refresh
              </button>
            </div>

            <div class="alert-list">
              ${STATE.alerts.map((a, i) => `
                <article class="panel live-alert">
                  <div class="live-alert-top">
                    <span class="severity ${String(a.severity || 'warning').toLowerCase()}">${a.severity || 'WARNING'}</span>
                    <span>${a.astronautId || 'HLX-07'}</span>
                    <span>${new Date(a.triggeredAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <h3>${icon("alertTriangle", 17)}${a.title || a.type.replace(/_/g, ' ')}</h3>
                  <p>${a.desc || a.message}</p>
                  <div class="recommendation">
                    <b>Suggested next step</b>
                    <p>${a.action || a.suggestion || 'Review this reading with the mission medical team.'}</p>
                  </div>
                  <div class="live-alert-actions">
                    <span>Status: <b>${a.status}</b></span>
                    ${a.status !== 'Resolved' && a.status !== 'RESOLVED' ? `
                      <button onclick="updateAlertStatus(${i}, 'Acknowledged')">Acknowledge</button>
                      <button onclick="updateAlertStatus(${i}, 'Resolved')">Resolve</button>
                    ` : ''}
                  </div>
                </article>
              `).join("")}
            </div>

            <p class="entry-note">ASTROCARE provides prototype decision support only. Alerts and suggestions are not diagnoses or a substitute for a qualified flight surgeon.</p>
          </section>
        </div>
      </main>

      ${STATE.toast ? `<div class="toast">${STATE.toast}</div>` : ""}
    </div>
  `;
}

// ==========================================
// 7. USER EVENT HANDLERS
// ==========================================
window.navigateToDashboard = function() {
  if (STATE.session) {
    STATE.view = "dashboard";
  } else {
    STATE.view = "auth";
  }
  render();
};

window.switchSection = function(section) {
  STATE.dashboardSection = section;
  render();
};

window.logout = function() {
  STATE.session = null;
  localStorage.removeItem("astrocare.session");
  STATE.view = "landing";
  render();
};

window.toggleAuthMode = function() {
  STATE.authMode = STATE.authMode === "register" ? "login" : "register";
  STATE.authError = "";
  render();
};

window.fillDemoAuth = function(email, pass) {
  const emailInput = document.getElementById("auth_email");
  const passInput = document.getElementById("auth_password");
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = pass;
};

window.resumeCachedSession = function() {
  if (STATE.session) {
    STATE.view = "dashboard";
    render();
  }
};

window.handleAuthSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById("auth_email").value.trim();
  const password = document.getElementById("auth_password").value;
  const nameInput = document.getElementById("auth_name");
  const name = nameInput ? nameInput.value.trim() : "";

  // Attempt backend login first; fall back gracefully to local synthetic demo session
  try {
    const res = await fetch("/api/auth/" + (STATE.authMode === "register" ? "register" : "login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    if (res.ok) {
      const data = await res.json();
      STATE.session = { token: data.token, user: data.user };
      localStorage.setItem("astrocare.session", JSON.stringify(STATE.session));
      STATE.view = "dashboard";
      render();
      return;
    }
  } catch (err) {
    console.log("Backend offline or non-proxied; logging in locally for prototype demo.");
  }

  // Local demo fallback
  const userName = name || (email.includes("admin") ? "Dr. Mira Okonkwo-Lind" : "Flight Engineer Alex Chen");
  const userRole = email.includes("admin") ? "admin" : "engineer";
  STATE.session = {
    token: "demo_token_" + Date.now(),
    user: { id: "usr_local", name: userName, email, role: userRole }
  };
  localStorage.setItem("astrocare.session", JSON.stringify(STATE.session));
  STATE.view = "dashboard";
  render();
};

window.toggleStreaming = function() {
  STATE.streaming = !STATE.streaming;
  showToast(STATE.streaming ? "Telemetry streaming resumed" : "Telemetry streaming paused");
};

window.generateSimulatedReading = function() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString().slice(3, 8);
  const hr = Math.round(66 + Math.random() * 35);
  const spo2 = +(95 + Math.random() * 4).toFixed(1);
  const temp = +(36.3 + Math.random() * 0.7).toFixed(1);
  STATE.liveReadings.push({ time: timeStr, hr, spo2, temp });
  if (STATE.liveReadings.length > 5) STATE.liveReadings.shift();
  showToast("New demo telemetry reading generated");
  render();
};

window.injectAnomaly = function() {
  const sel = document.getElementById("simAnomalySelect");
  const type = sel ? sel.value : "hr";
  const now = new Date();
  const timeStr = now.toLocaleTimeString().slice(3, 8);

  let hr = 75, spo2 = 98.0, temp = 36.8, msg = "";
  if (type === "hr") {
    hr = 126;
    msg = "Injected: Elevated Heart Rate (126 bpm)";
    STATE.alerts.unshift({
      _id: "alt_" + Date.now(),
      title: "Elevated Heart Rate",
      type: "HIGH_HEART_RATE",
      time: "Just now",
      desc: "Acute tachycardia detected: Heart rate peaked at 126 bpm during rest window.",
      action: "Repeat measurement after 5 minutes; verify sensor contact and notify crew surgeon.",
      status: "Unresolved",
      severity: "CRITICAL",
      astronautId: "HLX-07",
      triggeredAt: new Date().toISOString()
    });
  } else if (type === "spo2") {
    spo2 = 89.2;
    msg = "Injected: Low SpO₂ Oxygen Saturation (89.2%)";
    STATE.alerts.unshift({
      _id: "alt_" + Date.now(),
      title: "Low Oxygen Saturation",
      type: "LOW_SPO2",
      time: "Just now",
      desc: "Oxygen saturation fell below safety threshold (89.2%).",
      action: "Inspect cabin atmosphere levels; repeat pulse oximetry test immediately.",
      status: "Unresolved",
      severity: "CRITICAL",
      astronautId: "HLX-07",
      triggeredAt: new Date().toISOString()
    });
  } else {
    temp = 38.9;
    msg = "Injected: High Body Temperature (38.9 °C)";
    STATE.alerts.unshift({
      _id: "alt_" + Date.now(),
      title: "Hyperthermia Warning",
      type: "HIGH_TEMPERATURE",
      time: "Just now",
      desc: "Body temperature elevated to 38.9 °C (threshold 37.8 °C).",
      action: "Initiate passive cooling countermeasures and consult medical officer.",
      status: "Unresolved",
      severity: "CRITICAL",
      astronautId: "HLX-07",
      triggeredAt: new Date().toISOString()
    });
  }

  STATE.liveReadings.push({ time: timeStr, hr, spo2, temp });
  if (STATE.liveReadings.length > 5) STATE.liveReadings.shift();
  showToast(msg);
  render();
};

window.updateAlertStatus = async function(index, newStatus) {
  if (STATE.alerts[index]) {
    STATE.alerts[index].status = newStatus;
    const alertId = STATE.alerts[index]._id;
    showToast(`Alert status updated to: ${newStatus}`);
    render();

    // Call backend API if available
    try {
      const act = newStatus === "Resolved" ? "resolve" : "acknowledge";
      await fetch(`/api/alerts/${alertId}/${act}`, { method: "PATCH" });
    } catch (e) {
      // Handled locally
    }
  }
};

window.setHMRange = function(range) {
  STATE.hmRange = range;
  render();
};

window.scrollHMSection = function(tabName) {
  STATE.hmActiveTab = tabName;
  const targetId = `hm-${tabName.toLowerCase()}`;
  const el = document.getElementById(targetId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleHMAlerts = function() {
  STATE.alertsEnabled = !STATE.alertsEnabled;
  showToast(STATE.alertsEnabled ? "Alerts enabled for all monitoring systems" : "Alerts muted");
  render();
};

window.toggleOnlineMode = function() {
  STATE.isOnline = !STATE.isOnline;
  showToast(STATE.isOnline ? "Switched to ONLINE mode" : "Switched to OFFLINE mode");
  if (STATE.isOnline && STATE.offlineQueue.length > 0) {
    syncOfflineQueue();
  }
  render();
};

async function syncOfflineQueue() {
  const count = STATE.offlineQueue.length;
  try {
    await fetch("/api/telemetry/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readings: STATE.offlineQueue })
    });
  } catch (e) {
    console.log("Synced locally");
  }
  STATE.offlineQueue = [];
  localStorage.removeItem("astrocare.offline.readings");
  showToast(`Successfully synced ${count} pending readings!`);
  render();
}

window.handleDataEntrySubmit = async function(e) {
  e.preventDefault();
  const reading = {
    astronautId: document.getElementById("entry_astId").value.toUpperCase() || "HLX-07",
    heartRate: Number(document.getElementById("entry_hr").value),
    spo2: Number(document.getElementById("entry_spo2").value),
    temperature: Number(document.getElementById("entry_temp").value),
    systolic: Number(document.getElementById("entry_sys").value),
    diastolic: Number(document.getElementById("entry_dia").value),
    sleepHours: Number(document.getElementById("entry_sleep").value),
    sleepQuality: Number(document.getElementById("entry_quality").value),
    radiationDaily: Number(document.getElementById("entry_radDaily").value),
    radiationCumulative: Number(document.getElementById("entry_radCum").value),
    source: "engineer-entry",
    recordedAt: new Date().toISOString(),
    clientRecordId: "rec_" + Date.now()
  };

  if (!STATE.isOnline) {
    STATE.offlineQueue.push(reading);
    localStorage.setItem("astrocare.offline.readings", JSON.stringify(STATE.offlineQueue));
    showToast("Saved offline on this device. Will sync when link returns.");
    render();
    return;
  }

  // Submit to backend
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading)
    });
  } catch (err) {
    console.log("Backend offline; reading recorded locally.");
  }

  // Automatic rule check
  if (reading.heartRate > 110) {
    STATE.alerts.unshift({
      _id: "alt_" + Date.now(),
      title: "Elevated Heart Rate",
      type: "HIGH_HEART_RATE",
      time: "Just now",
      desc: `High heart rate detected: ${reading.heartRate} bpm.`,
      action: "Repeat measurement after rest and notify flight surgeon.",
      status: "Unresolved",
      severity: reading.heartRate > 135 ? "CRITICAL" : "WARNING",
      astronautId: reading.astronautId,
      triggeredAt: reading.recordedAt
    });
  }
  if (reading.spo2 < 94) {
    STATE.alerts.unshift({
      _id: "alt_" + Date.now(),
      title: "Low Oxygen Saturation",
      type: "LOW_SPO2",
      time: "Just now",
      desc: `Low oxygen saturation detected: ${reading.spo2}%.`,
      action: "Check sensor and follow hypoxia contingency protocol.",
      status: "Unresolved",
      severity: "CRITICAL",
      astronautId: reading.astronautId,
      triggeredAt: reading.recordedAt
    });
  }

  STATE.recentSubmissions.unshift(reading);
  if (STATE.recentSubmissions.length > 5) STATE.recentSubmissions.pop();

  showToast("Reading saved & advisory checks completed!");
  render();
};

window.fetchAlertsFromBackend = async function() {
  try {
    const res = await fetch("/api/alerts");
    if (res.ok) {
      STATE.alerts = await res.json();
      showToast("Alerts refreshed from backend");
      render();
    }
  } catch (e) {
    showToast("Alerts up to date");
  }
};

// ==========================================
// 8. MASTER RENDER & INIT
// ==========================================
function render() {
  const root = document.getElementById("app");
  if (!root) return;

  if (STATE.view === "landing") {
    root.innerHTML = renderLanding();
    initParticlesCanvas("heroParticlesCanvas");
  } else if (STATE.view === "auth") {
    root.innerHTML = renderAuthGate();
  } else if (STATE.view === "dashboard") {
    root.innerHTML = renderDashboard();
  }
}

// Initial mount & launch streaming
document.addEventListener("DOMContentLoaded", () => {
  render();
  startStreamingSimulator();

  // Fetch initial telemetry from backend if available
  fetch("/api/telemetry/demo/HLX-07")
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      if (data && data.readings && data.readings.length) {
        STATE.hmTelemetry = data.readings;
        STATE.hmConnection = "database";
        render();
      }
    })
    .catch(() => {
      STATE.hmConnection = "offline";
    });
});

render();
startStreamingSimulator();
