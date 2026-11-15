import Alert from "../models/Alert";
import { ITelemetry } from "../models/Telemetry";
import { emitEvent } from "../config/socket";
import { sendAlertEmail } from "./emailService";

/**
 * Demonstration guardrails only, NOT clinical or flight-certified thresholds.
 * Replace with mission-approved limits and clinician/flight-surgeon review.
 */
const RULES = [
  { key: "heartRate", type: "HIGH_HEART_RATE", warning: 110, critical: 140, direction: "high", suggestion: "Repeat the measurement after a brief rest, check activity context, and notify the mission medical officer if it remains elevated." },
  { key: "heartRate", type: "LOW_HEART_RATE", warning: 50, critical: 40, direction: "low", suggestion: "Confirm the sensor fit and repeat the reading. Escalate persistent low readings or symptoms to the mission medical officer." },
  { key: "spo2", type: "LOW_SPO2", warning: 94, critical: 90, direction: "low", suggestion: "Check sensor placement and repeat the measurement. Follow the mission medical protocol for persistent low oxygen readings." },
  { key: "temperature", type: "HIGH_TEMPERATURE", warning: 38, critical: 39, direction: "high", suggestion: "Repeat the temperature check with a verified device and request medical review if elevated readings persist." }
] as const;

export async function evaluateTelemetry(record: ITelemetry): Promise<void> {
  for (const rule of RULES) {
    const value = record[rule.key] as number;
    const crossed = rule.direction === "high"
      ? value >= rule.warning
      : value <= rule.warning;
    if (!crossed) continue;

    const critical = rule.direction === "high"
      ? value >= rule.critical
      : value <= rule.critical;
    const severity = critical ? "CRITICAL" : "WARNING";
    const message = `${rule.type.replaceAll("_", " ")}: received value ${value}`;

    // Avoid opening a duplicate alert of the same type for every telemetry sample.
    const existing = await Alert.findOne({
      astronautId: record.astronautId,
      type: rule.type,
      status: { $in: ["OPEN", "ACKNOWLEDGED"] }
    });
    if (existing) {
      existing.value = value;
      existing.severity = severity;
      existing.message = message;
      existing.suggestion = rule.suggestion;
      await existing.save();
      emitEvent("alert:updated", existing);
    } else {
      const alert = await Alert.create({
        astronautId: record.astronautId,
        type: rule.type,
        severity,
        message,
        suggestion: rule.suggestion,
        value,
        triggeredAt: record.recordedAt
      });
      emitEvent("alert:new", alert);
      // Email notification is asynchronous and must not block telemetry ingestion.
      void sendAlertEmail(alert).catch(error => console.error("Alert email could not be sent:", error));
    }
  }
}
