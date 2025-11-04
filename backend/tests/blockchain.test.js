import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { BlockchainLedger } from "../utils/blockchain.js";

const TEMP_DIR = path.resolve(process.cwd(), "backend", "tests", "tmp-ledger");

const createLedger = async () => {
  const fileName = `${crypto.randomUUID()}.json`;
  const storagePath = path.join(TEMP_DIR, fileName);
  const ledger = new BlockchainLedger({ storagePath, difficulty: 2 });
  await ledger.resetChain();
  return { ledger, storagePath };
};

beforeEach(async () => {
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
  await fs.mkdir(TEMP_DIR, { recursive: true });
});

after(async () => {
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
});

test("adds donation block and maintains chain integrity", async () => {
  const { ledger } = await createLedger();

  const block = await ledger.addBlock({
    donor: "Alice",
    recipient: "Bob",
    units: 2,
    verifiedBy: "Nurse Joy",
  });

  assert.equal(block.index, 1);
  assert.equal(block.data.donor, "Alice");
  assert.ok(block.hash.startsWith("0"));

  const verification = await ledger.verifyChain();
  assert.equal(verification.isValid, true);
  assert.equal(verification.invalidIndex, null);
});

test("detects tampering when block data changes", async () => {
  const { ledger } = await createLedger();
  await ledger.addBlock({
    donor: "Charlie",
    recipient: "Dana",
    units: 1,
    verifiedBy: "Coordinator",
  });

  const chain = await ledger.getChain();
  const tampered = chain.map((block) => ({ ...block, data: { ...block.data } }));
  tampered[1].data.units = 50;

  const verification = await ledger.verifyChain(tampered);
  assert.equal(verification.isValid, false);
  assert.equal(verification.invalidIndex, 1);
  assert.equal(verification.reason, "Hash mismatch");
});

test("persists ledger to disk between instances", async () => {
  const { ledger, storagePath } = await createLedger();

  await ledger.addBlock({
    donor: "Eve",
    recipient: "Frank",
    units: 3,
    verifiedBy: "Auditor",
    campaignId: "CAMP-42",
  });

  const freshLedger = new BlockchainLedger({ storagePath, difficulty: 2 });
  const chain = await freshLedger.getChain();

  assert.ok(chain.length >= 2);
  const lastBlock = chain[chain.length - 1];
  assert.equal(lastBlock.data.campaignId, "CAMP-42");
  assert.equal(lastBlock.index, 1);
});
