import "dotenv/config";
import { randomUUID } from "crypto";
import { connectDatabase } from "../config/db";
import Astronaut from "../models/Astronaut";
import Telemetry from "../models/Telemetry";

async function main() {
  await connectDatabase();
  const astronautId = "HLX-07";
  await Astronaut.updateOne(
    { astronautId },
    { $set: { name: "Dr. Mira Okonkwo-Lind", age: 39, missionId: "HELIX-EXPEDITION-7", status: "ACTIVE", notes: "Illustrative challenge demo astronaut" } },
    { upsert: true }
  );
  const existing = await Telemetry.countDocuments({ astronautId });
  if (existing >= 200) {
    console.log(`Found ${existing} existing readings for ${astronautId}; leaving them unchanged.`);
    process.exit(0);
  }
  await Telemetry.deleteMany({ astronautId, source: "demo-seed" });
  const now = Date.now();
  const rows = Array.from({ length: 223 }, (_, i) => {
    const day = i / 32;
    const recordedAt = new Date(now - (222 - i) * 45 * 60 * 1000);
    const pulse = 70 + 8 * Math.sin(i * .58) + 5 * Math.sin(i * 1.7) + (i % 29 === 3 ? 48 : 0);
    const radiationDaily = Number((.52 + .08 * Math.sin(i * .18) + (i % 47 === 0 ? .18 : 0)).toFixed(2));
    return {
      astronautId,
      heartRate: Math.max(48, Math.min(145, Math.round(pulse))),
      spo2: Number((97.8 + 1.0 * Math.sin(i * 1.4) + .35 * Math.sin(i * .31)).toFixed(1)),
      temperature: Number((36.65 + .18 * Math.sin(i * .42) + .08 * Math.sin(i * 1.4)).toFixed(2)),
      systolic: Math.round(116 + 8 * Math.sin(i * .83) + 5 * Math.sin(i * 1.9)),
      diastolic: Math.round(74 + 4 * Math.sin(i * .7) + 3 * Math.sin(i * 1.6)),
      activityAerobic: Math.round(45 + 22 * Math.abs(Math.sin(day * 1.4))),
      activityResistance: Math.round(30 + 18 * Math.abs(Math.cos(day * 1.1))),
      sleepHours: Number((6.5 + 1.1 * Math.sin(day * 1.3)).toFixed(1)),
      sleepQuality: Math.round(76 + 12 * Math.sin(day * .9)),
      bedtime: "22:15",
      wakeTime: "05:30",
      radiationDaily,
      radiationCumulative: Number((51.2 + (i / 222) * 5.9).toFixed(2)),
      source: "demo-seed",
      recordedAt,
      clientRecordId: randomUUID(),
      syncedFromOffline: false
    };
  });
  await Telemetry.insertMany(rows);
  console.log(`Seeded ${rows.length} illustrative telemetry readings for ${astronautId}.`);
  console.log("All generated readings are demo data, not real astronaut measurements.");
  process.exit(0);
}
main().catch(error => { console.error(error); process.exit(1); });
