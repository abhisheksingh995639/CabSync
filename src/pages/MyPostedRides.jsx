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
      where('status', '==', 'open')
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
              <div key={ride.id} className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 skeuo-card relative overflow-hidden group">
                <div className="flex justify-between items-start mb-8 md:mb-10">
                  <div className="flex flex-col gap-4">
                    <span className="bg-zinc-50 text-zinc-400 border border-zinc-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-max">
                      {ride.status}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFD100]/10 flex items-center justify-center text-[#FFD100]">
                        <span className="material-symbols-outlined text-3xl">departure_board</span>
                      </div>
                      <h3 className="font-black text-xl md:text-2xl text-zinc-900 tracking-tight leading-tight">{ride.destination}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Total Fare</p>
                    <p className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tighter">₹{ride.fare}</p>
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

                <div className="border-t border-zinc-50 pt-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                        Passengers ({ride.passengers?.length || 0}/{ride.seats} Seats)
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
                            <span className="material-symbols-outlined text-lg italic">group_off</span>
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
                  
                  <Link to={`/manage-requests/${ride.id}`} className="block w-full bg-zinc-900 text-white text-center font-black py-4 md:py-5 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-[0.98]">
                    Manage Requests
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
