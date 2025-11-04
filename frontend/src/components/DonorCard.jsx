import React from "react";
import { FaMapMarkerAlt, FaShieldAlt, FaHeartbeat } from "react-icons/fa";
import { motion } from "framer-motion";

const DonorCard = ({ donor }) => {
  const lastUpdatedLabel = (() => {
    if (!donor?.updatedAt) {
      return "Recently verified";
    }
    try {
      const updated = new Date(donor.updatedAt);
      if (Number.isNaN(updated.getTime())) {
        return "Recently verified";
      }
      return `Updated ${updated.toLocaleDateString()}`;
    } catch {
      return "Recently verified";
    }
  })();

  return (
    <motion.div
      className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-6 border border-red-100/60 hover:border-red-300 group overflow-hidden"
      whileHover={{ y: -6, scale: 1.01 }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, type: "spring" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-transparent to-rose-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
            <FaHeartbeat /> Verified donor
          </span>
          <span className="text-xs text-gray-400 font-medium">{lastUpdatedLabel}</span>
        </div>

        <div className="space-y-4">
          <motion.h3
            className="text-2xl font-black text-gray-800 leading-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {donor.name}
          </motion.h3>

          <motion.div
            className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl hover:bg-red-50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="bg-red-100 p-2 rounded-lg">
              <FaMapMarkerAlt className="text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">Location</span>
              <span className="text-sm text-gray-600">{donor.city || "Shared upon request"}</span>
            </div>
          </motion.div>

          <motion.div
            className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl hover:bg-red-50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="bg-red-100 p-2 rounded-lg">
              <FaShieldAlt className="text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">Details protected</span>
              <span className="text-xs text-gray-500">Blood group and contact information are securely shared after admin verification.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DonorCard;
