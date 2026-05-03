import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
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
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FFD100] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-zinc-900 font-black text-xl leading-none">c</span>
            </div>
            <div className="text-2xl font-black tracking-tighter text-zinc-900">CabSync</div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="px-4 py-2 text-zinc-500 font-medium hover:text-yellow-600 transition-colors hidden md:block">Log In</Link>
            <Link to="/signup" className="skeuo-button-primary px-8 py-2.5 rounded-full font-bold text-on-primary-fixed">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 md:px-12 py-24 max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full text-yellow-700 text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                The Future of Commuting
              </div>
              <div className="editorial-italic-container mb-8">
                <h1 className="font-h1 text-h1 md:text-[64px] text-zinc-900 leading-[1.05] tracking-tight">
                  Ride together, <br />
                  <span className="editorial-italic text-yellow-600 italic">save together.</span>
                </h1>
              </div>
              <p className="font-body-lg text-lg text-zinc-600 mb-12 max-w-lg leading-relaxed">
                Connect with travelers heading your way. Split fares, reduce traffic, and meet new people in a <span className="font-bold text-zinc-900">verified community.</span>
              </p>

              <div className="skeuo-card-premium p-4 rounded-[2rem] bg-white/80 backdrop-blur-md max-w-2xl">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="flex-1 w-full relative group">
                    <div className="absolute inset-0 bg-zinc-200/50 rounded-2xl skeuo-inset opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">location_on</span>
                    <input 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-100/50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-zinc-400" 
                      placeholder="Pickup location" 
                      type="text" 
                    />
                  </div>
                  <div className="flex-1 w-full relative group">
                    <div className="absolute inset-0 bg-zinc-200/50 rounded-2xl skeuo-inset opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">map</span>
                    <input 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-100/50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-zinc-400" 
                      placeholder="Destination" 
                      type="text" 
                    />
                  </div>
                  <Link 
                    to="/browse" 
                    onClick={handleFindRide}
                    className="skeuo-button-raised w-full md:w-auto px-10 py-4 rounded-2xl font-black text-on-primary-fixed whitespace-nowrap text-center transition-all bg-[#FFD100]"
                  >
                    Find a Ride
                  </Link>
                </div>
              </div>
              <div className="mt-8">
                <Link to="/post" className="inline-flex items-center gap-3 text-zinc-900 font-black text-sm group">
                  Post a Ride instead
                  <span className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="relative">
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
        <section className="bg-[#F5F5F0] py-24 relative overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Safe */}
              <div className="skeuo-card-light p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:translate-y-[-6px] transition-all duration-500">
                <div className="w-20 h-20 rounded-2xl skeuo-icon-inset-light flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-zinc-900 text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>verified_user</span>
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Safe</h3>
                <p className="editorial-italic text-yellow-600 italic text-lg mb-4">Verified Community</p>
                <p className="text-sm text-zinc-500 max-w-xs leading-relaxed font-medium">Multi-level identity verification for every single member of our platform.</p>
              </div>

              {/* Affordable */}
              <div className="skeuo-card-light p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:translate-y-[-6px] transition-all duration-500">
                <div className="w-20 h-20 rounded-2xl skeuo-icon-inset-light flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-zinc-900 text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Affordable</h3>
                <p className="editorial-italic text-yellow-600 italic text-lg mb-4">Shared Costs</p>
                <p className="text-sm text-zinc-500 max-w-xs leading-relaxed font-medium">Save up to 60% on your daily commute by splitting fares with others.</p>
              </div>

              {/* Reliable */}
              <div className="skeuo-card-light p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:translate-y-[-6px] transition-all duration-500">
                <div className="w-20 h-20 rounded-2xl skeuo-icon-inset-light flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-zinc-900 text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>speed</span>
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Reliable</h3>
                <p className="editorial-italic text-yellow-600 italic text-lg mb-4">Real-time Updates</p>
                <p className="text-sm text-zinc-500 max-w-xs leading-relaxed font-medium">Accurate ETAs and real-time ride tracking for complete peace of mind.</p>
              </div>
            </div>
          </div>
        </section>


        {/* How it Works */}
        <section className="py-24 bg-[#F5F5F0]">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <div className="text-center mb-20">
              <h2 className="font-h2 text-h2 md:text-5xl text-zinc-900 mb-4 tracking-tight">How it <span className="editorial-italic text-yellow-600">works.</span></h2>
              <p className="text-zinc-500 font-medium">Simple steps to start your premium commute</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { step: "01", title: "Post your Route", desc: "Enter your starting point and destination in seconds.", icon: "route" },
                { step: "02", title: "Get Matched", desc: "Our smart algorithm finds the perfect ride match for you.", icon: "diversity_3" },
                { step: "03", title: "Ride Together", desc: "Share the journey, split the cost, and save the planet.", icon: "nature_people" }
              ].map((item, i) => (
                <div key={i} className="skeuo-card p-10 rounded-[2.5rem] bg-white group border-none shadow-xl hover:shadow-2xl transition-all">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg transition-transform">
                      <span className="material-symbols-outlined text-zinc-900 text-3xl">{item.icon}</span>
                    </div>
                    <span className="text-4xl font-black text-zinc-100 group-hover:text-yellow-100 transition-colors leading-none">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-4">{item.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition & Trust */}
        <section className="bg-white py-24 border-y border-zinc-200">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
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
                <div className="skeuo-card p-12 rounded-[3rem] bg-zinc-900 text-white relative z-10">
                  <div className="text-center mb-12">
                    <div className="inline-block px-4 py-1.5 bg-yellow-400 rounded-full text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-6">Security & Trust</div>
                    <h3 className="text-4xl font-black mb-4">Coordinate with <br /><span className="editorial-italic italic text-yellow-400">Confidence</span></h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { icon: "verified", text: "Identity Verification System" },
                      { icon: "chat_bubble", text: "End-to-End Encrypted Chat" },
                      { icon: "star", text: "Two-Way Rating System" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 group hover:bg-zinc-800 transition-all">
                        <span className="material-symbols-outlined text-yellow-400 group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -inset-4 bg-yellow-400/20 rounded-[3.5rem] -z-10 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - App Download */}
        <section className="py-24 px-6 md:px-12 max-w-screen-2xl mx-auto text-center">
          <div className="skeuo-cta-card rounded-[3rem] py-16 px-8 relative overflow-hidden border-none max-w-5xl mx-auto">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

            <h2 className="text-4xl md:text-5xl font-black mb-6 text-zinc-900 relative z-10 tracking-tight">Ready to skip the traffic?</h2>
            <p className="text-lg text-zinc-800/70 mb-10 max-w-xl mx-auto relative z-10 font-medium leading-relaxed">
              Join millions of riders who choose CabSync for their daily commute. <br className="hidden md:block" /> Fast, affordable, and reliable.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
              <button className="skeuo-button-tactile-dark text-white px-10 py-4 rounded-2xl font-black text-lg">
                Download for Android
              </button>
              <button className="skeuo-button-tactile-light text-zinc-900 px-10 py-4 rounded-2xl font-black text-lg">
                Download for iOS
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-zinc-200 py-16 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#FFD100] rounded flex items-center justify-center font-bold text-zinc-900">c</div>
                <div className="text-2xl font-black text-zinc-900">CabSync</div>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-xs">
                Revolutionizing urban mobility in India through smart technology and a community-first approach.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-lg">public</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-lg">alternate_email</span>
                </div>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">About Us</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Careers</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-wider text-xs">Services</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Bike Taxi</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Auto</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">CabSync</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Rentals</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-wider text-xs">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Safety</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Help Center</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Lost & Found</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Data Usage</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">CSR</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-xs">
              © 2024 CabSync Technologies. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-zinc-400 hover:text-zinc-900 text-xs transition-colors">Cookie Policy</a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 text-xs transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
