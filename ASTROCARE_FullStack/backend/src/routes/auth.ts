import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User";
import { authenticate, AuthRequest } from "../middleware/auth";
import { sendWelcomeEmail } from "../services/emailService";

const router = Router();
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});


const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

// Self-registration creates an engineer account only. Elevated roles must be assigned by an administrator.
router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a name, valid email, and password (8+ characters)." });
    const email = parsed.data.email.toLowerCase();
    if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({ name: parsed.data.name, email, passwordHash, role: "engineer", active: true });
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"] });
    // Email is best-effort: a mail provider outage must not prevent account creation.
    try { await sendWelcomeEmail(user.name, user.email); }
    catch (mailError) { console.error("Welcome email could not be sent:", mailError); }
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid email or password format" });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), active: true });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"] }
    );
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
