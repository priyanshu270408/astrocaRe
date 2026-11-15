"""
ASTROCARE - Full-Stack Space Mission Health Monitoring Backend Server
Pure Python 3 standard library implementation with zero external dependencies.
Serves the web application and provides the complete REST API.
"""

import http.server
import json
import math
import os
import re
import socketserver
import time
import urllib.parse
from datetime import datetime, timezone

PORT = int(os.environ.get("PORT", 8000))
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

# In-memory database with persistent defaults
USERS = {
    "admin@astrocare.local": {
        "id": "usr_admin",
        "name": "Dr. Mira Okonkwo-Lind",
        "email": "admin@astrocare.local",
        "role": "admin",
        "password": "AstroCare@12345"
    },
    "engineer@mission.org": {
        "id": "usr_eng",
        "name": "Flight Engineer Alex Chen",
        "email": "engineer@mission.org",
        "role": "engineer",
        "password": "Password@123"
    }
}

# Rule thresholds
RULES = [
    {"key": "heartRate", "type": "HIGH_HEART_RATE", "warning": 110, "critical": 140, "direction": "high", "suggestion": "Repeat measurement after a brief rest, check activity context, and notify mission medical officer if elevated."},
    {"key": "heartRate", "type": "LOW_HEART_RATE", "warning": 50, "critical": 40, "direction": "low", "suggestion": "Confirm sensor fit and repeat reading. Escalate persistent low readings to mission medical officer."},
    {"key": "spo2", "type": "LOW_SPO2", "warning": 94, "critical": 90, "direction": "low", "suggestion": "Check sensor placement and repeat measurement. Follow mission medical protocol for persistent low oxygen."},
    {"key": "temperature", "type": "HIGH_TEMPERATURE", "warning": 38.0, "critical": 39.0, "direction": "high", "suggestion": "Repeat temperature check with a verified device and request medical review if elevated readings persist."}
]

# Generate synthetic baseline telemetry for HLX-07 (223 readings)
def generate_seed_telemetry():
    readings = []
    now = time.time()
    for i in range(223):
        day_frac = i / 32.0
        recorded_ts = now - (222 - i) * 45 * 60
        pulse = 70 + 8 * math.sin(i * 0.58) + 5 * math.sin(i * 1.7) + (48 if i % 29 == 3 else 0)
        rad_daily = round(0.52 + 0.08 * math.sin(i * 0.18) + (0.18 if i % 47 == 0 else 0), 2)
        rec = {
            "id": f"tel_{i:04d}",
            "astronautId": "HLX-07",
            "heartRate": max(48, min(145, round(pulse))),
            "spo2": round(97.8 + 1.0 * math.sin(i * 1.4) + 0.35 * math.sin(i * 0.31), 1),
            "temperature": round(36.65 + 0.18 * math.sin(i * 0.42) + 0.08 * math.sin(i * 1.4), 2),
            "systolic": round(116 + 8 * math.sin(i * 0.83) + 5 * math.sin(i * 1.9)),
            "diastolic": round(74 + 4 * math.sin(i * 0.7) + 3 * math.sin(i * 1.6)),
            "activityAerobic": round(45 + 22 * abs(math.sin(day_frac * 1.4))),
            "activityResistance": round(30 + 18 * abs(math.cos(day_frac * 1.1))),
            "sleepHours": round(6.5 + 1.1 * math.sin(day_frac * 1.3), 1),
            "sleepQuality": round(76 + 12 * math.sin(day_frac * 0.9)),
            "bedtime": "22:15",
            "wakeTime": "05:30",
            "radiationDaily": rad_daily,
            "radiationCumulative": round(51.2 + (i / 222.0) * 5.9, 2),
            "source": "demo-seed",
            "recordedAt": datetime.fromtimestamp(recorded_ts, tz=timezone.utc).isoformat(),
            "clientRecordId": f"seed-{i}",
            "i": round(i * 111 / 222),
            "day": datetime.fromtimestamp(recorded_ts, tz=timezone.utc).strftime("%m-%d"),
            "hr": max(48, min(145, round(pulse))),
            "sys": round(116 + 8 * math.sin(i * 0.83) + 5 * math.sin(i * 1.9)),
            "dia": round(74 + 4 * math.sin(i * 0.7) + 3 * math.sin(i * 1.6)),
            "temp": round(36.65 + 0.18 * math.sin(i * 0.42) + 0.08 * math.sin(i * 1.4), 2)
        }
        readings.append(rec)
    return readings

TELEMETRY_STORE = generate_seed_telemetry()

