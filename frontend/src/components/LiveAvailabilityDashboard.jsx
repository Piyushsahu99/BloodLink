import React from "react";
import { motion } from "framer-motion";
import {
  FaTint,
  FaMapMarkerAlt,
  FaRedo,
  FaShieldAlt,
  FaHeartbeat,
} from "react-icons/fa";

const LiveAvailabilityDashboard = ({ data, loading, message, onRetry }) => {
  const totalDonors = data?.totalDonors ?? 0;
  const eligibleDonors = data?.eligibleDonors ?? 0;
  const bloodGroups = data?.bloodGroups ?? [];
  const cities = data?.cities ?? [];
  const spotlight = data?.spotlight ?? [];

  if (loading) {
    return (
      <div className="min-h-[380px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl border border-gray-100">
        <motion.div
          className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-red-600 font-semibold">Scanning ledger for live availability…</p>
      </div>
    );
  }

  if (!data || totalDonors === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-600 mb-4">No availability data is accessible right now.</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
        >
          <FaRedo /> Try again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {message && (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between gap-3">
          <span>{message}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800"
          >
            <FaRedo className="text-xs" /> Refresh
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-red-50/60 rounded-2xl p-5 border border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <FaTint />
            <span className="text-sm font-semibold uppercase tracking-wide">Blood Group Availability</span>
          </div>
          <div className="space-y-3">
            {bloodGroups.length === 0 && <p className="text-sm text-gray-500">No blood group data captured yet.</p>}
            {bloodGroups.map((entry) => {
              const { bloodGroup, total, eligible } = entry;
              const percentage = totalDonors === 0 ? 0 : Math.round((eligible / totalDonors) * 100);
              return (
                <div key={bloodGroup} className="bg-white rounded-xl p-3 shadow-sm border border-red-100">
                  <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span>{bloodGroup}</span>
                    <span className="text-red-600">{eligible} ready / {total} total</span>
                  </div>
                  <div className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-600"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-100">
          <div className="flex items-center gap-3 text-rose-600 mb-4">
            <FaMapMarkerAlt />
            <span className="text-sm font-semibold uppercase tracking-wide">Top Cities Responding</span>
          </div>
          <div className="space-y-3">
            {cities.length === 0 && <p className="text-sm text-gray-500">No active cities found.</p>}
            {cities.map((entry) => (
              <div key={entry.city} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-rose-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{entry.city}</p>
                  <p className="text-xs text-gray-500">{entry.eligible} ready · {entry.total} total donors</p>
                </div>
                <span className="text-sm font-bold text-rose-600">{Math.round((entry.total / totalDonors) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-gray-700">
          <FaShieldAlt className="text-red-500" />
          <span className="text-sm font-semibold uppercase tracking-wide">Spotlight (names partially masked)</span>
        </div>

        {spotlight.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center text-sm text-gray-500">
            No spotlight donors available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {spotlight.map((entry) => (
              <div key={entry.id} className="border border-gray-100 rounded-2xl p-4 bg-gradient-to-br from-white via-white to-red-50 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-bold text-gray-800">{entry.name}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${entry.eligible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {entry.eligible ? "Ready" : "Reviewing"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FaMapMarkerAlt className="text-red-500" /> {entry.city}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaHeartbeat className="text-red-400" />
                  Last update: {entry.lastDonationDate ? new Date(entry.lastDonationDate).toLocaleDateString() : "Recently verified"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveAvailabilityDashboard;
