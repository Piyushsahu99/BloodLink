import express from "express";
import blockchainLedger from "../utils/blockchain.js";

const router = express.Router();

router.get("/summary", async (_req, res) => {
  try {
    const chain = await blockchainLedger.getChain();
    const totalTransactions = Math.max(chain.length - 1, 0);
    const lastTransaction = totalTransactions > 0 ? chain[chain.length - 1] : null;

    res.json({
      totalTransactions,
      difficulty: blockchainLedger.difficulty,
      lastTransaction,
    });
  } catch (error) {
    console.error("Failed to load blockchain summary", error);
    res.status(500).json({ message: "Unable to load blockchain summary" });
  }
});

router.get("/verify", async (_req, res) => {
  try {
    const verification = await blockchainLedger.verifyChain();
    res.json(verification);
  } catch (error) {
    console.error("Failed to verify blockchain", error);
    res.status(500).json({ message: "Unable to verify blockchain" });
  }
});

router.get("/recent", async (_req, res) => {
  try {
    const chain = await blockchainLedger.getChain();
    const recent = chain.slice(1).reverse().slice(0, 5);
    res.json({ entries: recent });
  } catch (error) {
    console.error("Failed to fetch recent blockchain entries", error);
    res.status(500).json({ message: "Unable to fetch blockchain entries" });
  }
});

router.get("/entries", async (req, res) => {
  try {
    const {
      limit,
      offset,
      donor,
      recipient,
      bloodGroup,
      campaignId,
      verifier,
      location,
      search,
      sort = "desc",
      format,
    } = req.query;

    const normalize = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
    const includesMatch = (needle, haystack) => {
      if (!needle) {
        return true;
      }
      const normalizedNeedle = normalize(needle);
      return normalize(haystack).includes(normalizedNeedle);
    };
    const equalsMatch = (needle, haystack) => {
      if (!needle) {
        return true;
      }
      return normalize(haystack) === normalize(needle);
    };

    const chain = await blockchainLedger.getChain();
    const sortedEntries = chain
      .slice(1)
      .sort((a, b) => {
        const delta = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return sort === "asc" ? delta : -delta;
      });

    const filteredEntries = sortedEntries.filter((entry) => {
      const payload = entry?.data ?? {};
      return (
        includesMatch(search, `${payload.donor ?? ""} ${payload.recipient ?? ""} ${payload.notes ?? ""} ${payload.campaignId ?? ""}`) &&
        includesMatch(donor, payload.donor) &&
        includesMatch(recipient, payload.recipient) &&
        equalsMatch(bloodGroup, payload.bloodGroup) &&
        includesMatch(campaignId, payload.campaignId) &&
        includesMatch(verifier, payload.verifiedBy) &&
        includesMatch(location, payload.location)
      );
    });

    const parsedLimit = Number.parseInt(limit, 10);
    const parsedOffset = Number.parseInt(offset, 10);
    const safeOffset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const maximumLimit = 250;
    const eligibleEntries = filteredEntries.slice(safeOffset);
    const appliedLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, maximumLimit)
      : Math.min(eligibleEntries.length, maximumLimit);

    const paginated = eligibleEntries.slice(0, appliedLimit);

    const payload = {
      entries: paginated,
      total: filteredEntries.length,
      limit: appliedLimit,
      offset: safeOffset,
      count: paginated.length,
    };

    if (format === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="raktchain-ledger-${new Date().toISOString()}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(payload, null, 2));
      return;
    }

    res.json(payload);
  } catch (error) {
    console.error("Failed to fetch blockchain ledger entries", error);
    res.status(500).json({ message: "Unable to fetch blockchain ledger entries" });
  }
});

router.post("/record", async (req, res) => {
  try {
    const {
      donor,
      recipient,
      units,
      bloodGroup,
      verifiedBy,
      campaignId,
      location,
      notes,
    } = req.body;

    if (!donor || !recipient || !verifiedBy) {
      return res.status(400).json({ message: "Donor, recipient, and verifier are required" });
    }

    const normalizedUnits = units !== undefined && units !== null ? Number(units) : null;
    if (normalizedUnits !== null && (Number.isNaN(normalizedUnits) || normalizedUnits <= 0)) {
      return res.status(400).json({ message: "Units must be a positive number when provided" });
    }

    const block = await blockchainLedger.addBlock({
      donor,
      recipient,
      units: normalizedUnits,
      bloodGroup: bloodGroup || null,
      campaignId: campaignId || null,
      location: location || null,
      notes: notes || null,
      recordedAt: new Date().toISOString(),
      verifiedBy,
    });

    res.status(201).json({
      message: "Donation record anchored to blockchain",
      data: block,
    });
  } catch (error) {
    console.error("Failed to record blockchain donation", error);
    res.status(500).json({ message: "Unable to record blockchain donation" });
  }
});

export default router;