ALERTS_STORE = [
    {
        "_id": "alt_001",
        "astronautId": "HLX-07",
        "type": "HIGH_HEART_RATE",
        "severity": "WARNING",
        "message": "HIGH HEART RATE: received value 118 bpm during rest window",
        "suggestion": "Flag for flight-surgeon review at next medical conference; repeat check.",
        "value": 118,
        "status": "OPEN",
        "triggeredAt": datetime.fromtimestamp(time.time() - 3 * 3600, tz=timezone.utc).isoformat()
    },
    {
        "_id": "alt_002",
        "astronautId": "HLX-07",
        "type": "SLEEP_DEFICIT",
        "severity": "WARNING",
        "message": "SLEEP DEFICIT: Average sleep over 5 nights is below the 6 h mission guideline.",
        "suggestion": "Review work/rest schedule; confirm sleep station lighting settings.",
        "value": 5.4,
        "status": "OPEN",
        "triggeredAt": datetime.fromtimestamp(time.time() - 10 * 3600, tz=timezone.utc).isoformat()
    },
    {
        "_id": "alt_003",
        "astronautId": "HLX-07",
        "type": "ELEVATED_SYSTOLIC",
        "severity": "LOW",
        "message": "BLOOD PRESSURE: Single reading above the configured systolic advisory (132 mmHg).",
        "suggestion": "Repeat measurement after 10 min seated rest and review trend.",
        "value": 132,
        "status": "ACKNOWLEDGED",
        "triggeredAt": datetime.fromtimestamp(time.time() - 72 * 3600, tz=timezone.utc).isoformat()
    }
]

def evaluate_reading(record):
    new_alerts = []
    for rule in RULES:
        val = record.get(rule["key"])
        if val is None:
            continue
        val = float(val)
        crossed = val >= rule["warning"] if rule["direction"] == "high" else val <= rule["warning"]
        if not crossed:
            continue
        critical = val >= rule["critical"] if rule["direction"] == "high" else val <= rule["critical"]
        severity = "CRITICAL" if critical else "WARNING"
        msg = f"{rule['type'].replace('_', ' ')}: received value {val}"

        # Check existing open/acknowledged
        existing = next((a for a in ALERTS_STORE if a["astronautId"] == record["astronautId"] and a["type"] == rule["type"] and a["status"] in ["OPEN", "ACKNOWLEDGED"]), None)
        if existing:
            existing["value"] = val
            existing["severity"] = severity
            existing["message"] = msg
            existing["suggestion"] = rule["suggestion"]
            new_alerts.append(existing)
        else:
            alert = {
                "_id": f"alt_{int(time.time()*1000)}",
                "astronautId": record["astronautId"],
                "type": rule["type"],
                "severity": severity,
                "message": msg,
                "suggestion": rule["suggestion"],
                "value": val,
                "status": "OPEN",
                "triggeredAt": datetime.now(timezone.utc).isoformat()
            }
            ALERTS_STORE.insert(0, alert)
            new_alerts.append(alert)
    return new_alerts


class AstrocareHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def _send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            return self._send_json(200, {
                "service": "ASTROCARE API",
                "status": "online",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "STANDALONE_PYTHON_ENGINE"
            })

        if path.startswith("/api/telemetry/demo/"):
            ast_id = path.split("/")[-1].upper()
            filtered = [r for r in TELEMETRY_STORE if r["astronautId"] == ast_id]
            if not filtered:
                filtered = TELEMETRY_STORE[-223:]
            return self._send_json(200, {
                "astronautId": ast_id,
                "mode": "DATABASE",
                "count": len(filtered),
                "from": filtered[0]["recordedAt"] if filtered else None,
                "to": filtered[-1]["recordedAt"] if filtered else None,
                "readings": filtered
            })

        if path == "/api/alerts":
            return self._send_json(200, ALERTS_STORE)

        if path == "/api/mission/status":
            return self._send_json(200, {
                "missionId": "HLX-07",
                "missionName": "Helix Deep Station — Expedition 7",
                "day": 105,
                "totalDays": 180,
                "status": "ACTIVE",
                "primaryAstronaut": "Dr. Mira Okonkwo-Lind",
                "riskLevel": "MODERATE"
            })

        if path == "/api/auth/me":
            return self._send_json(200, {
                "user": USERS["admin@astrocare.local"]
            })

        # Static files fallback
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            data = json.loads(body.decode("utf-8"))
        except Exception:
            data = {}

        if path == "/api/auth/login":
            email = data.get("email", "").lower().strip()
            password = data.get("password", "")
            user = USERS.get(email)
            if user and user["password"] == password:
                return self._send_json(200, {
                    "token": f"astro_jwt_{user['id']}_{int(time.time())}",
                    "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
                })
            # For demonstration, allow any valid email/password
            if email and len(password) >= 6:
                synthetic_user = {
                    "id": f"usr_{int(time.time())}",
                    "name": email.split("@")[0].replace(".", " ").title(),
                    "email": email,
                    "role": "engineer",
                    "password": password
                }
                USERS[email] = synthetic_user
                return self._send_json(200, {
                    "token": f"astro_jwt_{synthetic_user['id']}_{int(time.time())}",
                    "user": {"id": synthetic_user["id"], "name": synthetic_user["name"], "email": synthetic_user["email"], "role": synthetic_user["role"]}
                })
            return self._send_json(401, {"message": "Incorrect email or password"})

        if path == "/api/auth/register":
            name = data.get("name", "").strip() or "Engineer"
            email = data.get("email", "").lower().strip()
            password = data.get("password", "")
            if not email or len(password) < 6:
                return self._send_json(400, {"message": "Valid email and password required (minimum 6 characters)."})
            user = {
                "id": f"usr_{int(time.time())}",
                "name": name,
                "email": email,
                "role": "engineer",
                "password": password
            }
            USERS[email] = user
            return self._send_json(201, {
                "token": f"astro_jwt_{user['id']}_{int(time.time())}",
                "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
                "emailConfigured": False
            })

        if path == "/api/telemetry":
            ast_id = (data.get("astronautId") or "HLX-07").upper()
            now = datetime.now(timezone.utc).isoformat()
            record = {
                "id": f"tel_{int(time.time()*1000)}",
                "astronautId": ast_id,
                "heartRate": float(data.get("heartRate", 72)),
                "spo2": float(data.get("spo2", 98)),
                "temperature": float(data.get("temperature", 36.7)),
                "systolic": float(data.get("systolic", 118)),
                "diastolic": float(data.get("diastolic", 76)),
                "sleepHours": float(data.get("sleepHours", 7)),
                "sleepQuality": float(data.get("sleepQuality", 80)),
                "radiationDaily": float(data.get("radiationDaily", 0.3)),
                "radiationCumulative": float(data.get("radiationCumulative", 12.0)),
                "source": data.get("source", "engineer-entry"),
                "recordedAt": data.get("recordedAt") or now,
                "clientRecordId": data.get("clientRecordId") or f"client-{time.time()}",
                "i": len(TELEMETRY_STORE),
                "day": datetime.now(timezone.utc).strftime("%m-%d"),
                "hr": float(data.get("heartRate", 72)),
                "sys": float(data.get("systolic", 118)),
                "dia": float(data.get("diastolic", 76)),
                "temp": float(data.get("temperature", 36.7))
            }
            TELEMETRY_STORE.append(record)
            evaluate_reading(record)
            return self._send_json(201, record)

        if path == "/api/telemetry/sync":
            readings = data.get("readings", [])
            synced = 0
            results = []
            for r in readings:
                ast_id = (r.get("astronautId") or "HLX-07").upper()
                rec = {
                    "id": f"tel_{int(time.time()*1000)}_{synced}",
                    "astronautId": ast_id,
                    "heartRate": float(r.get("heartRate", 72)),
                    "spo2": float(r.get("spo2", 98)),
                    "temperature": float(r.get("temperature", 36.7)),
                    "systolic": float(r.get("systolic", 118)),
                    "diastolic": float(r.get("diastolic", 76)),
                    "sleepHours": float(r.get("sleepHours", 7)),
                    "sleepQuality": float(r.get("sleepQuality", 80)),
                    "radiationDaily": float(r.get("radiationDaily", 0.3)),
                    "radiationCumulative": float(r.get("radiationCumulative", 12.0)),
                    "source": "offline-sync",
                    "recordedAt": r.get("recordedAt") or datetime.now(timezone.utc).isoformat(),
                    "clientRecordId": r.get("clientRecordId"),
                    "i": len(TELEMETRY_STORE),
                    "day": datetime.now(timezone.utc).strftime("%m-%d"),
                    "hr": float(r.get("heartRate", 72)),
                    "sys": float(r.get("systolic", 118)),
                    "dia": float(r.get("diastolic", 76)),
                    "temp": float(r.get("temperature", 36.7))
                }
                TELEMETRY_STORE.append(rec)
                evaluate_reading(rec)
                synced += 1
                results.append({"clientRecordId": r.get("clientRecordId"), "success": True, "recordId": rec["id"]})
            return self._send_json(200, {
                "synced": synced,
                "failed": 0,
                "results": results
            })

        self._send_json(404, {"message": "Endpoint not found"})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        ack_match = re.match(r"^/api/alerts/([^/]+)/acknowledge$", path)
        if ack_match:
            alert_id = ack_match.group(1)
            for alert in ALERTS_STORE:
                if alert["_id"] == alert_id:
                    alert["status"] = "ACKNOWLEDGED"
                    return self._send_json(200, alert)
            return self._send_json(404, {"message": "Alert not found"})

        res_match = re.match(r"^/api/alerts/([^/]+)/resolve$", path)
        if res_match:
            alert_id = res_match.group(1)
            for alert in ALERTS_STORE:
                if alert["_id"] == alert_id:
                    alert["status"] = "RESOLVED"
                    return self._send_json(200, alert)
            return self._send_json(404, {"message": "Alert not found"})

        self._send_json(404, {"message": "Endpoint not found"})


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), AstrocareHandler) as httpd:
        print(f"================================================================")
        print(f"  ASTROCARE Full-Stack Platform is active!")
        print(f"  Web application & API: http://localhost:{PORT}")
        print(f"  API Health Check:     http://localhost:{PORT}/api/health")
        print(f"================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()
