import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth";
import Astronaut from "../models/Astronaut";
import Telemetry from "../models/Telemetry";
import { evaluateTelemetry } from "../services/alertService";
import { emitEvent } from "../config/socket";
import { randomUUID } from "crypto";

const router = Router();
router.post("/simulate", authenticate, allowRoles("admin", "medical"), async (req, res, next) => {
  try {
    const astronautId = String(req.body.astronautId || "ASTRO001").toUpperCase();
    const astronaut = await Astronaut.findOne({ astronautId, status: "ACTIVE" });
    if (!astronaut) return res.status(404).json({ message: "Active astronaut not found" });

    const reading = await Telemetry.create({
      astronautId,
      heartRate: Math.round(65 + Math.random() * 35),
      spo2: Math.round(95 + Math.random() * 4),
      temperature: Number((36.3 + Math.random() * 1.1).toFixed(1)),
      systolic: Math.round(110 + Math.random() * 15),
      diastolic: Math.round(70 + Math.random() * 12),
      source: "demo-simulator",
      recordedAt: new Date(),
      clientRecordId: randomUUID(),
      syncedFromOffline: false
    });
    await evaluateTelemetry(reading);
    emitEvent("telemetry:new", reading);
    return res.status(201).json(reading);
  } catch (err) { next(err); }
});
export default router;
