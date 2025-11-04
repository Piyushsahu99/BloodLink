import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "../api/axiosConfig";
import DonorCard from "../components/DonorCard";
import LiveAvailabilityDashboard from "../components/LiveAvailabilityDashboard";
import { FaSearch, FaFilter, FaRedo, FaUsers, FaHeartbeat, FaMapMarkerAlt } from "react-icons/fa";
import fallbackDonors from "../data/donors.json";

const FALLBACK_DONORS = fallbackDonors.map((donor) => ({
  ...donor,
  _id: `fallback-${donor.id}`,
  maskedPhone: "Contact shared after verification",
  updatedAt: new Date().toISOString(),
}));

const maskName = (name = "") => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Registered Donor";
  }
  const segments = trimmed.split(/\s+/);
  if (segments.length === 1) {
    return `${segments[0].charAt(0).toUpperCase()}***`;
  }
  return `${segments[0]} ${segments[1].charAt(0).toUpperCase()}.`;
};

const buildFallbackAvailability = (donorList) => {
  if (!Array.isArray(donorList) || donorList.length === 0) {
    return { totalDonors: 0, eligibleDonors: 0, bloodGroups: [], cities: [], spotlight: [] };
  }

  const bloodMap = new Map();
  const cityMap = new Map();

  donorList.forEach((donor) => {
    const bloodGroup = donor.bloodGroup || "Unknown";
    const city = donor.city?.trim() || "Unlisted";

    if (!bloodMap.has(bloodGroup)) {
      bloodMap.set(bloodGroup, { total: 0, eligible: 0 });
    }
    const bloodEntry = bloodMap.get(bloodGroup);
    bloodEntry.total += 1;
    bloodEntry.eligible += 1; // Assume fallback donors are available

    if (!cityMap.has(city)) {
      cityMap.set(city, { total: 0, eligible: 0 });
    }
    const cityEntry = cityMap.get(city);
    cityEntry.total += 1;
    cityEntry.eligible += 1;
  });

  const spotlight = donorList.slice(0, 12).map((donor) => ({
    id: donor._id,
    name: maskName(donor.name),
    city: donor.city || "Unlisted",
    bloodGroup: donor.bloodGroup || "N/A",
    eligible: true,
    lastDonationDate: null,
    updatedAt: donor.updatedAt,
  }));

  return {
    totalDonors: donorList.length,
    eligibleDonors: donorList.length,
    bloodGroups: Array.from(bloodMap.entries()).map(([bloodGroup, counts]) => ({ bloodGroup, ...counts })),
    cities: Array.from(cityMap.entries()).map(([city, counts]) => ({ city, ...counts })).slice(0, 10),
    spotlight,
  };
};

