import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { formatTime12h } from '../utils/formatters';

const MyPostedRides = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengerDetails, setPassengerDetails] = useState({});
  const { showNotification, showConfirm } = useNotification();

  useEffect(() => {
    const passengerIds = [...new Set(rides.flatMap(r => r.passengers || []))];
    if (passengerIds.length > 0) {
      const fetchPassengers = async () => {
        const newDetails = { ...passengerDetails };
        let changed = false;
        
        for (const pId of passengerIds) {
          if (!newDetails[pId]) {
            try {
              const userSnap = await getDoc(doc(db, 'users', pId));
              if (userSnap.exists()) {
                newDetails[pId] = userSnap.data();
                changed = true;
              }
            } catch (err) {
              console.error("Error fetching passenger profile:", err);
            }
          }
        }
        
        if (changed) {
          setPassengerDetails(newDetails);
        }
      };
      fetchPassengers();
    }
  }, [rides]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'rides'),
      where('hostId', '==', currentUser.uid),
      where('status', 'in', ['open', 'OPEN'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort locally
      ridesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRides(ridesData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching posted rides:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [processing, setProcessing] = useState(false);

  const handleCancelRide = async (rideId) => {
    showConfirm(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? This will notify all passengers and close the journey.",
      async () => {
        setProcessing(true);
        try {
          await updateDoc(doc(db, 'rides', rideId), { status: 'cancelled' });
          const q = query(collection(db, 'requests'), where('rideId', '==', rideId));
          const reqSnapshot = await getDocs(q);
          const updatePromises = reqSnapshot.docs.map(reqDoc => 
            updateDoc(doc(db, 'requests', reqDoc.id), { status: 'cancelled' })
          );
          await Promise.all(updatePromises);
          showNotification("Success", "Ride has been cancelled.");
        } catch (err) {
          console.error("Error cancelling ride:", err);
          showNotification("Error", "Failed to cancel ride.");
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100]"></div></div>;

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-6">
          <div>
            <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-3 md:mb-4">
              My Posted <span className="editorial-italic text-[#FFD100]">Rides.</span>
            </h1>
            <p className="text-zinc-500 font-medium text-sm md:text-lg">Manage your shared journeys and track passenger splits.</p>
          </div>
          <button 
            onClick={() => navigate('/post')}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FFD100] text-zinc-900 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-yellow-400 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined font-black">add_circle</span>
            Post New Ride
          </button>
        </div>

        {/* Rides Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {rides.length > 0 ? (
            rides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 skeuo-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                {/* Header status and vehicle */}
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      {ride.status || 'Active Posted Ride'}
                    </span>
                    {(ride.carModel || ride.vehicleModel) && (
                      <span className="bg-yellow-50 text-yellow-600 border border-yellow-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">directions_car</span>
                        {ride.carModel || ride.vehicleModel}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Total Fare</span>
                    <span className="text-xl md:text-2xl font-black text-zinc-900 tracking-tighter">₹{ride.fare}</span>
                  </div>
                </div>

                {/* Path Map */}
                <div className="space-y-4 md:space-y-5 mb-6 relative">
                  <div className="absolute left-[13px] md:left-[15px] top-4 bottom-4 w-0.5 bg-zinc-100"></div>
                  
                  {/* Pickup */}
                  <div className="flex items-center gap-3 md:gap-4 relative z-10">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 skeuo-card border-none">
                      <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest">Pickup</p>
                      <p className="text-zinc-700 font-bold text-sm md:text-base truncate">{ride.pickup}</p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-3 md:gap-4 relative z-10">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100] shadow-md">
                      <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest">Destination</p>
                      <p className="text-zinc-900 font-black text-sm md:text-base truncate">{ride.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Time & Seats Info Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Date & Time</p>
                      <p className="text-xs md:text-sm font-black text-zinc-700">{ride.date} • {formatTime12h(ride.time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <span className="material-symbols-outlined text-base">airline_seat_recline_normal</span>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Seats</p>
                      <p className="text-xs md:text-sm font-black text-zinc-700">{(ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4))} of {ride.seats || 4} left</p>
                    </div>
                  </div>
                </div>

                {/* Passengers List Section */}
                <div className="border-t border-zinc-50 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                        Confirmed Passengers ({ride.passengers?.length || 0})
                      </p>
                      <div className="flex -space-x-3">
                        {ride.passengers?.length > 0 ? (
                          ride.passengers.slice(0, 5).map((p, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl border-4 border-white bg-zinc-50 overflow-hidden skeuo-card !shadow-sm">
                              <img 
                                alt="Passenger" 
                                className="w-full h-full object-cover" 
                                src={passengerDetails[p]?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(passengerDetails[p]?.name || 'P')}&background=FFD100&color=000000`} 
                              />
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <span className="material-symbols-outlined text-base italic">group_off</span>
                            <span className="text-xs font-bold italic">No passengers joined yet</span>
                          </div>
                        )}
                        {ride.passengers?.length > 5 && (
                          <div className="w-10 h-10 rounded-xl border-4 border-white bg-zinc-900 flex items-center justify-center text-[10px] font-black text-[#FFD100] skeuo-card">
                            +{ride.passengers.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCancelRide(ride.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                      title="Cancel Ride"
                    >
                      <span className="material-symbols-outlined text-2xl">delete_forever</span>
                    </button>
                  </div>
                  
                  <Link to={`/ride/${ride.id}`} className="block w-full bg-zinc-900 text-white text-center font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-[0.98]">
                    Manage Ride
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-[3rem] p-16 md:p-24 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-6 md:mb-8 text-zinc-200">
                <span className="material-symbols-outlined text-5xl md:text-6xl">directions_car</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2 md:mb-4">No rides posted yet</h3>
              <p className="text-zinc-400 font-medium max-w-sm mb-10 md:mb-12 text-sm md:text-base leading-relaxed">
                Start sharing your journeys and splitting costs. Your active rides will appear here.
              </p>
              <button 
                onClick={() => navigate('/post')} 
                className="bg-zinc-900 text-[#FFD100] font-black px-10 md:px-14 py-4 md:py-5 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl"
              >
                Post Your First Ride
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyPostedRides;
