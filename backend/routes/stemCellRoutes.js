import express from "express";
import StemCellDonor from "../models/StemCellDonor.js";
import { isMockDataEnabled } from "../config/db.js";

const router = express.Router();

const sanitizeEntry = (entry) => {
  if (!entry) {
    return null;
  }

  const raw = entry.toObject ? entry.toObject() : entry;
  const data = { ...raw };
  delete data.phone;
  delete data.__v;
  return data;
};

const fallbackStemCellDonors = [
  {
    _id: "stem-fallback-1",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    city: "Mumbai",
    bloodGroup: "O+",
    availability: "weekends",
    experience: "First-time donor",
    consent: true,
    preferredContactTime: "Evenings",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "stem-fallback-2",
    fullName: "Diya Mehta",
    email: "diya.mehta@example.com",
    city: "Delhi",
    bloodGroup: "A-",
    availability: "weekdays",
    experience: "Registered donor",
    consent: true,
    preferredContactTime: "Mornings",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "stem-fallback-3",
    fullName: "Rehan Khan",
    email: "rehan.khan@example.com",
    city: "Bengaluru",
    bloodGroup: "B+",
    availability: "flexible",
    experience: "Volunteer",
    consent: true,
    preferredContactTime: "Afternoons",
    createdAt: new Date().toISOString(),
  },
];

const inMemoryStemCellDonors = [...fallbackStemCellDonors];

router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      age,
      bloodGroup,
      availability,
      experience,
      medicalHistory,
      consent,
      preferredContactTime
    } = req.body;

    if (!fullName || !email || consent !== true) {
      return res.status(400).json({ message: "Full name, email, and consent are required" });
    }

    if (isMockDataEnabled()) {
      const existingIndex = inMemoryStemCellDonors.findIndex((donor) => donor.email.toLowerCase() === email.toLowerCase());
      const newEntry = {
        _id: existingIndex >= 0 ? inMemoryStemCellDonors[existingIndex]._id : `stem-fallback-${Date.now()}`,
        fullName,
        email,
        phone,
        city,
        age,
        bloodGroup,
        availability,
        experience,
        medicalHistory,
        consent,
        preferredContactTime,
        updatedAt: new Date().toISOString(),
        createdAt:
          existingIndex >= 0 ? inMemoryStemCellDonors[existingIndex].createdAt : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        inMemoryStemCellDonors[existingIndex] = newEntry;
        return res.json({
          message: "Thank you! Your registration details have been updated (temporary offline mode).",
          data: sanitizeEntry(newEntry),
        });
      }

      inMemoryStemCellDonors.push(newEntry);
      return res.status(201).json({
        message: "Thank you for registering as a stem cell donor (temporary offline mode).",
        data: sanitizeEntry(newEntry),
      });
    }

    let donor = await StemCellDonor.findOne({ email });

    if (donor) {
      donor.fullName = fullName;
      donor.phone = phone;
      donor.city = city;
      donor.age = age;
      donor.bloodGroup = bloodGroup;
      donor.availability = availability;
      donor.experience = experience;
      donor.medicalHistory = medicalHistory;
      donor.consent = consent;
      donor.preferredContactTime = preferredContactTime;
      await donor.save();

      return res.json({
        message: "Thank you! Your registration details have been updated.",
        data: sanitizeEntry(donor)
      });
    }

    donor = new StemCellDonor({
      fullName,
      email,
      phone,
      city,
      age,
      bloodGroup,
      availability,
      experience,
      medicalHistory,
      consent,
      preferredContactTime
    });

    await donor.save();

    return res.status(201).json({
      message: "Thank you for registering as a stem cell donor.",
      data: sanitizeEntry(donor)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    if (isMockDataEnabled()) {
      const totalRegistered = inMemoryStemCellDonors.length;
      const cities = new Set(
        inMemoryStemCellDonors
          .map((donor) => donor.city)
          .filter((city) => typeof city === "string" && city.trim().length > 0)
      );

      return res.json({
        totalRegistered,
        activeCities: cities.size,
      });
    }

    const totalRegistered = await StemCellDonor.countDocuments();
    const cities = await StemCellDonor.distinct("city", { city: { $nin: [null, ""] } });

    res.json({
      totalRegistered,
      activeCities: cities.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
