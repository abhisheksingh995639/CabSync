import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { formatTime12h } from '../utils/formatters';

const MyJoinedRides = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [joinedRides, setJoinedRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification, showConfirm } = useNotification();

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
    showConfirm(
      "Leave Ride",
      "Are you sure you want to leave this ride? This will notify the host and free up your seat for someone else.",
      async () => {
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
          await updateDoc(doc(db, 'requests', requestId), { status: 'cancelled' });
          showNotification("Success", "You have successfully left the ride.");
        } catch (err) {
          console.error("Error leaving ride:", err);
          showNotification("Error", "Failed to leave ride.");
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100]"></div>
      <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">Loading your journeys...</p>
    </div>
  );

  const confirmedRides = joinedRides.filter(r => r.requestStatus === 'approved');
  const pendingRides = joinedRides.filter(r => r.requestStatus === 'pending');

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 animate-fade-in">
        <div className="mb-8 md:mb-16">
          <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-3 md:mb-4">
            My Joined <span className="editorial-italic text-[#FFD100]">Rides.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm md:text-lg">Track your current journeys and manage pending requests.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-8 space-y-12 md:space-y-16">
            
            {/* Confirmed Journeys */}
            <section>
              <h2 className="font-black text-xl md:text-2xl text-zinc-900 mb-6 md:mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD100]">verified</span>
                Active Journeys
              </h2>
              {confirmedRides.length > 0 ? (
                <div className="space-y-6 md:space-y-10">
                  {confirmedRides.map((ride) => (
                    <div key={ride.id} className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 skeuo-card relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-8 md:mb-10">
                        <div className="flex flex-col gap-4">
                          <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-max flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Confirmed
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#FFD100]">
                              <span className="material-symbols-outlined text-3xl">commute</span>
                            </div>
                            <h3 className="font-black text-xl md:text-2xl text-zinc-900 tracking-tight leading-tight">{ride.destination}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Your Split</p>
                          <p className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tighter">₹{Math.round((ride.fare || 0) / ((ride.passengers?.length || 0) + 1))}</p>
                        </div>
                      </div>

                      <div className="space-y-6 mb-10">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Departure</p>
                            <p className="font-black text-zinc-700">{ride.date} at {formatTime12h(ride.time)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100]">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Pickup Location</p>
                            <p className="font-black text-zinc-900">{ride.pickup}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-8 border-t border-zinc-50">
                        <Link to={`/chat/${ride.id}`} className="flex-1 bg-zinc-50 text-zinc-900 text-center font-black py-4 md:py-5 rounded-2xl hover:bg-zinc-100 transition-all active:scale-[0.98] border border-zinc-100">
                          Open Chat
                        </Link>
                        <Link to={`/ride/${ride.id}`} className="flex-1 bg-zinc-900 text-[#FFD100] text-center font-black py-4 md:py-5 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-[0.98]">
                          Ride Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] p-12 md:p-20 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 text-zinc-200">
                    <span className="material-symbols-outlined text-4xl">no_transfer</span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-2">No active journeys</h3>
                  <p className="text-zinc-400 font-medium text-sm max-w-xs mb-8">Join a ride to see your confirmed carpools here.</p>
                  <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black px-10 py-4 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-sm">Find a Ride</Link>
                </div>
              )}
            </section>

            {/* Pending Requests */}
            {pendingRides.length > 0 && (
              <section>
                <h2 className="font-black text-xl md:text-2xl text-zinc-900 mb-6 md:mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-400">schedule</span>
                  Pending Requests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingRides.map((ride) => (
                    <div key={ride.id} className="bg-white rounded-[2rem] p-6 md:p-8 skeuo-card border border-zinc-50 relative overflow-hidden opacity-90 grayscale-[0.3]">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-3">
                          <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest w-max">
                            Awaiting Approval
                          </span>
                          <h4 className="font-black text-lg text-zinc-900 leading-tight truncate max-w-[150px]">{ride.destination}</h4>
                        </div>
                        <p className="text-xl font-black text-zinc-900 tracking-tighter">₹{Math.round((ride.fare || 0) / ((ride.passengers?.length || 0) + 1))}</p>
                      </div>
                      <div className="flex flex-col gap-3 mb-8">
                        <div className="flex items-center gap-3 text-zinc-500">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          <span className="text-xs font-bold">{ride.date} • {formatTime12h(ride.time)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400">
                          <span className="material-symbols-outlined text-base">person</span>
                          <span className="text-xs font-bold">Host: {ride.hostName}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleLeaveRide(ride.id, requests.find(r => r.rideId === ride.id)?.id)}
                          className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all active:scale-95"
                        >
                          Cancel Request
                        </button>
                        <Link to={`/ride/${ride.id}`} className="flex-1 py-3 bg-zinc-50 text-zinc-400 text-center rounded-xl text-xs font-black hover:bg-zinc-100 transition-all active:scale-95">
                          View Ride
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Desktop Sidebar Stats */}
          <div className="hidden lg:block lg:col-span-4 space-y-10">
            <div className="bg-white rounded-[2.5rem] p-10 skeuo-card">
              <h4 className="font-black text-xl text-zinc-900 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD100]">analytics</span>
                Stats Summary
              </h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-zinc-50 rounded-2xl">
                  <span className="text-zinc-500 font-bold">Total Joined</span>
                  <span className="font-black text-2xl text-zinc-900">{confirmedRides.length}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-zinc-50 rounded-2xl">
                  <span className="text-zinc-500 font-bold">Pending</span>
                  <span className="font-black text-2xl text-zinc-400">{pendingRides.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFD100]/10 rounded-full blur-3xl group-hover:bg-[#FFD100]/20 transition-all duration-700"></div>
              <div className="relative z-10 text-center">
                <h4 className="font-black text-2xl mb-3">Want to host?</h4>
                <p className="text-white/50 font-medium mb-10 text-sm leading-relaxed">Save more by sharing your own vehicle and empty seats with others.</p>
                <button onClick={() => navigate('/post')} className="w-full bg-[#FFD100] text-zinc-900 py-5 rounded-2xl font-black shadow-xl hover:bg-yellow-400 active:scale-95 transition-all">Post a Ride</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyJoinedRides;
