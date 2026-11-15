import { Router } from "express";
import { authenticate } from "../middleware/auth";
import Astronaut from "../models/Astronaut";
import Telemetry from "../models/Telemetry";
import Alert from "../models/Alert";

const router = Router();
router.use(authenticate);

router.get("/status", async (_req, res, next) => {
  try {
    const astronauts = await Astronaut.find({ status: "ACTIVE" }).lean();
    const data = await Promise.all(astronauts.map(async astronaut => {
      const [latest, openAlerts] = await Promise.all([
        Telemetry.findOne({ astronautId: astronaut.astronautId }).sort({ recordedAt: -1 }).lean(),
        Alert.countDocuments({ astronautId: astronaut.astronautId, status: { $in: ["OPEN", "ACKNOWLEDGED"] } })
      ]);
      return { astronaut, latestTelemetry: latest, openAlerts };
    }));
    res.json({
      generatedAt: new Date(),
      activeAstronauts: astronauts.length,
      astronauts: data
    });
  } catch (err) { next(err); }
});

router.get("/health", (_req, res) => {
  res.json({ status: "operational", mode: "offline-capable", timestamp: new Date() });
});

export default router;
