import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';

const MyJoinedRides = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [joinedRides, setJoinedRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Fetch my requests to join rides
    const q = query(
      collection(db, 'requests'),
      where('passengerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(requestsData);

      // 2. For each request, fetch the ride details
      const ridesPromises = requestsData.map(async (req) => {
        const rideSnap = await getDoc(doc(db, 'rides', req.rideId));
        if (rideSnap.exists()) {
          return { ...rideSnap.data(), id: rideSnap.id, requestStatus: req.status };
        }
        return null;
      });

      const ridesData = await Promise.all(ridesPromises);
      setJoinedRides(ridesData.filter(r => r !== null && r.status === 'open'));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching joined rides:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [processing, setProcessing] = useState(false);

  const handleLeaveRide = async (rideId, requestId) => {
    if (!window.confirm("Are you sure you want to leave this ride? This will free up your seat for others.")) return;

    setProcessing(true);
    try {
      // 1. Remove UID from ride's passengers array
      const rideRef = doc(db, 'rides', rideId);
      const rideSnap = await getDoc(rideRef);
      if (rideSnap.exists()) {
        const rideData = rideSnap.data();
        const passengers = rideData.passengers || [];
        const updatedPassengers = passengers.filter(id => id !== currentUser.uid);
        
        await updateDoc(rideRef, { 
          passengers: updatedPassengers,
          availableSeats: (rideData.seats || 0) - updatedPassengers.length
        });
      }

      // 2. Update request status to cancelled
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'cancelled'
      });

      alert("You have successfully left the ride.");
    } catch (err) {
      console.error("Error leaving ride:", err);
      alert("Failed to leave ride. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="mb-6 md:mb-12">
          <h1 className="font-black text-3xl md:text-6xl text-zinc-900 tracking-tight mb-2">My Joined <span className="editorial-italic text-[#FFD100]">Rides.</span></h1>
          <p className="text-zinc-500 font-medium text-sm md:text-base">Track your current and past shared journeys.</p>
        </div>

        {/* Mobile Stats Summary - New */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl skeuo-card flex flex-col">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Joined</span>
            <span className="font-black text-2xl text-zinc-900">{joinedRides.length}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl skeuo-card flex flex-col">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Confirmed</span>
            <span className="font-black text-2xl text-green-600">{joinedRides.filter(r => r.requestStatus === 'approved').length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {joinedRides.some(r => r.requestStatus === 'approved') ? (
              <div className="space-y-6 md:space-y-8">
                {joinedRides.filter(r => r.requestStatus === 'approved').map((ride, index) => (
                  <div key={ride.id} className="bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 skeuo-card relative overflow-hidden group">
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-6 md:space-y-8">
                        <div className="flex items-start md:items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 skeuo-card border-none shrink-0 mt-1 md:mt-0">
                            <span className="material-symbols-outlined text-2xl md:text-3xl">commute</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1 md:mb-1.5">
                              <h3 className="font-black text-lg md:text-2xl text-zinc-900 leading-tight">{index === 0 ? 'Current Journey' : 'Active Ride'}</h3>
                              {index === 0 && (
                                <span className="bg-green-50 text-green-700 font-black text-[8px] md:text-[9px] px-2 py-1 rounded-lg flex items-center gap-1 uppercase tracking-widest border border-green-100 whitespace-nowrap">
                                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                  Confirmed
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-500 font-medium text-xs md:text-base">Organized by {ride.hostName}</p>
                          </div>
                        </div>

                        <div className="space-y-4 md:space-y-6 relative ml-3 md:ml-4">
                          <div className="absolute left-[13px] md:left-[15px] top-4 bottom-4 w-0.5 bg-zinc-100"></div>
                          
                          <div className="flex items-start gap-4 md:gap-6 relative z-10">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white skeuo-card border-none flex items-center justify-center text-zinc-400">
                              <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                            </div>
                            <div>
                              <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Pickup</p>
                              <p className="font-black text-base md:text-lg text-zinc-900 leading-tight">{ride.pickup}</p>
                              <p className="text-[10px] md:text-sm text-zinc-500 font-medium">{ride.date} at {ride.time}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 md:gap-6 relative z-10">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100] shadow-lg">
                              <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                            </div>
                            <div>
                              <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                              <p className="font-black text-base md:text-lg text-zinc-900 leading-tight">{ride.destination}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 md:pt-10 mt-6 md:mt-10 border-t border-zinc-50 gap-6">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Your Split</p>
                          <p className="text-3xl md:text-4xl font-black text-zinc-900">₹{Math.round((ride.fare || 0) / ((ride.passengers?.length || 0) + 1))}</p>
                        </div>
                        <div className="flex gap-3">
                          <Link to={`/chat/${ride.id}`} className="flex-1 sm:flex-none text-center border border-zinc-100 bg-zinc-50 text-zinc-900 font-black py-3.5 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl hover:bg-zinc-100 transition-all active:scale-95 text-sm md:text-base">
                            Chat
                          </Link>
                          <Link to={`/ride/${ride.id}`} className="flex-1 sm:flex-none text-center bg-zinc-900 text-[#FFD100] font-black py-3.5 md:py-4 px-8 md:px-10 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95 text-sm md:text-base">
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-zinc-300">
                  <span className="material-symbols-outlined text-4xl md:text-5xl">no_transfer</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-1 md:mb-2">No confirmed journeys yet</h3>
                <p className="text-zinc-400 font-medium text-sm md:text-base max-w-xs mx-auto mb-6 md:mb-8 px-4">Find a ride to join and start your shared journey today.</p>
                <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg text-sm md:text-base">Find a Ride</Link>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Stats */}
          <div className="hidden lg:block lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 skeuo-card">
              <h4 className="font-black text-xl text-zinc-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FFD100]">analytics</span>
                Ride Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-zinc-50 rounded-2xl">
                  <span className="text-zinc-500 font-bold">Total Joined</span>
                  <span className="font-black text-xl text-zinc-900">{joinedRides.length}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-zinc-50 rounded-2xl">
                  <span className="text-zinc-500 font-bold">Confirmed</span>
                  <span className="font-black text-xl text-green-600">{joinedRides.filter(r => r.requestStatus === 'approved').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFD100]/20 rounded-full blur-3xl group-hover:bg-[#FFD100]/30 transition-all duration-700"></div>
              <div className="relative z-10">
                <h4 className="font-black text-2xl mb-2">Need a Ride?</h4>
                <p className="text-white/60 font-medium mb-8 leading-relaxed">Search for available carpools and start splitting your fares today.</p>
                <button onClick={() => navigate('/browse')} className="w-full bg-[#FFD100] text-zinc-900 py-4 rounded-2xl font-black shadow-xl hover:bg-yellow-400 active:scale-95 transition-all">Search Now</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyJoinedRides;
