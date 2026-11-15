import { Router } from "express";
import { z } from "zod";
import Astronaut from "../models/Astronaut";
import Telemetry from "../models/Telemetry";
import { authenticate } from "../middleware/auth";
import { evaluateTelemetry } from "../services/alertService";
import { emitEvent } from "../config/socket";

const router = Router();

// Read-only demo telemetry endpoint. Write/sync endpoints below still require JWT auth.
router.get("/demo/:astronautId", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 223, 1), 1000);
    const records = await Telemetry.find({ astronautId: req.params.astronautId.toUpperCase() })
      .sort({ recordedAt: -1 }).limit(limit).lean();
    if (!records.length) return res.status(404).json({ message: "No telemetry found. Run npm run seed:demo in the backend." });
    const chronological = records.reverse();
    const start = chronological[0].recordedAt;
    const readings = chronological.map((r, i) => ({
      ...r,
      i: Math.round(i * 111 / Math.max(chronological.length - 1, 1)),
      day: new Date(r.recordedAt).toISOString().slice(5, 10),
      hr: r.heartRate,
      sys: r.systolic ?? 118,
      dia: r.diastolic ?? 75,
      spo2: r.spo2,
      temp: r.temperature
    }));
    return res.json({ astronautId: req.params.astronautId.toUpperCase(), mode: "DATABASE", count: readings.length, from: start, to: chronological[chronological.length - 1].recordedAt, readings });
  } catch (err) { next(err); }
});

router.use(authenticate);

const readingSchema = z.object({
  astronautId: z.string().min(2),
  heartRate: z.number().min(20).max(250),
  spo2: z.number().min(50).max(100),
  temperature: z.number().min(25).max(45),
  systolic: z.number().min(50).max(250).optional(),
  diastolic: z.number().min(30).max(150).optional(),
  source: z.string().max(50).optional(),
  recordedAt: z.string().datetime().optional(),
  clientRecordId: z.string().min(8).max(100),
  activityAerobic: z.number().min(0).max(300).optional(),
  activityResistance: z.number().min(0).max(300).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().min(0).max(100).optional(),
  bedtime: z.string().optional(),
  wakeTime: z.string().optional(),
  radiationDaily: z.number().min(0).optional(),
  radiationCumulative: z.number().min(0).optional()
});

async function saveReading(input: z.infer<typeof readingSchema>, offline: boolean, enteredBy?: string) {
  const astronautId = input.astronautId.toUpperCase();
  const astronaut = await Astronaut.findOne({ astronautId, status: "ACTIVE" });
  if (!astronaut) throw new Error(`Active astronaut ${astronautId} not found`);

  const record = await Telemetry.findOneAndUpdate(
    { clientRecordId: input.clientRecordId },
    {
      $setOnInsert: {
        ...input,
        enteredBy,
        astronautId,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        receivedAt: new Date(),
        syncedFromOffline: offline
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await evaluateTelemetry(record);
  emitEvent("telemetry:new", record);
  return record;
}

router.post("/", async (req, res, next) => {
  try {
    const parsed = readingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid telemetry", errors: parsed.error.flatten() });
    const record = await saveReading(parsed.data, false, (req as any).user?.email);
    return res.status(201).json(record);
  } catch (err) { next(err); }
});

router.post("/sync", async (req, res, next) => {
  try {
    const batchSchema = z.object({ readings: z.array(readingSchema).min(1).max(500) });
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid sync batch", errors: parsed.error.flatten() });

    const results = [];
    for (const reading of parsed.data.readings) {
      try {
        const record = await saveReading(reading, true, (req as any).user?.email);
        results.push({ clientRecordId: reading.clientRecordId, success: true, recordId: record.id });
      } catch (error) {
        results.push({
          clientRecordId: reading.clientRecordId,
          success: false,
          error: error instanceof Error ? error.message : "Unable to sync"
        });
      }
    }
    return res.json({
      received: results.length,
      synced: results.filter(item => item.success).length,
      failed: results.filter(item => !item.success).length,
      results
    });
  } catch (err) { next(err); }
});

router.get("/:astronautId", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const records = await Telemetry.find({ astronautId: req.params.astronautId.toUpperCase() })
      .sort({ recordedAt: -1 }).limit(limit);
    return res.json(records);
  } catch (err) { next(err); }
});

export default router;
