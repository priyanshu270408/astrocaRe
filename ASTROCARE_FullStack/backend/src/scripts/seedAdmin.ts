import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db";
import User from "../models/User";
import Astronaut from "../models/Astronaut";

async function main() {
  await connectDatabase();
  const email = process.env.ADMIN_EMAIL || "admin@astrocare.local";
  const password = process.env.ADMIN_PASSWORD || "AstroCare@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  await User.updateOne(
    { email },
    { $set: { name: "ASTROCARE Administrator", passwordHash, role: "admin", active: true } },
    { upsert: true }
  );
  await Astronaut.updateOne(
    { astronautId: "ASTRO001" },
    { $setOnInsert: { name: "Demo Astronaut", age: 34, missionId: "MISSION-001", status: "ACTIVE" } },
    { upsert: true }
  );
  console.log(`Admin ready: ${email}`);
  console.log("Change the seeded password before using this beyond a local demo.");
  process.exit(0);
}
main().catch(error => { console.error(error); process.exit(1); });
