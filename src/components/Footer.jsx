import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [modalContent, setModalContent] = useState(null);

  const modals = {
    safety: {
      title: "Safety Guidelines",
      content: (
        <div className="space-y-4">
          <section>
            <h4 className="font-black text-zinc-900 mb-2">1. Identity Verification</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Always verify the identity of your co-commuters. Check their profile ratings and verification badges before starting a journey.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">2. Meet in Public</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">For your first meeting, always choose a well-lit, public location like a campus gate or a major transit hub.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">3. Share Your Trip</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Use the 'Share Trip' feature to send your live location and ride details to a trusted friend or family member.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">4. Mutual Respect</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Maintain a professional and friendly environment. Any form of harassment or misconduct will lead to an immediate permanent ban.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: "Privacy Policy",
      content: (
        <div className="space-y-4">
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Data Collection</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">We collect minimal data required for ride coordination: your name, email, phone number, and location coordinates when using the app.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Usage</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Your data is only used to connect you with relevant ride partners and to improve the matching algorithm. We never sell your data to third parties.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Security</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">All sensitive information is encrypted. We use industry-standard security protocols to ensure your data stays protected.</p>
          </section>
        </div>
      )
    },
    terms: {
      title: "Terms of Service",
      content: (
        <div className="space-y-4">
          <section>
            <h4 className="font-black text-zinc-900 mb-2">User Responsibility</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Users are responsible for their own safety and conduct. CabSync provides the platform but does not employ hosts or provide transport services.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Fare Splitting</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Fare amounts are estimates. Actual splits must be agreed upon by all parties before the trip begins. CabSync does not handle financial transactions between users.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Cancellations</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Hosts and passengers should provide at least 1 hour notice for cancellations to maintain a high trust score.</p>
          </section>
        </div>
      )
    },
    help: {
      title: "Help Center",
      content: (
        <div className="space-y-4">
          <section>
            <h4 className="font-black text-zinc-900 mb-2">How to Post a Ride?</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Go to the 'Post' tab, enter your origin, destination, time, and available seats. Your ride will be visible to others instantly.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">How to Join a Ride?</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Browse available rides, click 'Details', and hit 'Request to Join'. The host will notify you once approved.</p>
          </section>
          <section>
            <h4 className="font-black text-zinc-900 mb-2">Reporting Issues</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">If you face any issues during a ride, use the 'Report' feature in the Ride Details page or email abhisheksingh995639@gmail.com .</p>
          </section>
        </div>
      )
    }
  };

  const closeModal = () => setModalContent(null);

  return (
    <footer className="w-full bg-white border-t border-zinc-200 py-8 px-6 md:px-12 mt-auto">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#FFD100] rounded flex items-center justify-center font-bold text-zinc-900">c</div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">CabSync</div>
          </Link>
          <p className="text-zinc-400 text-sm font-medium">
            © 2024 CabSync Technologies.
          </p>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
          <button onClick={() => setModalContent('safety')} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer">Safety Guidelines</button>
          <button onClick={() => setModalContent('privacy')} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => setModalContent('terms')} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer">Terms of Service</button>
          <button onClick={() => setModalContent('help')} className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer">Help Center</button>
        </div>

      </div>

      {/* Modal Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 skeuo-card relative z-10 animate-scale-in">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">
              {modals[modalContent].title}
            </h2>

            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {modals[modalContent].content}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-50">
              <button
                onClick={closeModal}
                className="w-full py-4 bg-zinc-900 text-[#FFD100] font-black rounded-2xl shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