const Dashboard = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [infoMessage, setInfoMessage] = useState("");
  const [activeTab, setActiveTab] = useState("donors");
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    let retryTimer;

    const fetchData = async () => {
      setLoading(true);
      setAvailabilityLoading(true);
      let resolvedDonors = [];

      try {
        const res = await axios.get("/donors");
        resolvedDonors = Array.isArray(res.data) ? res.data : [];
        if (!isMounted) {
          return;
        }
        setDonors(resolvedDonors);
        setError("");
        setInfoMessage("");
      } catch (err) {
        console.error("Failed to fetch live donors", err);
        resolvedDonors = FALLBACK_DONORS;
        if (!isMounted) {
          return;
        }
        if (resolvedDonors.length > 0) {
          setDonors(resolvedDonors);
          setError("");
          setInfoMessage("We could not reach the live donor registry, so you are viewing a limited sample list. Please retry in a moment for real-time data.");
        } else {
          setDonors([]);
          setError("Failed to load donors. Please try again later.");
        }

        if (retryCount < 3) {
          retryTimer = setTimeout(() => {
            if (isMounted) {
              setRetryCount((prev) => prev + 1);
            }
          }, 5000);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      try {
        const availabilityRes = await axios.get("/donors/availability");
        if (!isMounted) {
          return;
        }
        setAvailability(availabilityRes.data);
        setAvailabilityMessage("");
      } catch (err) {
        console.error("Failed to load availability snapshot", err);
        if (!isMounted) {
          return;
        }
        const fallbackAvailability = buildFallbackAvailability(resolvedDonors);
        setAvailability(fallbackAvailability);
        if (fallbackAvailability.totalDonors === 0) {
          setAvailabilityMessage("Availability data is not accessible right now. Please try again shortly.");
        } else {
          setAvailabilityMessage("Showing offline availability snapshot while we reconnect to the server.");
        }
      } finally {
        if (isMounted) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError("");
    setInfoMessage("");
    setAvailabilityMessage("");
    setLoading(true);
    setAvailabilityLoading(true);
  };

  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
      const matchesSearch =
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.city || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBloodGroup =
        filterBloodGroup === "" || donor.bloodGroup === filterBloodGroup;
      return matchesSearch && matchesBloodGroup;
    });
  }, [donors, searchTerm, filterBloodGroup]);

  const donorStats = useMemo(() => {
    const total = donors.length;
    const filtered = filteredDonors.length;
    const cityCount = new Set(donors.map((donor) => donor.city)).size;
    return { total, filtered, cityCount };
  }, [donors, filteredDonors]);

  const renderLoading = () => (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center bg-gradient-to-br from-red-50 to-rose-50 relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 bg-gradient-to-b from-red-300 to-rose-400 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            height: "60%",
          }}
          animate={{
            scaleY: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}

      <div className="relative mb-8">
        <motion.div
          className="relative w-24 h-32 flex items-center justify-center"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="relative w-16 h-20"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent" style={{ borderBottomColor: "#ef4444" }} />
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute w-3 h-3 bg-red-400 rounded-full shadow-lg"
            style={{ left: "50%", top: "50%", marginLeft: "-6px", marginTop: "-6px" }}
            animate={{
              x: [0, Math.cos((i * 90 * Math.PI) / 180) * 60],
              y: [0, Math.sin((i * 90 * Math.PI) / 180) * 60],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
          />
        ))}
      </div>

      <motion.p
        className="text-red-600 text-xl font-semibold"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Preparing donor dashboard...
      </motion.p>

      <div className="w-80 h-16 mt-6 relative overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 320 64">
          <motion.path
            d="M0,32 L50,32 L60,20 L70,44 L80,8 L90,56 L100,32 L320,32"
            stroke="#dc2626"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {retryCount > 0 && (
        <p className="text-gray-500 mt-4">Retry attempt {retryCount}/3...</p>
      )}
    </div>
  );

  if (loading && activeTab === "donors") {
    return renderLoading();
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center bg-gradient-to-br from-red-50 to-rose-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-red-600 text-xl font-semibold mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <FaRedo />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
          {retryCount >= 3 && (
            <p className="text-gray-500 text-sm mt-4">
              Still having issues? Please check your internet connection or try again later.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-12">
      <div className="container mx-auto px-6 space-y-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-black mb-3">
            <span className="gradient-text">Raktchain</span> Donor Intelligence
          </h1>
          <p className="text-gray-600 text-lg">
            Privately connect with registered donors and monitor live availability signals across the network.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-5">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <FaUsers />
              <span className="text-sm font-semibold uppercase tracking-wide">Total Registered Donors</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{donorStats.total}</div>
            <p className="text-xs text-gray-500 mt-2">Recovered from secured registry and sanitized for privacy.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-5">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <FaMapMarkerAlt />
              <span className="text-sm font-semibold uppercase tracking-wide">Unique Locations</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{donorStats.cityCount}</div>
            <p className="text-xs text-gray-500 mt-2">Cities actively represented by our registered donors.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-5">
            <div className="flex items-center gap-3 text-pink-600 mb-2">
              <FaHeartbeat />
              <span className="text-sm font-semibold uppercase tracking-wide">Ready To Donate</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{availability?.eligibleDonors ?? 0}</div>
            <p className="text-xs text-gray-500 mt-2">Eligibility inferred from latest medical records or fallback snapshot.</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 md:p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="inline-flex rounded-full bg-red-50 p-1">
              {["donors", "availability"].map((tabKey) => {
                const isActive = activeTab === tabKey;
                const label = tabKey === "donors" ? "Donor Dashboard" : "Live Availability";
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                      isActive
                        ? "bg-red-600 text-white shadow"
                        : "text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <FaRedo className="text-xs" /> Refresh data
            </button>
          </div>
        </motion.div>

        {activeTab === "donors" ? (
          <div className="space-y-8">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by donor name or location"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all"
                  />
                </div>
                <div className="relative">
                  <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterBloodGroup}
                    onChange={(event) => setFilterBloodGroup(event.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Blood Groups</option>
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
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <span>
                  Showing <span className="font-bold text-red-600">{donorStats.filtered}</span> of {donorStats.total} recovered donors
                </span>
                {infoMessage && (
                  <span className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold">
                    <FaRedo className="text-xs" /> {infoMessage}
                  </span>
                )}
              </div>
            </motion.div>

            {filteredDonors.length === 0 ? (
              <motion.div
                className="bg-white rounded-2xl shadow-lg py-20 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">No donors found. Adjust your filters or refresh the data snapshot.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDonors.map((donor, index) => (
                  <motion.div
                    key={donor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DonorCard donor={donor} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <LiveAvailabilityDashboard
            data={availability}
            loading={availabilityLoading}
            message={availabilityMessage}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;