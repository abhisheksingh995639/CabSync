import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';

const PostRide = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    seats: '2',
    fare: '',
    rideType: 'AC'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const rideData = {
        pickup: formData.pickup,
        destination: formData.destination,
        date: formData.date,
        time: formData.time,
        seats: parseInt(formData.seats),
        fare: parseFloat(formData.fare),
        hostId: currentUser.uid,
        hostName: userProfile?.name || currentUser.displayName || 'Anonymous',
        hostPhoto: userProfile?.photoUrl || currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        status: 'open',
        passengers: [],
        availableSeats: parseInt(formData.seats),
        rideType: formData.rideType
      };

      console.log("Attempting to post ride:", rideData);
      await addDoc(collection(db, 'rides'), rideData);
      showNotification('Success!', 'Your ride has been posted successfully.');
      navigate('/dashboard');
    } catch (err) {
      console.error("Error posting ride:", err);
      showNotification('Error', 'Failed to post ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Information Sidebar (Desktop Left) - Hidden on mobile to save space */}
          <section className="hidden lg:block lg:col-span-4 space-y-8 order-2 lg:order-1">
            <div className="bg-white rounded-[2.5rem] p-8 skeuo-card">
              <h3 className="font-black text-2xl text-zinc-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FFD100]">savings</span>
                Why share?
              </h3>
              <p className="text-zinc-500 font-medium mb-8 leading-relaxed">Turn your empty seats into savings and meet new people along the way.</p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 skeuo-card border-none shrink-0">
                    <span className="material-symbols-outlined">trending_down</span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-zinc-900">Save up to 60%</h4>
                    <p className="text-sm text-zinc-500 font-medium">Split the cost of fuel and tolls with fellow travelers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 skeuo-card border-none shrink-0">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-zinc-900">Verified Riders</h4>
                    <p className="text-sm text-zinc-500 font-medium">All members are identity-checked for maximum safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 skeuo-card border-none shrink-0">
                    <span className="material-symbols-outlined">eco</span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-zinc-900">Carbon Neutral</h4>
                    <p className="text-sm text-zinc-500 font-medium">Reduce your carbon footprint by filling every seat.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-[2.5rem] overflow-hidden h-72 skeuo-card p-2 group bg-white">
               <div className="relative h-full rounded-[2rem] overflow-hidden">
                <img alt="Person driving" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaUF3Vsmyb2MfrWLxxep-8PIVSEHfraPULJDlD_0AYIbl5rcpnuiUtYW4gOs7NYD3F39_DIml3kJ6jnysCRCW2UKKkfm6uvQgCH5amsKwJUmhg3SV7kKhnxGk1FBRX8GjsZ54ng6a8UiTDXkZQPo_-3xCm7z6evEzBmaMHHKl8xsu1_cnG6H62gNEdZKe2-eivyoP24hrbxrP8EEJyGtwhRhzpVeb4xuzqX-b1blowIh1CCuMBGq3L_mM8ceEntyqcrb9WYdpkwbwa" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                  <p className="text-white font-black text-lg leading-tight">"CabSync saved me ₹15,000 last month on my commute!"<br/><span className="text-[#FFD100] text-sm mt-2 block">— Sarah T.</span></p>
                </div>
               </div>
            </div>
          </section>

          {/* Main Form Section */}
          <section className="col-span-12 lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 lg:p-12 skeuo-card shadow-2xl">
              <header className="mb-6 md:mb-12">
                <h1 className="font-black text-3xl md:text-5xl text-zinc-900 tracking-tight mb-2">Post a <span className="editorial-italic text-[#FFD100]">Ride.</span></h1>
                <p className="text-zinc-500 font-medium text-sm md:text-base">Fill in the details to find your carpool partners.</p>
              </header>
              <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {/* Pickup Location */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Pickup Location</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">location_on</span>
                      <input 
                        name="pickup"
                        value={formData.pickup}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium text-sm md:text-base" 
                        placeholder="Where from?" 
                        type="text" 
                        required
                      />
                    </div>
                  </div>
                  {/* Destination */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Destination</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 group-focus-within:text-[#FFD100] transition-colors">sports_score</span>
                      <input 
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium text-sm md:text-base" 
                        placeholder="Where to?" 
                        type="text" 
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Date</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">calendar_today</span>
                      <input 
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all font-medium text-sm md:text-base" 
                        type="date" 
                        required
                      />
                    </div>
                  </div>
                  {/* Departure Time */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Departure Time</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">schedule</span>
                      <input 
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all font-medium text-sm md:text-base" 
                        type="time" 
                        required
                      />
                    </div>
                  </div>
                  {/* Seats Available */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Seats Available</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">airline_seat_recline_normal</span>
                      <input 
                        name="seats"
                        value={formData.seats}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium text-zinc-900 text-sm md:text-base" 
                        placeholder="Number of seats" 
                        type="number"
                        min="1"
                        max="20"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {/* Total Fare */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Estimated Total Fare (₹)</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">payments</span>
                      <input 
                        name="fare"
                        value={formData.fare}
                        onChange={handleChange}
                        className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium text-sm md:text-base" 
                        placeholder="Enter total trip cost" 
                        type="number" 
                        required
                      />
                    </div>
                  </div>
                  {/* Ride Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-2">Ride Type</label>
                    <div className="flex gap-3 md:gap-4">
                      {['Any', 'AC', 'Non-AC'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, rideType: type})}
                          className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all text-sm md:text-base ${
                            formData.rideType === type 
                              ? 'bg-zinc-900 text-[#FFD100] shadow-lg' 
                              : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
                {/* Submit Button */}
                <div className="pt-4 md:pt-8">
                  <button 
                    disabled={loading}
                    className="w-full md:w-auto px-16 py-4 md:py-5 bg-zinc-900 text-[#FFD100] font-black rounded-xl md:rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 text-base md:text-lg" 
                    type="submit"
                  >
                    <span>{loading ? 'Posting...' : 'Post Your Ride'}</span>
                    {!loading && <span className="material-symbols-outlined">send</span>}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PostRide;
