import express from "express";
import User from "../models/User.js";
import { isMockDataEnabled } from "../config/db.js";
import { donors as mockDonors } from "../mockData.js";

const router = express.Router();

const maskPhoneNumber = (phone) => {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "Contact shared after verification";
  }

  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-2);
  const maskedMiddle = "*".repeat(Math.max(digits.length - 5, 3));

  return `${prefix}${maskedMiddle}${suffix}`;
};

const sanitizeDonor = (donor) => {
  if (!donor) {
    return null;
  }

  const raw = donor.toObject ? donor.toObject() : donor;
  const data = { ...raw };
  data.maskedPhone = maskPhoneNumber(data.phone);
  if (typeof data.name === "string") {
    data.name = data.name.trim();
  }
  if (typeof data.city === "string") {
    data.city = data.city.trim();
  }
  if (data.updatedAt instanceof Date) {
    data.updatedAt = data.updatedAt.toISOString();
  }
  if (!data.updatedAt) {
    data.updatedAt = new Date().toISOString();
  }
  delete data.phone;
  delete data.password;
  delete data.email;
  delete data.medicalRecords;
  delete data.donationHistory;
  delete data.__v;
  return data;
};

const maskNameForPublicView = (name = "") => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Registered Donor";
  }

  const segments = trimmed.split(/\s+/);
  if (segments.length === 1) {
    return `${segments[0].charAt(0).toUpperCase()}***`;
  }

  const [first, second] = segments;
  return `${first} ${second.charAt(0).toUpperCase()}.`;
};

const resolveEligibility = (donor) => {
  const records = donor?.medicalRecords || [];
  const latestRecord = records[records.length - 1];
  const donationHistory = donor?.donationHistory || [];
  const lastDonation = donationHistory[donationHistory.length - 1];

  return {
    eligible: latestRecord ? latestRecord.eligibleForDonation !== false : true,
    lastDonationDate: lastDonation?.date || latestRecord?.lastDonationDate || null,
  };
};

const buildMockDonorRecords = () =>
  mockDonors.map((donor) => ({
    ...donor,
    updatedAt: donor.updatedAt || new Date().toISOString(),
    createdAt: donor.createdAt || new Date().toISOString(),
    isDonor: donor.isDonor ?? true,
  }));

const buildAvailabilitySnapshot = (donorList) => {
  const summaryMap = new Map();
  const cityMap = new Map();
  let eligibleDonors = 0;

  const spotlight = donorList
    .map((donor) => {
      const { eligible, lastDonationDate } = resolveEligibility(donor);
      if (eligible) {
        eligibleDonors += 1;
      }

      const bloodKey = donor.bloodGroup || "Unknown";
      if (!summaryMap.has(bloodKey)) {
        summaryMap.set(bloodKey, { total: 0, eligible: 0 });
      }
      const bloodEntry = summaryMap.get(bloodKey);
      bloodEntry.total += 1;
      if (eligible) {
        bloodEntry.eligible += 1;
      }

      const cityKey = donor.city?.trim() || "Unlisted";
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, { total: 0, eligible: 0 });
      }
      const cityEntry = cityMap.get(cityKey);
      cityEntry.total += 1;
      if (eligible) {
        cityEntry.eligible += 1;
      }

      const donorId = typeof donor._id === "object" && donor._id !== null && "toString" in donor._id
        ? donor._id.toString()
        : donor._id;

      return {
        id: donorId,
        name: maskNameForPublicView(donor.name),
        city: cityKey,
        bloodGroup: donor.bloodGroup || "N/A",
        eligible,
        lastDonationDate,
        updatedAt: donor.updatedAt || donor.createdAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 12);

  const bloodGroups = Array.from(summaryMap.entries())
    .map(([bloodGroup, counts]) => ({ bloodGroup, ...counts }))
    .sort((a, b) => b.total - a.total);

  const cities = Array.from(cityMap.entries())
    .map(([city, counts]) => ({ city, ...counts }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalDonors: donorList.length,
    eligibleDonors,
    bloodGroups,
    cities,
    spotlight,
  };
};

// GET /api/donors → list all donors
router.get("/", async (req, res) => {
  const fallbackDonors = buildMockDonorRecords();
  if (isMockDataEnabled()) {
    return res.json(fallbackDonors.map(sanitizeDonor));
  }

  try {
    const donors = await User.find({ isDonor: true })
      .select("name bloodGroup city phone updatedAt createdAt")
      .lean();

    if (!donors.length) {
      console.warn("No donors found in MongoDB. Returning mock donor dataset.");
      return res.json(fallbackDonors.map(sanitizeDonor));
    }

    const sanitized = donors.map(sanitizeDonor);
    res.json(sanitized);
  } catch (error) {
    console.error("Failed to fetch donors from MongoDB. Serving mock donor data.", error);
    res.json(fallbackDonors.map(sanitizeDonor));
  }
});

router.get("/availability", async (_req, res) => {
  const fallbackDonors = buildMockDonorRecords();
  if (isMockDataEnabled()) {
    return res.json(buildAvailabilitySnapshot(fallbackDonors));
  }

  try {
    const donors = await User.find({ isDonor: true })
      .select("name bloodGroup city medicalRecords donationHistory updatedAt createdAt")
      .lean();

    if (!donors.length) {
      console.warn("No donor availability data found in MongoDB. Returning mock donor snapshot.");
      return res.json(buildAvailabilitySnapshot(fallbackDonors));
    }

    res.json(buildAvailabilitySnapshot(donors));
  } catch (error) {
    console.error("Failed to build availability snapshot from MongoDB. Serving mock donor availability.", error);
    res.json(buildAvailabilitySnapshot(fallbackDonors));
  }
});

// POST /api/donors → add a donor
router.post("/", async (req, res) => {
  try {
    const { name, email, bloodGroup, city } = req.body;
    if (!name || !email || !bloodGroup || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.isDonor = true;
      existingUser.bloodGroup = bloodGroup;
      existingUser.city = city;
      await existingUser.save();
      return res.status(200).json(sanitizeDonor(existingUser));
    }

    const newDonor = new User({
      name,
      email,
      bloodGroup,
      city,
      isDonor: true,
      role: "donor",
      password: "default_password"
    });

    await newDonor.save();

    res.status(201).json(sanitizeDonor(newDonor));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;