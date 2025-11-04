import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaShieldAlt,
  FaFingerprint,
  FaCube,
  FaCloudDownloadAlt
} from "react-icons/fa";

const DEFAULT_FILTERS = {
  query: "",
  bloodGroup: "",
  verifier: "",
  campaignId: "",
  location: "",
};

const INITIAL_SUMMARY = {
  totalTransactions: 0,
  difficulty: 0,
  lastTransaction: null,
};

const AdminLedger = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [ledgerMeta, setLedgerMeta] = useState({ total: 0, count: 0 });

  const fetchLedger = useCallback(async () => {
    try {
      setRefreshing(true);
      const [entriesResponse, summaryResponse] = await Promise.all([
        axios.get("/blockchain/entries"),
        axios.get("/blockchain/summary"),
      ]);

      const entriesPayload = entriesResponse.data || {};
      const processedEntries = entriesPayload.entries || [];

      setEntries(processedEntries);
      setLedgerMeta({
        total: entriesPayload.total ?? processedEntries.length,
        count: entriesPayload.count ?? processedEntries.length,
      });
      setSummary(summaryResponse.data || INITIAL_SUMMARY);
      setError(null);
    } catch (fetchError) {
      console.error("Failed to load ledger entries", fetchError);
      setError("Unable to load blockchain ledger. Please try again later.");
      setEntries([]);
      setLedgerMeta({ total: 0, count: 0 });
      setSummary(INITIAL_SUMMARY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const validateAndLoad = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== "admin") {
          navigate("/");
          return;
        }
      } catch (parseError) {
        console.error("Unable to parse stored user", parseError);
        navigate("/login");
        return;
      }

      await fetchLedger();
    };

    validateAndLoad();
  }, [fetchLedger, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const filteredEntries = useMemo(() => {
    const { query, bloodGroup, verifier, campaignId, location } = filters;
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const donor = entry?.data?.donor || "";
      const recipient = entry?.data?.recipient || "";
      const entryBloodGroup = entry?.data?.bloodGroup || "";
      const entryVerifier = entry?.data?.verifiedBy || "";
      const entryCampaign = entry?.data?.campaignId || "";
      const entryLocation = entry?.data?.location || "";
      const note = entry?.data?.notes || "";

      const matchesQuery =
        !normalizedQuery ||
        donor.toLowerCase().includes(normalizedQuery) ||
        recipient.toLowerCase().includes(normalizedQuery) ||
        note.toLowerCase().includes(normalizedQuery) ||
        entryCampaign.toLowerCase().includes(normalizedQuery);

      const matchesBloodGroup = !bloodGroup || entryBloodGroup === bloodGroup;
      const matchesVerifier = !verifier || entryVerifier.toLowerCase().includes(verifier.trim().toLowerCase());
      const matchesCampaign = !campaignId || entryCampaign.toLowerCase().includes(campaignId.trim().toLowerCase());
      const matchesLocation = !location || entryLocation.toLowerCase().includes(location.trim().toLowerCase());

      return matchesQuery && matchesBloodGroup && matchesVerifier && matchesCampaign && matchesLocation;
    });
  }, [entries, filters]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
        <motion.div
          className="w-24 h-24 border-4 border-red-200 border-t-red-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-6 text-red-600 font-semibold">Decrypting blockchain ledger…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Ledger unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchLedger}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <FaSyncAlt /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-14 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <motion.section
          className="bg-white rounded-3xl shadow-2xl border border-red-100 p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-red-400/40 via-rose-300/30 to-pink-200/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-wrap gap-8 items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-100 px-4 py-2 rounded-full">
                <FaShieldAlt /> Blockchain oversight
              </span>
              <h1 className="mt-4 text-4xl font-black text-gray-900">Admin Ledger Console</h1>
              <p className="mt-2 text-gray-600">Audit every donation block anchored to the Raktchain ledger.</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-red-100 px-6 py-4 shadow">
              <div className="text-sm text-gray-500">Total anchored donations</div>
              <div className="text-3xl font-black text-red-600">{summary.totalTransactions}</div>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                <FaFingerprint className="text-rose-500" /> PoW difficulty {summary.difficulty}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="query"
                value={filters.query}
                onChange={handleInputChange}
                placeholder="Search donor, recipient, notes, or campaign ID"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <select
                name="bloodGroup"
                value={filters.bloodGroup}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              >
                <option value="">All blood groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                name="verifier"
                value={filters.verifier}
                onChange={handleInputChange}
                placeholder="Filter by verifier"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <input
                type="text"
                name="campaignId"
                value={filters.campaignId}
                onChange={handleInputChange}
                placeholder="Campaign ID"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleInputChange}
                placeholder="Location"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-between">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <FaFilter className="text-rose-500" />
              <span>
                Matched {filteredEntries.length} of {entries.length} loaded blocks
              </span>
              {ledgerMeta.total > entries.length && (
                <span className="text-rose-500 font-semibold">
                  · Ledger total {ledgerMeta.total}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchLedger}
                disabled={refreshing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition ${refreshing ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Clear filters
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Block</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Donor → Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Verifier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hash</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.hash} className="hover:bg-rose-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <FaCube className="text-rose-500" /> #{entry.index}
                      </div>
                      <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-semibold text-gray-900">{entry?.data?.donor || "—"}</div>
                      <div className="text-xs text-gray-500">→ {entry?.data?.recipient || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-semibold text-gray-900">{entry?.data?.units ?? "—"}</div>
                      <div className="text-xs text-gray-500">{entry?.data?.bloodGroup || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-semibold text-gray-900">{entry?.data?.campaignId || "—"}</div>
                      <div className="text-xs text-gray-500">{entry?.data?.notes || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-semibold text-gray-900">{entry?.data?.verifiedBy || "—"}</div>
                      <div className="text-xs text-gray-500">Recorded {entry?.data?.recordedAt ? new Date(entry.data.recordedAt).toLocaleString() : "n/a"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry?.data?.location || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 break-all">
                      {entry.hash}
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No blocks match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 flex flex-wrap justify-between items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="text-sm text-gray-500">
            Export raw ledger data for audits or off-chain backups.
          </div>
          <button
            onClick={async () => {
              try {
                const response = await axios.get("/blockchain/entries", {
                  responseType: "blob",
                  params: {
                    format: "download",
                    limit: ledgerMeta.total || ledgerMeta.count || entries.length || 250,
                  },
                });
                const blob = new Blob([response.data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `raktchain-ledger-${new Date().toISOString()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (downloadError) {
                console.error("Failed to export ledger", downloadError);
                alert("Unable to export ledger data. Please try again.");
              }
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
          >
            <FaCloudDownloadAlt /> Export JSON
          </button>
        </motion.section>
      </div>
    </div>
  );
};

export default AdminLedger;
