import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const DEFAULT_DIFFICULTY = Number.parseInt(process.env.BLOCKCHAIN_DIFFICULTY ?? "", 10);
const RESOLVED_DIFFICULTY = Number.isFinite(DEFAULT_DIFFICULTY) && DEFAULT_DIFFICULTY > 0
  ? DEFAULT_DIFFICULTY
  : 3;

const DEFAULT_LEDGER_PATH = process.env.BLOCKCHAIN_LEDGER_PATH
  ? path.resolve(process.cwd(), process.env.BLOCKCHAIN_LEDGER_PATH)
  : path.resolve(process.cwd(), "backend", "data", "raktchain-ledger.json");

const sleepTick = async () => new Promise((resolve) => setImmediate(resolve));

const canonicalStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  }

  const sortedKeys = Object.keys(value).sort();
  const entries = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`);
  return `{${entries.join(",")}}`;
};

export class BlockchainLedger {
  constructor({ storagePath = DEFAULT_LEDGER_PATH, difficulty = RESOLVED_DIFFICULTY } = {}) {
    this.storagePath = storagePath;
    this.difficulty = Math.max(1, difficulty);
    this.prefix = "0".repeat(this.difficulty);
    this.chain = [];
    this.initialized = false;
    this.initPromise = null;
  }

  async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.loadChain().catch((error) => {
        console.error("Failed to initialize blockchain ledger", error);
        throw error;
      });
    }

    await this.initPromise;
  }

  async loadChain() {
    try {
      const payload = await fs.readFile(this.storagePath, "utf8");
      const parsed = JSON.parse(payload);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const verification = await this.verifyChain(parsed);
        if (verification.isValid) {
          this.chain = parsed;
          this.initialized = true;
          return;
        }
        console.warn("Stored blockchain invalid, rebuilding genesis block", verification);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn("Unable to read blockchain ledger, creating new one", error.message);
      }
    }

    const genesis = await this.buildGenesisBlock();
    this.chain = [genesis];
    await this.saveChain();
    this.initialized = true;
  }

  async saveChain() {
    const directory = path.dirname(this.storagePath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(this.storagePath, JSON.stringify(this.chain, null, 2), "utf8");
  }

  async buildGenesisBlock() {
    const baseBlock = {
      index: 0,
      timestamp: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      data: { message: "Raktchain genesis block" },
      previousHash: "0".repeat(64),
      nonce: 0,
      hash: "",
    };

    return this.mineBlock(baseBlock);
  }

  calculateHash(block, nonce) {
    const payload = `${block.index}|${block.timestamp}|${canonicalStringify(block.data)}|${block.previousHash}|${nonce}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  async mineBlock(block) {
    let nonce = block.nonce ?? 0;

    while (true) {
      const hash = this.calculateHash(block, nonce);
      if (hash.startsWith(this.prefix)) {
        return { ...block, nonce, hash };
      }

      nonce += 1;

      if (nonce % 5000 === 0) {
        await sleepTick();
      }
    }
  }

  sanitizeBlock(block) {
    if (!block) {
      return null;
    }

    return {
      index: block.index,
      timestamp: block.timestamp,
      data: block.data ? JSON.parse(JSON.stringify(block.data)) : {},
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
    };
  }

  async getChain() {
    await this.ensureInitialized();
    return this.chain.map((block) => this.sanitizeBlock(block));
  }

  async addBlock(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Block data must be a non-null object");
    }

    await this.ensureInitialized();

    const lastBlock = this.chain[this.chain.length - 1];
    const clonedData = JSON.parse(JSON.stringify(data));

    const candidateBlock = {
      index: lastBlock.index + 1,
      timestamp: new Date().toISOString(),
      data: clonedData,
      previousHash: lastBlock.hash,
      nonce: 0,
      hash: "",
    };

    const mined = await this.mineBlock(candidateBlock);
    this.chain.push(mined);
    await this.saveChain();
    return this.sanitizeBlock(mined);
  }

  async verifyChain(chainToCheck = null) {
    const chain = Array.isArray(chainToCheck)
      ? chainToCheck.map((block) => ({ ...block, data: block.data ? JSON.parse(JSON.stringify(block.data)) : {} }))
      : await this.getChain();

    if (chain.length === 0) {
      return { isValid: false, invalidIndex: 0, reason: "Blockchain is empty" };
    }

    for (let index = 0; index < chain.length; index += 1) {
      const block = chain[index];
      const expectedHash = this.calculateHash(block, block.nonce);

      if (block.hash !== expectedHash) {
        return { isValid: false, invalidIndex: index, reason: "Hash mismatch" };
      }

      if (!block.hash.startsWith(this.prefix)) {
        return { isValid: false, invalidIndex: index, reason: "Difficulty requirement not met" };
      }

      if (index === 0) {
        if (block.previousHash !== "0".repeat(64)) {
          return { isValid: false, invalidIndex: index, reason: "Invalid genesis previous hash" };
        }
        continue;
      }

      const previousBlock = chain[index - 1];
      if (block.previousHash !== previousBlock.hash) {
        return { isValid: false, invalidIndex: index, reason: "Previous hash mismatch" };
      }
    }

    return { isValid: true, invalidIndex: null, reason: null };
  }

  async resetChain() {
    const genesis = await this.buildGenesisBlock();
    this.chain = [genesis];
    await this.saveChain();
    return this.getChain();
  }
}

export const blockchainLedger = new BlockchainLedger();

export default blockchainLedger;
