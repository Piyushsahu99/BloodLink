import mongoose from "mongoose";

const stemCellDonorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone: { type: String },
    city: { type: String },
    age: { type: Number, min: 18, max: 60 },
    bloodGroup: { type: String },
    availability: { type: String },
    experience: { type: String },
    medicalHistory: { type: String },
    consent: { type: Boolean, required: true },
    preferredContactTime: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("StemCellDonor", stemCellDonorSchema);
