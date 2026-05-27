import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const Home = () => {
  const { currentUser } = useAuth();
  const [showIosModal, setShowIosModal] = React.useState(false);

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  const [pickup, setPickup] = React.useState('');
  const [destination, setDestination] = React.useState('');

  const handleFindRide = () => {
    if (pickup || destination) {
      localStorage.setItem('cabsync_temp_pickup', pickup);
      localStorage.setItem('cabsync_temp_destination', destination);
    }
  };

  return (
    <div className="bg-[#F5F5F0] font-body-md text-text-primary antialiased min-h-screen">
      {/* ... previous header content ... */}
      <header className="fixed top-0 w-full z-50 border-b bg-white/80 backdrop-blur-xl border-zinc-200 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4 md:px-12 max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-zinc-900 rounded-full flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              <img src="/ic_cabsync_logo.png" alt="CabSync Logo" className="w-full h-full object-contain scale-[1.35]" />
            </div>

            <div className="text-xl md:text-2xl font-black tracking-tighter text-zinc-900">CabSync</div>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="px-3 py-2 md:px-4 text-zinc-600 font-bold text-sm hover:text-yellow-600 transition-colors">Log In</Link>
            <Link to="/signup" className="bg-[#FFD100] skeuo-button-raised px-4 md:px-8 py-2 md:py-2.5 rounded-full font-bold text-zinc-900 text-sm">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 md:px-12 pt-2 pb-12 md:pt-6 md:pb-24 max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full text-yellow-700 text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                The Future of Commuting
              </div>
              <div className="editorial-italic-container mb-4 md:mb-8">
                <h1 className="font-black text-[36px] md:text-[56px] lg:text-[64px] text-zinc-900 leading-[1.05] tracking-tight">
                  Ride together, <br />
                  <span className="editorial-italic text-yellow-600 italic">save together.</span>
                </h1>
              </div>
              <p className="text-sm md:text-lg text-zinc-600 mb-6 md:mb-12 max-w-lg leading-relaxed">
                Connect with travelers heading your way. Split fares, reduce traffic, and meet new people in a <span className="font-bold text-zinc-900">verified community.</span>
              </p>

              <div className="skeuo-card-premium p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] bg-white/80 backdrop-blur-md">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">location_on</span>
                    <input 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border-none rounded-xl md:rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-zinc-400 text-sm" 
                      placeholder="Pickup location" 
                      type="text" 
                    />
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">map</span>
                    <input 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border-none rounded-xl md:rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-zinc-400 text-sm" 
                      placeholder="Destination" 
                      type="text" 
                    />
                  </div>
                  <Link 
                    to={currentUser ? "/browse" : "/signup"} 
                    onClick={handleFindRide}
                    className="skeuo-button-raised w-full py-3.5 rounded-xl md:rounded-2xl font-black text-zinc-900 whitespace-nowrap text-center transition-all bg-[#FFD100] text-sm md:text-base"
                  >
                    Find a Ride
                  </Link>
                </div>
              </div>
              <div className="mt-5 md:mt-8">
                <Link to={currentUser ? "/post" : "/signup"} className="inline-flex items-center gap-3 text-zinc-900 font-black text-xs md:text-sm group">
                  Post a Ride instead
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                    <span className="material-symbols-outlined text-xs md:text-sm">arrow_forward</span>
                  </span>
                </Link>
              </div>
            </div>


            <div className="relative hidden lg:block">
              <div className="absolute -top-12 -right-12 w-50 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-12 -left-12 w-50 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
              <div className="skeuo-card p-3 rounded-[2.5rem] bg-white transition-transform duration-700">
                <img alt="People sharing a ride" className="w-full aspect-[3/2] object-cover rounded-[2rem] shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCc3QLkYg3ChC4RSyl0dcWt5tVNCgKYspHHjw8NTEq1-5CW_eYSvtk0gtQbMGCIEmNIHQlpsE5PnVNJR4FRi5MKkLZ0NdXFyo7yHn7-_Dhs_OKXu5n4S0BiyInKIvAgcn_503qnaGvoJi9C95Orwz74gvgDV3-o8AWbuGr6TMX9tcN9emPRhZq8mn-bnRDnmUN7a-g5c2LUQyF8Nw166cK0_pDbwxFPiSMQoQX-s72FeTRqdnL5ddFkgvi9-L-cugQn0-A_Gc2LzIE" />
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Bar */}
        <div className="bg-gradient-to-r from-[#FFD100] via-[#FFB800] to-[#FFD100] text-zinc-900 overflow-hidden py-4 text-xs font-black uppercase tracking-[0.4em] relative z-10 border-y border-black/5 marquee-texture">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-8 relative z-10">
            <span className="flex items-center gap-8">
              <span>Reliable Rides</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Premium Experience</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Zero Emissions</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Verified Community</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Smart Splitting</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
            </span>
            <span className="flex items-center gap-8">
              <span>Reliable Rides</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Premium Experience</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Zero Emissions</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Verified Community</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Smart Splitting</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
            </span>
            <span className="flex items-center gap-8">
              <span>Reliable Rides</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Premium Experience</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Zero Emissions</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span>Verified Community</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
              <span className="text-white drop-shadow-sm">Smart Splitting</span> <div className="w-1.5 h-1.5 bg-zinc-900/80 rounded-full"></div>
            </span>
          </div>
        </div>

        {/* Core Values Section */}
        <section className="bg-[#F5F5F0] py-10 md:py-24 relative overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
              {/* Safe */}
              <div className="skeuo-card-light p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] flex flex-col group hover:translate-y-[-6px] transition-all duration-500">
                {/* Mobile: icon + title row | Desktop: centered icon block */}
                <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 mb-3 md:mb-0 md:text-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-xl md:rounded-2xl skeuo-icon-inset-light flex items-center justify-center md:mb-8 transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-zinc-900 text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>verified_user</span>
                  </div>
                  <div className="flex-1 md:hidden">
                    <h3 className="text-xl font-black text-zinc-900 mb-0.5 tracking-tight">Safe</h3>
                    <p className="editorial-italic text-yellow-600 italic text-sm">Verified Community</p>
                  </div>
                </div>
                {/* Desktop-only title/subtitle */}
                <h3 className="hidden md:block text-3xl font-black text-zinc-900 mb-2 tracking-tight text-center">Safe</h3>
                <p className="hidden md:block editorial-italic text-yellow-600 italic text-lg mb-4 text-center">Verified Community</p>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium md:text-center md:max-w-xs md:mx-auto">Multi-level identity verification for every single member of our platform.</p>
              </div>

              {/* Affordable */}
              <div className="skeuo-card-light p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] flex flex-col group hover:translate-y-[-6px] transition-all duration-500">
                <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 mb-3 md:mb-0 md:text-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-xl md:rounded-2xl skeuo-icon-inset-light flex items-center justify-center md:mb-8 transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-zinc-900 text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
                  </div>
                  <div className="flex-1 md:hidden">
                    <h3 className="text-xl font-black text-zinc-900 mb-0.5 tracking-tight">Affordable</h3>
                    <p className="editorial-italic text-yellow-600 italic text-sm">Shared Costs</p>
                  </div>
                </div>
                <h3 className="hidden md:block text-3xl font-black text-zinc-900 mb-2 tracking-tight text-center">Affordable</h3>
                <p className="hidden md:block editorial-italic text-yellow-600 italic text-lg mb-4 text-center">Shared Costs</p>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium md:text-center md:max-w-xs md:mx-auto">Save up to 60% on your daily commute by splitting fares with others.</p>
              </div>

              {/* Reliable */}
              <div className="skeuo-card-light p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] flex flex-col group hover:translate-y-[-6px] transition-all duration-500">
                <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 mb-3 md:mb-0 md:text-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-xl md:rounded-2xl skeuo-icon-inset-light flex items-center justify-center md:mb-8 transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-zinc-900 text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>speed</span>
                  </div>
                  <div className="flex-1 md:hidden">
                    <h3 className="text-xl font-black text-zinc-900 mb-0.5 tracking-tight">Reliable</h3>
                    <p className="editorial-italic text-yellow-600 italic text-sm">Real-time Updates</p>
                  </div>
                </div>
                <h3 className="hidden md:block text-3xl font-black text-zinc-900 mb-2 tracking-tight text-center">Reliable</h3>
                <p className="hidden md:block editorial-italic text-yellow-600 italic text-lg mb-4 text-center">Real-time Updates</p>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium md:text-center md:max-w-xs md:mx-auto">Accurate ETAs and real-time ride tracking for complete peace of mind.</p>
              </div>

            </div>
          </div>
        </section>


        {/* How it Works */}
        <section className="py-10 md:py-24 bg-[#F5F5F0]">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
            <div className="text-center mb-8 md:mb-20">
              <h2 className="font-black text-3xl md:text-5xl text-zinc-900 mb-2 md:mb-4 tracking-tight">How it <span className="editorial-italic text-yellow-600">works.</span></h2>
              <p className="text-zinc-500 font-medium text-sm md:text-base">Simple steps to start your premium commute</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
              {[
                { step: "01", title: "Post your Route", desc: "Enter your starting point and destination in seconds.", icon: "route" },
                { step: "02", title: "Get Matched", desc: "Our smart algorithm finds the perfect ride match for you.", icon: "diversity_3" },
                { step: "03", title: "Ride Together", desc: "Share the journey, split the cost, and save the planet.", icon: "nature_people" }
              ].map((item, i) => (
                <div key={i} className="skeuo-card p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-white group border-none shadow-xl hover:shadow-2xl transition-all flex flex-col">
                  {/* Mobile: icon + title row | Desktop: icon + number row */}
                  <div className="flex items-center gap-4 mb-3 md:mb-8 md:justify-between md:items-start">
                    <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-yellow-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-transform">
                      <span className="material-symbols-outlined text-zinc-900 text-2xl md:text-3xl">{item.icon}</span>
                    </div>
                    {/* Title visible only on mobile, beside the icon */}
                    <h3 className="md:hidden text-xl font-black text-zinc-900 tracking-tight flex-1">{item.title}</h3>
                    {/* Step number visible only on desktop, top-right */}
                    <span className="hidden md:block text-4xl font-black text-zinc-100 group-hover:text-yellow-100 transition-colors leading-none">{item.step}</span>
                  </div>
                  {/* Title visible only on desktop, below icon row */}
                  <h3 className="hidden md:block text-2xl font-black text-zinc-900 mb-4">{item.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm md:text-base">{item.desc}</p>
                </div>

              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition & Trust */}
        <section className="bg-white py-10 md:py-24 border-y border-zinc-200">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="font-h2 text-h2 md:text-5xl mb-12 text-zinc-900 leading-tight tracking-tight">Why Choose <br /><span className="editorial-italic text-yellow-600 italic">CabSync?</span></h2>
                <div className="space-y-12">
                  <div className="flex gap-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 transition-colors duration-500">
                      <span className="material-symbols-outlined text-zinc-900">savings</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-zinc-900 mb-2">Maximum Savings</h4>
                      <p className="text-zinc-500 leading-relaxed">Stop overpaying for empty seats. Our community model ensures everyone saves more on every single trip.</p>
                    </div>
                  </div>
                  <div className="flex gap-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 transition-colors duration-500">
                      <span className="material-symbols-outlined text-zinc-900">shield_with_heart</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-zinc-900 mb-2">Safety First</h4>
                      <p className="text-zinc-500 leading-relaxed">With real-time sharing and verified profiles, we've built the safest community for your daily travel.</p>
                    </div>
                  </div>
                  <div className="flex gap-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 transition-colors duration-500">
                      <span className="material-symbols-outlined text-zinc-900">eco</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-zinc-900 mb-2">Sustainable Travel</h4>
                      <p className="text-zinc-500 leading-relaxed">Every shared ride is a step towards a greener city. Contribute to a sustainable future with every journey.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="skeuo-card-dark p-5 md:p-12 rounded-[2.5rem] md:rounded-[3rem] text-white relative z-10">
                  <div className="text-center mb-5 md:mb-12">
                    <div className="inline-block px-4 py-1.5 bg-[#FFD100] rounded-full text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-0 md:mb-6">Security & Trust</div>
                    <h3 className="hidden md:block text-4xl font-black mb-4">Coordinate with <br /><span className="editorial-italic italic text-[#FFD100]">Confidence</span></h3>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {[
                      { icon: "verified", text: "Identity Verification System" },
                      { icon: "chat_bubble", text: "End-to-End Encrypted Chat" },
                      { icon: "star", text: "Two-Way Rating System" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 group hover:bg-zinc-800 transition-all">
                        <span className="material-symbols-outlined text-[#FFD100] group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="font-bold text-zinc-300 group-hover:text-white transition-colors text-sm md:text-base">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -inset-2 md:-inset-4 bg-yellow-400/20 rounded-[3rem] md:rounded-[3.5rem] -z-10 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - App Download */}
        <section className="py-10 md:py-24 px-4 md:px-12 max-w-screen-2xl mx-auto text-center">
          <div className="skeuo-cta-card rounded-[2rem] md:rounded-[3rem] py-10 md:py-16 px-6 md:px-8 relative overflow-hidden border-none max-w-5xl mx-auto">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-zinc-900 relative z-10 tracking-tight">Ready to skip the traffic?</h2>
            <p className="text-base md:text-lg text-zinc-800/70 mb-8 md:mb-10 max-w-xl mx-auto relative z-10 font-medium leading-relaxed">
              Join millions of riders who choose CabSync for their daily commute. Fast, affordable, and reliable.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 relative z-10">
              <a 
                href="https://github.com/abhisheksingh995639/CabSync-App/releases/latest/download/app-release.apk"
                download="CabSync.apk"
                className="skeuo-button-tactile-dark text-white w-full sm:w-auto px-8 md:px-10 py-4 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>android</span>
                Download for Android
              </a>
              <button 
                onClick={() => setShowIosModal(true)}
                className="skeuo-button-tactile-light text-zinc-900 w-full sm:w-auto px-8 md:px-10 py-4 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>apple</span>
                Get it on iOS
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* iOS Add to Home Screen Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowIosModal(false)}
          ></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 skeuo-card relative z-10 animate-scale-in">
            <button 
              onClick={() => setShowIosModal(false)} 
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>apple</span>
            </div>

            <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight text-center">Add to Home Screen</h2>
            <p className="text-zinc-500 text-sm text-center mb-8 leading-relaxed">
              We don't have an iOS app yet, but you can install CabSync as a web app for a native-like experience!
            </p>

            <div className="space-y-3 mb-8">
              {[
                { step: '1', icon: 'ios_share', label: 'Tap the Share button', sub: 'The box with an arrow at the bottom of Safari' },
                { step: '2', icon: 'add_box', label: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share sheet to find it' },
                { step: '3', icon: 'check_circle', label: 'Tap "Add" to confirm', sub: 'CabSync will appear on your home screen' },
              ].map(({ step, icon, label, sub }) => (
                <div key={step} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
                  <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#FFD100] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{label}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowIosModal(false)}
              className="w-full py-4 bg-zinc-900 text-[#FFD100] font-black rounded-2xl shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
