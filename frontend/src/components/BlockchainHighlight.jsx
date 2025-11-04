import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaLink, FaShieldAlt, FaFingerprint, FaHistory } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "../api/axiosConfig";

const initialSummary = {
  totalTransactions: 0,
  difficulty: 0,
  lastTransaction: null,
};

const BlockchainHighlight = () => {
  const [summary, setSummary] = useState(initialSummary);
  const [verification, setVerification] = useState({ isValid: true, reason: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBlockchainInsights = async () => {
      try {
        const [summaryResponse, verifyResponse] = await Promise.all([
          axios.get("/blockchain/summary"),
          axios.get("/blockchain/verify"),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryResponse.data ?? initialSummary);
        setVerification(verifyResponse.data ?? { isValid: true, reason: null });
        setError(null);
      } catch (fetchError) {
        console.error("Failed to load blockchain insights", fetchError);
        if (isMounted) {
          setError("Unable to load live ledger data right now");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlockchainInsights();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = [
    {
      icon: FaLink,
      label: "Immutable donations anchored",
      value: summary.totalTransactions,
      accent: "from-red-500 to-rose-500",
    },
    {
      icon: FaShieldAlt,
      label: verification.isValid ? "Chain integrity verified" : `Audit required: ${verification.reason ?? "Unknown issue"}`,
      value: verification.isValid ? "Verified" : "Check",
      accent: verification.isValid ? "from-emerald-500 to-green-500" : "from-amber-500 to-orange-500",
    },
    {
      icon: FaFingerprint,
      label: "Proof-of-work difficulty",
      value: `PoW ${summary.difficulty}`,
      accent: "from-indigo-500 to-purple-500",
    },
  ];

  const lastTransaction = summary.lastTransaction;

  return (
    <motion.section
      className="relative container mx-auto px-6 py-16"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-3xl blur-sm"></div>
      <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-white/95 shadow-2xl">
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-red-400/40 via-rose-300/30 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-br from-rose-400/40 via-red-300/30 to-pink-200/20 rounded-full blur-3xl"></div>

        <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-12 px-10 py-12">
          <div className="space-y-6">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              🔗 Raktchain Ledger
            </motion.span>
            <motion.h2
              className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Transparency backed by blockchain security
            </motion.h2>
            <motion.p
              className="text-gray-600 text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Every verified blood donation is cryptographically sealed on our in-house blockchain. That means donors, recipients, and partner hospitals get tamper-proof proof-of-donation trails they can trust.
            </motion.p>

            <div className="grid sm:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <motion.div
                  key={metric.label}
                  className="relative rounded-2xl border border-white/40 bg-white/70 p-5 shadow-lg"
                  whileHover={{ y: -4 }}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${metric.accent} opacity-10`}></div>
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-500">{metric.label}</div>
                      <div className="rounded-xl bg-red-50 p-2 text-red-500">
                        <metric.icon />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{loading ? "--" : metric.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {error && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-rose-700"
              >
                Explore live ledger
              </Link>
              {!loading && verification.isValid && (
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <FaShieldAlt /> Audited in real time
                </span>
              )}
            </div>
          </div>

          <motion.div
            className="relative rounded-3xl border border-rose-100 bg-white/80 p-8 shadow-xl backdrop-blur"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 text-sm font-semibold text-rose-500">
              <FaHistory /> Latest immutable entry
            </div>
            {loading ? (
              <div className="mt-6 h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ) : lastTransaction ? (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-sm uppercase tracking-wider text-gray-500">Donor → Recipient</div>
                  <div className="text-xl font-bold text-gray-900">
                    {lastTransaction.data.donor} → {lastTransaction.data.recipient}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="font-semibold text-gray-500">Units</div>
                    <div>{lastTransaction.data.units ?? "—"}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Blood group</div>
                    <div>{lastTransaction.data.bloodGroup ?? "—"}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Verifier</div>
                    <div>{lastTransaction.data.verifiedBy}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Block hash</div>
                    <div className="break-all text-xs text-gray-500">{lastTransaction.hash}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-gray-500">
                  Anchored at <span className="font-semibold text-gray-700">{new Date(lastTransaction.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-5 py-10 text-center text-sm text-gray-500">
                Be the first to record a verified donation on the Raktchain ledger.
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default BlockchainHighlight;
