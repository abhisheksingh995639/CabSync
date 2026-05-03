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
      setJoinedRides(ridesData.filter(r => r !== null && r.status !== 'completed'));
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
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-2">My Joined <span className="editorial-italic text-[#FFD100]">Rides.</span></h1>
          <p className="text-zinc-500 font-medium">Track your current and past shared journeys.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-8">
            {joinedRides.some(r => r.requestStatus === 'approved') ? (
              <div className="space-y-8">
                {joinedRides.filter(r => r.requestStatus === 'approved').map((ride, index) => (
                  <div key={ride.id} className="bg-white rounded-[3rem] p-8 sm:p-10 skeuo-card relative overflow-hidden group">
                    {index === 0 && (
                      <div className="absolute top-0 right-0 p-8">
                        <span className="bg-green-50 text-green-700 font-black text-[10px] px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest border border-green-100">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Confirmed
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 skeuo-card border-none">
                            <span className="material-symbols-outlined text-3xl">commute</span>
                          </div>
                          <div>
                            <h3 className="font-black text-2xl text-zinc-900">{index === 0 ? 'Current Journey' : 'Active Ride'}</h3>
                            <p className="text-zinc-500 font-medium">Organized by {ride.hostName}</p>
                          </div>
                        </div>

                        <div className="space-y-6 relative ml-4">
                          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-100"></div>
                          
                          <div className="flex items-start gap-6 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-white skeuo-card border-none flex items-center justify-center text-zinc-400">
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Pickup</p>
                              <p className="font-black text-lg text-zinc-900">{ride.pickup}</p>
                              <p className="text-sm text-zinc-500 font-medium">{ride.date} at {ride.time}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-6 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100] shadow-lg">
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                              <p className="font-black text-lg text-zinc-900">{ride.destination}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-10 mt-10 border-t border-zinc-50">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Your Split</p>
                          <p className="text-4xl font-black text-zinc-900">₹{ride.fare}</p>
                        </div>
                        <div className="flex gap-3">
                          <Link to={`/chat/${ride.id}`} className="bg-zinc-50 text-zinc-900 font-black py-4 px-8 rounded-2xl hover:bg-zinc-100 transition-all active:scale-95">
                            Chat
                          </Link>
                          <Link to={`/ride/${ride.id}`} className="bg-zinc-900 text-[#FFD100] font-black py-4 px-10 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95">
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-300">
                  <span className="material-symbols-outlined text-5xl">no_transfer</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-2">No confirmed journeys yet</h3>
                <p className="text-zinc-400 font-medium max-w-xs mx-auto mb-8">Find a ride to join and start your shared journey today.</p>
                <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black px-8 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg">Find a Ride</Link>
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="md:col-span-4 space-y-8">
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
