import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../api/axiosConfig";
import {
  FaMicroscope,
  FaUserShield,
  FaHeartbeat,
  FaSeedling,
  FaHandsHelping,
  FaCheckCircle,
  FaClipboardList,
  FaRegClock,
  FaMedkit
} from "react-icons/fa";

const infoHighlights = [
  {
    icon: FaMicroscope,
    title: "Why Stem Cells Matter",
    description:
      "Stem cell transplants can rebuild healthy blood and immune systems, offering hope to patients fighting leukemia, lymphoma, and other blood cancers."
  },
  {
    icon: FaUserShield,
    title: "Non-Invasive Process",
    description:
      "Most donations use a simple outpatient procedure similar to donating plasma, with donors back to routine tasks within 24 hours."
  },
  {
    icon: FaHeartbeat,
    title: "Global Impact",
    description:
      "A single match can save a life anywhere in the world. Registered donors form an international safety net for critical patients."
  }
];

const processTimeline = [
  {
    step: "01",
    title: "Join the Registry",
    detail: "Complete the secure form and confirm your consent to be listed as a potential match."
  },
  {
    step: "02",
    title: "Simple Swab Kit",
    detail: "Receive a painless cheek-swab kit to confirm tissue type and compatibility markers."
  },
  {
    step: "03",
    title: "We Find Your Match",
    detail: "Our network alerts you when a patient shares your tissue profile and needs urgent support."
  },
  {
    step: "04",
    title: "Donate & Recover",
    detail: "Most donations are outpatient. Rest, recover quickly, and know you changed the course of someone’s life."
  }
];

const eligibilityPoints = [
  "Ages 18-55 with no serious chronic illnesses",
  "Minimum weight of 50 kg with balanced health history",
  "No recent chemotherapy or blood cancer diagnosis",
  "Willingness to travel to an accredited donation center if matched"
];

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  age: "",
  bloodGroup: "",
  availability: "",
  experience: "first-time",
  medicalHistory: "",
  preferredContactTime: "",
  consent: false
};

const StemCellDonation = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });
  const [stats, setStats] = useState({ totalRegistered: 0, activeCities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("/stemcell/stats");
        setStats(data);
      } catch (error) {
        console.error("Unable to load stem cell stats", error);
      }
    };

    fetchStats();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.consent) {
      setStatus({ type: "error", message: "Please confirm your consent to join the registry." });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const { consent, ...payload } = formData;
      await axios.post("/stemcell/register", { ...payload, consent });
      setStatus({ type: "success", message: "Thank you for stepping forward. We’ll reach out if a matching patient needs you." });
      setFormData(initialFormState);
      const { data } = await axios.get("/stemcell/stats");
      setStats(data);
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to submit your registration right now.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        <motion.section
          className="bg-white rounded-3xl shadow-2xl p-10 border border-red-100 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -top-28 -right-24 w-72 h-72 bg-gradient-to-br from-red-200 via-rose-200 to-pink-200 rounded-full opacity-40 blur-3xl"></div>
          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <motion.span
                className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FaHandsHelping className="text-lg" />
                Stem Cell Lifeline
              </motion.span>
              <motion.h1
                className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Become the Match That Gives Blood Cancer Patients a Second Chance
              </motion.h1>
              <motion.p
                className="text-gray-600 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Stem cell donors rebuild the healthy blood of patients undergoing aggressive treatments. By joining the registry, you’re offering hope when it matters most.
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-4">
                  <div className="text-3xl font-black text-red-600">{stats.totalRegistered || 0}</div>
                  <div className="text-sm text-gray-500">Registered volunteers</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4">
                  <div className="text-3xl font-black text-rose-600">{stats.activeCities || 0}</div>
                  <div className="text-sm text-gray-500">Cities represented</div>
                </div>
              </motion.div>
            </div>
            <motion.div
              className="grid gap-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {infoHighlights.map((highlight) => (
                <motion.div
                  key={highlight.title}
                  className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 flex gap-4 items-start hover:shadow-xl transition-shadow"
                  whileHover={{ y: -4 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center shadow-lg">
                    <highlight.icon className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{highlight.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{highlight.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="grid lg:grid-cols-2 gap-10 items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-red-500 font-semibold text-sm">
              <FaClipboardList /> Donation Journey
            </span>
            <h2 className="text-3xl font-black text-gray-900">How the Donation Journey Works</h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Our streamlined process keeps you informed at every milestone. From the first cheek-swab to the day you donate, the Raktchain support team coordinates logistics so you can focus on making a difference.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {processTimeline.map((item) => (
                <motion.div
                  key={item.step}
                  className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 relative overflow-hidden"
                  whileHover={{ y: -3 }}
                >
                  <div className="absolute top-4 right-4 text-5xl font-black text-red-100">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            className="bg-white rounded-3xl border border-red-100 shadow-2xl p-8 space-y-5"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <div className="flex items-start gap-4">
              <FaSeedling className="text-4xl text-rose-500" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Who Can Donate?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Healthy adults can safely donate stem cells multiple times. We evaluate each application to ensure your wellbeing comes first.
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {eligibilityPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
              <FaMedkit className="text-2xl text-red-500" />
              <p className="text-sm text-gray-600">
                Already in a registry? Update your availability to stay on standby for urgent cases. Life-saving matches can happen in minutes.
              </p>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="bg-white rounded-3xl shadow-2xl p-10 border border-rose-100"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 text-rose-500 font-semibold text-sm">
                <FaRegClock /> Quick Registration
              </span>
              <h2 className="text-3xl font-black text-gray-900">Register as a Stem Cell Donor</h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Share a few details so our medical coordinators can guide you through the next steps. Your information stays private and is only used to notify you about potential matches.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <FaHandsHelping className="text-red-500 mt-0.5" />
                  Securely stored, never shared without consent.
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <FaHandsHelping className="text-red-500 mt-0.5" />
                  Update your availability anytime via the same form.
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                    placeholder="Your full legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                    placeholder="Optional contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                    placeholder="Where you currently live"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="60"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                    placeholder="18-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  >
                    <option value="">Select blood group</option>
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  >
                    <option value="">Choose preferred notice period</option>
                    <option value="flexible">Flexible – ready when needed</option>
                    <option value="2-weeks">Need 2 weeks notice</option>
                    <option value="1-month">Need a month to plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Experience</label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  >
                    <option value="first-time">First-time donor</option>
                    <option value="experienced">Donated stem cells before</option>
                    <option value="other">Registered with another program</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Notes</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  placeholder="Existing medical conditions, medications, or travel limitations"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Contact Time</label>
                <input
                  type="text"
                  name="preferredContactTime"
                  value={formData.preferredContactTime}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  placeholder="Weekdays after 6 PM, weekends, etc."
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-600 bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                />
                <span>
                  I agree to be contacted by the Raktchain coordination team if a compatible patient needs my stem cells. I understand that my information is kept confidential and can be removed at any time.
                </span>
              </label>

              {status.message && (
                <div
                  className={`p-4 rounded-xl text-sm font-semibold ${
                    status.type === "success"
                      ? "bg-green-100 border border-green-200 text-green-700"
                      : "bg-red-100 border border-red-200 text-red-700"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 hover:shadow-2xl"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Submitting..." : "Join the Stem Cell Registry"}
              </motion.button>
            </form>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default StemCellDonation;
