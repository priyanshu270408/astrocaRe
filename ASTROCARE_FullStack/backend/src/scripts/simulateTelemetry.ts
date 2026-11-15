import "dotenv/config";
import { connectDatabase } from "../config/db";
import Astronaut from "../models/Astronaut";
import Telemetry from "../models/Telemetry";
import { randomUUID } from "crypto";
import { evaluateTelemetry } from "../services/alertService";

async function main() {
  await connectDatabase();
  const astronautId = process.argv[2] || "ASTRO001";
  const astronaut = await Astronaut.findOne({ astronautId, status: "ACTIVE" });
  if (!astronaut) throw new Error(`Create active astronaut ${astronautId} first`);

  console.log("Generating demo telemetry every 3 seconds. Press Ctrl+C to stop.");
  setInterval(async () => {
    try {
      const record = await Telemetry.create({
        astronautId,
        heartRate: Math.round(65 + Math.random() * 35),
        spo2: Math.round(95 + Math.random() * 4),
        temperature: Number((36.3 + Math.random() * 1.1).toFixed(1)),
        systolic: Math.round(110 + Math.random() * 15),
        diastolic: Math.round(70 + Math.random() * 12),
        source: "terminal-simulator",
        recordedAt: new Date(),
        clientRecordId: randomUUID()
      });
      await evaluateTelemetry(record);
      console.log(new Date().toISOString(), record.heartRate, record.spo2, record.temperature);
    } catch (error) { console.error(error); }
  }, 3000);
}
main().catch(error => { console.error(error); process.exit(1); });
