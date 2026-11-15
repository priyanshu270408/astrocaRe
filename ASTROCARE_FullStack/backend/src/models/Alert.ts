import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  astronautId: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  suggestion: string;
  value: number;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  triggeredAt: Date;
  acknowledgedBy?: string;
}

const schema = new Schema<IAlert>({
  astronautId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ["INFO", "WARNING", "CRITICAL"], required: true },
  message: { type: String, required: true },
  suggestion: { type: String, default: "Review this reading with the mission medical team." },
  value: { type: Number, required: true },
  status: { type: String, enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"], default: "OPEN" },
  triggeredAt: { type: Date, default: Date.now },
  acknowledgedBy: String
}, { timestamps: true });

schema.index({ astronautId: 1, type: 1, status: 1 });
export default mongoose.model<IAlert>("Alert", schema);
