import React from 'react';
import { Link } from 'react-router-dom';

const BookingConfirmation = () => {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      {/* High-Impact Confirmation Banner */}
      <section className="mb-12">
        <div className="relative overflow-hidden bg-primary-container rounded-3xl p-8 md:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between">
          <div className="z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-label-caps font-label-caps text-primary uppercase">Booking Confirmed</span>
            </div>
            <h1 className="font-h1 text-h1 text-on-background mb-4">You're all set!</h1>
            <p className="font-body-lg text-body-lg text-on-primary-fixed-variant max-w-lg">Your seat for the ride to San Francisco is secured. Get ready for a smooth journey with Sarah.</p>
          </div>
          <div className="mt-8 md:mt-0 relative w-48 h-48 md:w-64 md:h-64">
            <div className="absolute inset-0 bg-accent-light/50 rounded-full blur-3xl animate-pulse"></div>
            <img alt="Ride Visual" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiOq5EK7ZEdHJhIx5K8tGFrWGVrsuNvHgBD5KFVqUab5I4FOK8299--sy9U3USx7jqfMQd6B2q7RzLJTTWURmGv581G0t2hAXQIt3BjO4BkSrDoXRGQ6AiiTfA-AnVp8dUMaOp9S4jisHpnLK7uAH-bCPg4nhI_OMAcSwVYwEZGGPBURjJwPijN5ldPgs-Noi5fTjausYV-YtP7_Dl1tbdziaKFjB5zQBDkNe1GQel1JQyh-4ASW98rS3CXVQFjvd0x9GvqygsQ8PE" />
          </div>
        </div>
      </section>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Ride Details Card */}
        <div className="col-span-12 lg:col-span-8 bg-background-primary rounded-xl p-8 shadow-md border border-border-subtle">
          <h2 className="font-h2 text-h2 text-text-primary mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container text-4xl">route</span>
            Ride Details
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6 relative">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-primary-container border-4 border-white shadow-sm z-10"></div>
                <div className="w-1 h-20 bg-border-subtle my-1"></div>
                <div className="w-4 h-4 rounded-full border-4 border-primary-container bg-white shadow-sm z-10"></div>
              </div>
              <div className="flex-1 space-y-12">
                <div>
                  <p className="text-label-caps font-label-caps text-secondary uppercase">Pickup - 08:30 AM</p>
                  <p className="font-body-lg text-body-lg text-text-primary">124 Downtown Plaza, San Jose</p>
                </div>
                <div>
                  <p className="text-label-caps font-label-caps text-secondary uppercase">Dropoff - 10:15 AM</p>
                  <p className="font-body-lg text-body-lg text-text-primary">Market St. Transit Hub, San Francisco</p>
                </div>
              </div>
            </div>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-border-subtle">
              <img alt="Route Map" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7IYHQpF-IvGct3gH1h1JZidI8yhFNkC_6YJE9Jn6wbTIxQB8686TbtAgXjWxL1y0x_qq5TmBY8pjdHmKN_s0a_xvO0xKJDz9FBXSzULGV3ynQKC8EZwwylLTDY4ANha8qkNGGV11mA7P6T0DxSCffi0LxH7vp3YaTBABLvMQHnUZpHQoiC5DdN8r95KTtsQ1n7moacdhnSVoP_MDE1yduy6hlzU8bhaCLBzo4JlvmkICg1mYCbghTGrCHqAFA9PyMMoF1NZ0t3kn_" />
            </div>
          </div>
        </div>

        {/* Poster / Contact Info Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-background-primary rounded-xl p-6 shadow-md border border-border-subtle">
            <h3 className="font-h3 text-h3 text-text-primary mb-6">Your Driver</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container">
                <img alt="Sarah J." className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8q6xuxKda2Gq49evt0IuhfF0psCajZ_JEZ9-l7jOgwBl7dhcqEt6KZ138KSz_GCw_3-qctNviPjs6ngpcxsFEB2_njDyP5Q-zQktqnYYeFkpXFpNjwbz1aN4t1y6P753qu9eDFO4_9Q-ZDElDSq5qs3_b24dSXKVpPE8DJ_NRK0SOtNG3449qHfRUyf9Dmbzno0_bTu2sFp-287VwOTHWLgcC9SGxPIcEs6XeKi1DS7X7ZRhM52mj0ih4nl9wOSKFEtgZUK_ZYYkZ" />
              </div>
              <div>
                <p className="font-body-lg text-body-lg text-text-primary">Sarah Jenkins</p>
                <div className="flex items-center text-primary-container">
                  <span className="material-symbols-outlined scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-label-caps font-label-caps ml-1">4.9 (124 Rides)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-primary-container text-text-primary py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-accent-light transition-all active:scale-95 shadow-sm">
                <span className="material-symbols-outlined">call</span>
                Call Sarah
              </button>
              <Link to="/chat/1" className="w-full bg-background-secondary text-text-primary py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-zinc-300 transition-all active:scale-95">
                <span className="material-symbols-outlined">chat_bubble</span>
                Message
              </Link>
            </div>
          </div>
          {/* Safety Guidelines Card */}
          <div className="bg-inverse-surface rounded-xl p-6 shadow-lg text-inverse-on-surface">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary-container">shield</span>
              <h3 className="font-h3 text-h3">Safety Checklist</h3>
            </div>
            <ul className="space-y-4 font-body-md text-body-md opacity-90">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container scale-75">check_circle</span>
                <span>Verify vehicle plate: <strong>CAL-8291</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container scale-75">check_circle</span>
                <span>Confirm driver name before entering.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BookingConfirmation;
