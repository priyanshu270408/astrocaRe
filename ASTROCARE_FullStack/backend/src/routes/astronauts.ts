import { Router } from "express";
import { z } from "zod";
import Astronaut from "../models/Astronaut";
import { authenticate, allowRoles } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const astronautSchema = z.object({
  astronautId: z.string().min(2).max(30),
  name: z.string().min(2).max(100),
  age: z.number().int().min(18).max(100),
  missionId: z.string().min(2).max(50),
  status: z.enum(["ACTIVE", "STANDBY", "INACTIVE"]).optional(),
  notes: z.string().max(1000).optional()
});

router.get("/", async (_req, res, next) => {
  try { res.json(await Astronaut.find().sort({ createdAt: -1 })); }
  catch (err) { next(err); }
});

router.post("/", allowRoles("admin", "medical"), async (req, res, next) => {
  try {
    const parsed = astronautSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid astronaut data", errors: parsed.error.flatten() });
    const astronaut = await Astronaut.create(parsed.data);
    return res.status(201).json(astronaut);
  } catch (err) { next(err); }
});

router.get("/:astronautId", async (req, res, next) => {
  try {
    const astronaut = await Astronaut.findOne({ astronautId: req.params.astronautId.toUpperCase() });
    if (!astronaut) return res.status(404).json({ message: "Astronaut not found" });
    return res.json(astronaut);
  } catch (err) { next(err); }
});

export default router;
