import express from "express";
import Campaign from "../models/Campaign.js";
import { isMockDataEnabled } from "../config/db.js";

const router = express.Router();

const baseMockCampaigns = [
  {
    _id: "campaign-fallback-1",
    title: "Citywide Lifeline Drive",
    description:
      "Partner hospitals need universal donors this weekend. Drop in, donate, and collect wellness goodies!",
    date: new Date().toISOString(),
    location: "Central Community Center",
    organizer: "Raktchain Volunteers",
    email: "volunteers@raktchain.org",
    phone: "+91 98765 43210",
    city: "Central City",
    targetDonors: 120,
    registeredDonors: 64,
    status: "upcoming",
    bloodGroupsNeeded: ["O+", "O-", "A+"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "campaign-fallback-2",
    title: "Corporate Heroes Marathon",
    description:
      "Local tech companies are teaming up to restock rare blood groups. Shuttle service available.",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    location: "Tech Park Atrium",
    organizer: "Raktchain Corporate Alliance",
    email: "partnerships@raktchain.org",
    phone: "+91 99880 77665",
    city: "Innovation Bay",
    targetDonors: 80,
    registeredDonors: 52,
    status: "upcoming",
    bloodGroupsNeeded: ["B-", "AB-"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "campaign-fallback-3",
    title: "Night Owl Donation Camp",
    description:
      "Special late-night drive for shift workers with on-site health screenings and refreshments.",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    location: "Metro Plaza",
    organizer: "City Red Cross",
    email: "events@cityredcross.org",
    phone: "+91 91234 56780",
    city: "Metroville",
    targetDonors: 150,
    registeredDonors: 97,
    status: "upcoming",
    bloodGroupsNeeded: ["All"],
    createdAt: new Date().toISOString(),
  },
];

const inMemoryCampaigns = [...baseMockCampaigns];

const applyFiltersToCampaigns = (campaigns, { status, city }) => {
  let filtered = [...campaigns];

  if (status) {
    filtered = filtered.filter((campaign) => campaign.status === status);
  }

  if (city) {
    const cityRegex = new RegExp(city, "i");
    filtered = filtered.filter((campaign) => cityRegex.test(campaign.city));
  }

  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// GET /api/campaigns → list all campaigns
router.get("/", async (req, res) => {
  try {
    const { status, city } = req.query;
    if (isMockDataEnabled()) {
      const campaigns = applyFiltersToCampaigns(inMemoryCampaigns, { status, city });
      return res.json(campaigns);
    }

    let query = {};
    
    if (status) {
      query.status = status;
    }
    if (city) {
      query.city = new RegExp(city, 'i'); // Case insensitive search
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/campaigns/:id → get single campaign
router.get("/:id", async (req, res) => {
  try {
    if (isMockDataEnabled()) {
      const campaign = inMemoryCampaigns.find((item) => item._id === req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      return res.json(campaign);
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/campaigns → create new campaign
router.post("/", async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      location, 
      organizer, 
      email, 
      phone, 
      city, 
      targetDonors, 
      bloodGroupsNeeded 
    } = req.body;

    if (!title || !description || !date || !location || !organizer || !email || !city) {
      return res.status(400).json({ 
        message: "Please provide all required fields: title, description, date, location, organizer, email, city" 
      });
    }

    if (isMockDataEnabled()) {
      const newCampaign = {
        _id: `campaign-fallback-${Date.now()}`,
        title,
        description,
        date: new Date(date).toISOString(),
        location,
        organizer,
        email,
        phone: phone || "",
        city,
        targetDonors: targetDonors || 50,
        registeredDonors: 0,
        status: "upcoming",
        bloodGroupsNeeded: bloodGroupsNeeded && bloodGroupsNeeded.length > 0 ? bloodGroupsNeeded : ["All"],
        createdAt: new Date().toISOString(),
      };

      inMemoryCampaigns.push(newCampaign);

      return res.status(201).json({ 
        message: "Campaign created successfully (temporary offline mode)!", 
        campaign: newCampaign 
      });
    }

    const newCampaign = new Campaign({
      title,
      description,
      date: new Date(date),
      location,
      organizer,
      email,
      phone: phone || "",
      city,
      targetDonors: targetDonors || 50,
      registeredDonors: 0,
      status: "upcoming",
      bloodGroupsNeeded: bloodGroupsNeeded || ["All"]
    });

    const savedCampaign = await newCampaign.save();
    res.status(201).json({ 
      message: "Campaign created successfully!", 
      campaign: savedCampaign 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/campaigns/:id → update campaign
router.put("/:id", async (req, res) => {
  try {
    if (isMockDataEnabled()) {
      const index = inMemoryCampaigns.findIndex((campaign) => campaign._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      inMemoryCampaigns[index] = {
        ...inMemoryCampaigns[index],
        ...req.body,
        date: req.body.date ? new Date(req.body.date).toISOString() : inMemoryCampaigns[index].date,
        updatedAt: new Date().toISOString(),
      };

      return res.json({ 
        message: "Campaign updated successfully (temporary offline mode)", 
        campaign: inMemoryCampaigns[index] 
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json({ 
      message: "Campaign updated successfully", 
      campaign 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/campaigns/:id → delete campaign
router.delete("/:id", async (req, res) => {
  try {
    if (isMockDataEnabled()) {
      const index = inMemoryCampaigns.findIndex((campaign) => campaign._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      inMemoryCampaigns.splice(index, 1);
      return res.json({ message: "Campaign deleted successfully (temporary offline mode)" });
    }

    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;