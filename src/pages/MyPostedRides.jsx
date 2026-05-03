import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';

const MyPostedRides = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengerDetails, setPassengerDetails] = useState({});

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
      where('hostId', '==', currentUser.uid)
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
    if (!window.confirm("Are you sure you want to cancel this ride? This will notify all passengers and close the journey.")) return;

    setProcessing(true);
    try {
      // 1. Update ride status
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'cancelled'
      });

      // 2. Find and cancel all associated requests
      const q = query(collection(db, 'requests'), where('rideId', '==', rideId));
      const reqSnapshot = await getDocs(q);
      const updatePromises = reqSnapshot.docs.map(reqDoc => 
        updateDoc(doc(db, 'requests', reqDoc.id), { status: 'cancelled' })
      );
      await Promise.all(updatePromises);

      alert("Ride and all associated requests have been cancelled.");
    } catch (err) {
      console.error("Error cancelling ride:", err);
      alert("Failed to cancel ride.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-text-primary mb-2">My Posted Rides</h1>
          <p className="text-secondary font-body-lg">Manage your shared journeys and track passenger splits.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/post')}
            className="flex items-center gap-2 bg-primary-container text-text-primary px-6 py-3 rounded-full font-bold shadow-md hover:bg-accent-light transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Post New Ride
          </button>
        </div>
      </div>

      {/* Rides Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {rides.length > 0 ? (
          rides.map((ride) => (
            <div key={ride.id} className={`bg-background-primary rounded-xl p-6 shadow-md border border-border-subtle hover:shadow-lg transition-all ${ride.status === 'cancelled' ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className={`px-3 py-1 rounded-full text-label-caps inline-block w-max mb-3 ${
                    ride.status === 'open' ? 'bg-accent-light text-on-primary-fixed-variant' :
                    ride.status === 'completed' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-error-container text-on-error-container'
                  }`}>
                    {ride.status.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">departure_board</span>
                    <h3 className="font-h3 text-h3">{ride.pickup} to {ride.destination}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-label-caps text-secondary uppercase mb-1">Split Fare</p>
                  <p className="text-h3 font-h3 text-text-primary">₹{ride.fare} <span className="text-sm font-normal text-secondary">total</span></p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="w-0.5 h-8 bg-border-subtle"></div>
                    <div className="w-2 h-2 rounded-full border-2 border-primary"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Departure: {ride.date} {ride.time}</p>
                    <p className="font-body-lg text-text-primary font-bold">{ride.pickup}</p>
                    <div className="h-4"></div>
                    <p className="text-sm text-secondary">Destination</p>
                    <p className="font-body-lg text-text-primary font-bold">{ride.destination}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <p className="text-label-caps text-secondary uppercase mb-4">
                  Passengers ({ride.passengers?.length || 0}/{ride.seats} Seats)
                </p>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex -space-x-3">
                    {ride.passengers?.length > 0 ? (
                      ride.passengers.slice(0, 3).map((p, i) => (
                        <div key={i} title={passengerDetails[p]?.name || "Passenger"} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-300 overflow-hidden">
                          <img alt="Passenger" className="w-full h-full object-cover" src={passengerDetails[p]?.photoUrl || `https://i.pravatar.cc/100?u=${p}`} />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-secondary italic">No passengers yet</p>
                    )}
                    {ride.passengers?.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-xs font-bold text-secondary">
                        +{ride.passengers.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <Link to={`/manage-requests/${ride.id}`} className="block w-full bg-zinc-900 text-white text-center font-black py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                  Manage Ride
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border-2 border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">directions_car</span>
            <p className="text-secondary font-body-lg">You haven't posted any rides yet.</p>
            <button onClick={() => navigate('/post')} className="mt-6 bg-primary-container text-text-primary px-8 py-3 rounded-full font-bold">Post Your First Ride</button>
          </div>
        )}

        {/* Asymmetric Bento-style Info Card */}
        <div className="bg-zinc-900 rounded-xl p-8 text-white relative overflow-hidden flex flex-col justify-between lg:col-span-2">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-20"></div>
          <div>
            <h2 className="text-h2 font-h2 mb-4 leading-tight">Earnings from Shared Rides</h2>
            <p className="text-zinc-400 mb-8 max-w-xs">Sharing your commute with CabSync helps reduce costs and carbon emissions.</p>
            <div className="flex gap-12">
              <div>
                <p className="text-label-caps text-zinc-500 uppercase mb-2">Total Rides</p>
                <p className="text-h2 font-h2 text-primary">{rides.length}</p>
              </div>
              <div>
                <p className="text-label-caps text-zinc-500 uppercase mb-2">Impact</p>
                <p className="text-h2 font-h2">High</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex items-center gap-4">
              <div className="bg-primary-container p-2 rounded-lg">
                <span className="material-symbols-outlined text-text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div>
                <p className="text-sm font-bold">Top Contributor</p>
                <p className="text-xs text-zinc-400">Keep sharing to earn badges</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPostedRides;
