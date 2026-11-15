# ASTROCARE Frontend

React + TypeScript + Vite prototype recreating the supplied ASTROCARE screenshots, including a dark space-themed landing page, dashboard, interactive demo telemetry, alert acknowledgement/resolution, responsive layout and animated foreground particle streaks.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

## Particle animation

The foreground star/particle streaks are drawn with Canvas in `src/Particles.tsx`. The animation is generated locally in the browser and does not require a third-party particle service.

## Demo note

This is a frontend prototype. Dashboard values are simulated in browser state. It is not connected to a backend or real medical sensors yet. Connect the API and offline queue before using real data. The visual risk thresholds and sample readings are illustrative only.
