import { Router } from "express";
import Alert from "../models/Alert";
import { authenticate, AuthRequest } from "../middleware/auth";
import { emitEvent } from "../config/socket";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.astronautId) filter.astronautId = String(req.query.astronautId).toUpperCase();
    const alerts = await Alert.find(filter).sort({ triggeredAt: -1 }).limit(500);
    res.json(alerts);
  } catch (err) { next(err); }
});

router.patch("/:id/acknowledge", async (req: AuthRequest, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: "ACKNOWLEDGED", acknowledgedBy: req.user?.email },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    emitEvent("alert:updated", alert);
    return res.json(alert);
  } catch (err) { next(err); }
});

router.patch("/:id/resolve", async (_req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(_req.params.id, { status: "RESOLVED" }, { new: true });
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    emitEvent("alert:updated", alert);
    return res.json(alert);
  } catch (err) { next(err); }
});

export default router;
