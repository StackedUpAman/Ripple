import React, { useState, useEffect } from "react";

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);

  // // Show popup after 8 seconds
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowModal(true);
  //   }, 8000);

  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img
            src="/src/resources/logo3.png"
            alt="Ripple Logo"
            className="w-20 h-20"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            RIPPLE
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-700 transition shadow-md"
        >
          Enter Chat
        </button>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-8 pt-20 pb-16 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-teal-600 uppercase bg-teal-100 rounded-full">
          Anonymous • Secure • Real-Time
        </div>

        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
          Speak freely. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
            Stay anonymous.
          </span>
        </h2>

        <p className="text-lg text-slate-600 max-w-2xl mb-10">
          RIPPLE is a real-time anonymous chat platform where your identity stays
          hidden. Share thoughts, vent emotions, or connect with strangers —
          without fear of judgment.
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1"
        >
          Start Chatting
        </button>
      </header>

      {/* Login / Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl"
            >
              &times;
            </button>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">
                Welcome to RIPPLE
              </h3>
              <p className="text-slate-500">
                Choose how you want to continue
              </p>
            </div>

            <div className="space-y-4">
              <ActionButton
                label="Continue Anonymously"
                onClick={() => (window.location.href = "/chat")}
              />
              <ActionButton
                label="Login"
                onClick={() => (window.location.href = "/login")}
              />
              <ActionButton
                label="Create Account"
                onClick={() => (window.location.href = "/signup")}
              />
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              No personal data is shared. Your privacy is our priority.
            </p>
          </div>
        </div>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-3 gap-10">
        <FeatureCard
          icon="🫥"
          title="Complete Anonymity"
          desc="No usernames, no profile pictures, no identity leaks."
        />
        <FeatureCard
          icon="💬"
          title="Real-Time Chat"
          desc="Instant messaging with zero delay and smooth experience."
        />
        <FeatureCard
          icon="🔒"
          title="Privacy First"
          desc="Conversations are encrypted and never publicly stored."
        />
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-slate-500">{desc}</p>
  </div>
);

const ActionButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:opacity-90 transition"
  >
    {label}
  </button>
);

export default LandingPage;
