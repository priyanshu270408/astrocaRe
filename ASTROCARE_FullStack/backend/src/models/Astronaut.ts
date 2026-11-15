import mongoose, { Schema, Document } from "mongoose";

export interface IAstronaut extends Document {
  astronautId: string;
  name: string;
  age: number;
  missionId: string;
  status: "ACTIVE" | "STANDBY" | "INACTIVE";
  notes?: string;
}

const schema = new Schema<IAstronaut>({
  astronautId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 18, max: 100 },
  missionId: { type: String, required: true, trim: true },
  status: { type: String, enum: ["ACTIVE", "STANDBY", "INACTIVE"], default: "ACTIVE" },
  notes: String
}, { timestamps: true });

export default mongoose.model<IAstronaut>("Astronaut", schema);
