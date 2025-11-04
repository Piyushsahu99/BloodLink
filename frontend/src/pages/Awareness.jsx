import React from "react";
import { motion } from "framer-motion";
import {
  FaBookOpen,
  FaHandsHelping,
  FaLightbulb,
  FaShieldAlt,
  FaQuestionCircle,
  FaHeartbeat,
  FaTint,
  FaRegSmileBeam,
  FaHandHoldingHeart
} from "react-icons/fa";

const quickFacts = [
  {
    icon: FaHeartbeat,
    title: "Every 2 seconds",
    detail: "someone needs blood somewhere in the world."
  },
  {
    icon: FaTint,
    title: "1 donation",
    detail: "can support up to three different patients."
  },
  {
    icon: FaHandHoldingHeart,
    title: "45 minutes",
    detail: "is all it takes to complete the donation journey."
  }
];

const mythFacts = [
  {
    myth: "Donating once is enough for the year.",
    fact: "You can safely donate whole blood every 56 days and platelets even more often."
  },
  {
    myth: "Diabetics or people on medication can never donate.",
    fact: "Many controlled conditions are cleared for donation after a quick medical screening."
  },
  {
    myth: "Blood donation weakens the immune system.",
    fact: "Healthy bodies replace donated plasma within hours and red cells within weeks."
  }
];

const journeySteps = [
  {
    title: "Book a slot",
    description: "Reserve a time that works for you. Walk-ins are welcome during most community drives."
  },
  {
    title: "Quick screening",
    description: "A health professional checks your vitals, travel history, and eligibility in under ten minutes."
  },
  {
    title: "Relax and donate",
    description: "Sit back as trained staff guide you through the painless donation process."
  },
  {
    title: "Recover and refuel",
    description: "Enjoy refreshments, hydrate, and get a hero badge in your Raktchain profile."
  }
];

const sampleQuestions = [
  "How do I prepare for my first donation?",
  "Can I donate if I recently recovered from COVID-19?",
  "What documents should I bring to a blood drive?",
  "How does Raktchain keep donor data private?"
];

const Awareness = () => {
  const openChat = (prompt) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-chatbot", { detail: { prompt } }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-16">
      <div className="max-w-6xl mx-auto px-6 space-y-16">
        <motion.section
          className="bg-white rounded-3xl shadow-2xl border border-red-100 p-10 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-red-200 via-rose-200 to-pink-200 rounded-full opacity-40 blur-3xl" />
          <div className="relative z-10 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold text-sm">
                <FaBookOpen /> Donor Awareness Hub
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                Learn, prepare, and inspire others to donate confidently
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                The Raktchain community makes informed choices. Explore proven facts, bust outdated myths, and get ready for your next life-saving donation.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {quickFacts.map((fact) => (
                <motion.div
                  key={fact.title}
                  className="bg-gradient-to-br from-white via-white to-red-50 border border-red-100 rounded-2xl p-5 text-center shadow-lg"
                  whileHover={{ y: -6 }}
                >
                  <div className="mx-auto w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <fact.icon className="text-xl" />
                  </div>
                  <div className="text-lg font-bold text-gray-800">{fact.title}</div>
                  <p className="text-sm text-gray-500 mt-2">{fact.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="grid lg:grid-cols-2 gap-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-rose-600 font-semibold text-sm">
              <FaLightbulb /> Myths vs. Facts
            </span>
            <h2 className="text-3xl font-black text-gray-900">Clear answers to the most common doubts</h2>
            <p className="text-gray-600 leading-relaxed">
              Share these facts with friends and family. Confident donors become regular donors, and knowledge keeps the pipeline strong for hospitals.
            </p>
          </div>
          <div className="space-y-4">
            {mythFacts.map((item, index) => (
              <motion.div
                key={item.myth}
                className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 flex gap-4"
                whileHover={{ y: -4 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-red-500 uppercase tracking-wide">Myth</div>
                  <p className="text-gray-700 font-semibold">{item.myth}</p>
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Fact</div>
                  <p className="text-gray-600">{item.fact}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="bg-white rounded-3xl shadow-2xl border border-rose-100 p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-red-500 font-semibold text-sm">
                <FaHandsHelping /> Donation Journey
              </span>
              <h2 className="text-3xl font-black text-gray-900">Four easy steps from pledge to hero badge</h2>
            </div>
            <p className="text-gray-600 max-w-xl">
              Save or share this playbook with new donors. Each step keeps comfort, safety, and transparency in focus.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-4 gap-4">
            {journeySteps.map((step, index) => (
              <motion.div
                key={step.title}
                className="bg-gradient-to-br from-white via-white to-rose-50 border border-gray-100 rounded-2xl p-5 shadow-md relative"
                whileHover={{ y: -3 }}
              >
                <div className="absolute -top-4 left-4 w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="mt-5 text-lg font-semibold text-gray-800">{step.title}</div>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl shadow-2xl p-10 text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full font-semibold text-sm">
                <FaQuestionCircle /> Need quick answers?
              </span>
              <h2 className="text-3xl font-black leading-snug">Ask Raktchain AI to clear doubts in seconds</h2>
              <p className="text-rose-50 text-base leading-relaxed">
                Tap a suggested question or open the assistant using the chat bubble. You will get conversational guidance backed by verified medical sources.
              </p>
            </div>
            <div className="bg-white/15 border border-white/20 rounded-2xl p-6 space-y-3">
              <p className="text-sm uppercase tracking-wide text-rose-100 font-semibold">Popular questions</p>
              <div className="grid gap-3">
                {sampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => openChat(question)}
                    className="text-left bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-3 font-semibold flex items-center gap-3"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold">?</span>
                    <span className="text-sm text-white/90">{question}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-rose-100/80">
                Tip: Questions load directly into the assistant. Review the message and hit send to get tailored answers.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Awareness;
