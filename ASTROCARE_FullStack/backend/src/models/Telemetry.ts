import mongoose, { Schema, Document } from "mongoose";

export interface ITelemetry extends Document {
  astronautId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolic?: number;
  diastolic?: number;
  source: string;
  enteredBy?: string;
  recordedAt: Date;
  receivedAt: Date;
  clientRecordId: string;
  syncedFromOffline: boolean;
  activityAerobic?: number;
  activityResistance?: number;
  sleepHours?: number;
  sleepQuality?: number;
  bedtime?: string;
  wakeTime?: string;
  radiationDaily?: number;
  radiationCumulative?: number;
}

const schema = new Schema<ITelemetry>({
  astronautId: { type: String, required: true, index: true },
  heartRate: { type: Number, required: true, min: 20, max: 250 },
  spo2: { type: Number, required: true, min: 50, max: 100 },
  temperature: { type: Number, required: true, min: 25, max: 45 },
  systolic: { type: Number, min: 50, max: 250 },
  diastolic: { type: Number, min: 30, max: 150 },
  source: { type: String, default: "simulator" },
  enteredBy: { type: String, trim: true },
  recordedAt: { type: Date, required: true },
  receivedAt: { type: Date, default: Date.now },
  clientRecordId: { type: String, required: true },
  syncedFromOffline: { type: Boolean, default: false },
  activityAerobic: { type: Number, min: 0, max: 300 },
  activityResistance: { type: Number, min: 0, max: 300 },
  sleepHours: { type: Number, min: 0, max: 24 },
  sleepQuality: { type: Number, min: 0, max: 100 },
  bedtime: String,
  wakeTime: String,
  radiationDaily: { type: Number, min: 0 },
  radiationCumulative: { type: Number, min: 0 }
}, { timestamps: true });

schema.index({ astronautId: 1, recordedAt: -1 });
schema.index({ clientRecordId: 1 }, { unique: true });

export default mongoose.model<ITelemetry>("Telemetry", schema);
