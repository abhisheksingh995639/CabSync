import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatTime12h } from '../utils/formatters';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, increment, arrayUnion, getDoc, deleteDoc, getDocs } from 'firebase/firestore';

import { useNotification } from '../context/NotificationContext';

const ManageRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();
  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengerDetails, setPassengerDetails] = useState({});

  useEffect(() => {
    if (ride?.passengers?.length > 0) {
      const fetchPassengers = async () => {
        const newDetails = { ...passengerDetails };
        let changed = false;
        
        for (const pId of ride.passengers) {
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
  }, [ride?.passengers]);

  useEffect(() => {
    if (!id) return;

    // Fetch Ride Details
    const unsubscribeRide = onSnapshot(doc(db, 'rides', id), (docSnap) => {
      if (docSnap.exists()) {
        setRide({ id: docSnap.id, ...docSnap.data() });
      } else {
        setRide(null);
      }
    });

    // Fetch Requests
    const q = query(
      collection(db, 'requests'),
      where('rideId', '==', id),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeRide();
      unsubscribeRequests();
    };
  }, [id]);

  const handleAccept = async (request) => {
    if (!ride || ride.availableSeats <= 0) return;

    try {
      // 1. Update Request Status
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'approved'
      });

      // 2. Update Ride: Add passenger and decrement available seats
      await updateDoc(doc(db, 'rides', ride.id), {
        availableSeats: increment(-1),
        passengers: arrayUnion(request.passengerId)
      });

      showNotification('Success', 'Request accepted!');
    } catch (err) {
      console.error("Error accepting request:", err);
      showNotification('Error', 'Failed to accept request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'rejected'
      });
      showNotification('Success', 'Request rejected.');
    } catch (err) {
      console.error("Error rejecting request:", err);
      showNotification('Error', 'Failed to reject request.');
    }
  };

  const handleCompleteRide = async () => {
    showConfirm(
      "Complete Ride",
      "Mark this ride as completed? This will move it to the history for all passengers.",
      async () => {
        try {
          // 1. Update ride status
          await updateDoc(doc(db, 'rides', id), { status: 'completed' });

          // 2. Update all associated requests to 'completed'
          const q = query(collection(db, 'requests'), where('rideId', '==', id));
          const reqSnapshot = await getDocs(q);
          const updatePromises = reqSnapshot.docs.map(reqDoc => 
            updateDoc(doc(db, 'requests', reqDoc.id), { status: 'completed' })
          );
          await Promise.all(updatePromises);

          showNotification("Success", `Ride from ${ride.pickup} to ${ride.destination} moved to history!`);
          navigate('/history');
        } catch (err) {
          console.error("Error completing ride:", err);
          showNotification("Error", "Failed to complete ride.");
        }
      }
    );
  };

  const handleCancelRide = async () => {
    showConfirm(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? This will notify all passengers and close the journey.",
      async () => {
        try {
          await updateDoc(doc(db, 'rides', id), { status: 'cancelled' });
          const q = query(collection(db, 'requests'), where('rideId', '==', id));
          const reqSnapshot = await getDocs(q);
          const updatePromises = reqSnapshot.docs.map(reqDoc => 
            updateDoc(doc(db, 'requests', reqDoc.id), { status: 'cancelled' })
          );
          await Promise.all(updatePromises);
          showNotification("Success", "Ride cancelled successfully.");
        } catch (err) {
          console.error("Error cancelling ride:", err);
          showNotification("Error", "Failed to cancel ride.");
        }
      }
    );
  };

  const handleDeleteRide = async () => {
    showConfirm(
      "Delete Permanently",
      "Permanently delete this ride? This cannot be undone.",
      async () => {
        try {
          // 1. Find and cancel all associated requests
          const q = query(collection(db, 'requests'), where('rideId', '==', id));
          const reqSnapshot = await getDocs(q);
          const updatePromises = reqSnapshot.docs.map(reqDoc => 
            updateDoc(doc(db, 'requests', reqDoc.id), { status: 'cancelled' })
          );
          await Promise.all(updatePromises);

          // 2. Delete the ride document
          await deleteDoc(doc(db, 'rides', id));
          
          showNotification("Deleted", "Ride and all associated requests removed.");
          navigate('/dashboard');
        } catch (err) {
          console.error("Error deleting ride:", err);
          showNotification("Error", "Failed to delete ride.");
        }
      }
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!ride) return <div className="text-center py-20">Ride not found.</div>;

  return (
    <main className="max-w-7xl mx-auto px-lg py-xl animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-2xl">
        <div>
          <h1 className="font-h1 text-h1 text-zinc-900 mb-xs">Manage Ride</h1>
          <p className="font-body-md text-body-md text-secondary">Review requests and manage your journey to <span className="font-bold text-primary">{ride.destination}</span>.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/chat/${ride.id}`}
            className="px-6 py-2.5 bg-zinc-900 text-[#FFD100] font-black rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            Chat
          </Link>
          <div className="bg-[#FFD100] px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm border border-zinc-200/50">
            <span className="material-symbols-outlined text-zinc-900 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <span className="font-black text-sm text-zinc-900 uppercase tracking-tight">{requests.length} PENDING</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* Pending Requests Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              Pending Requests ({requests.length})
            </h2>
            {requests.length > 0 ? (
              requests.map(req => (
                <div key={req.id} className="bg-background-primary rounded-xl p-lg shadow-md border border-transparent hover:border-primary-container transition-all flex flex-col sm:flex-row gap-lg items-start group">
                  <div className="relative shrink-0">
                    <img className="w-20 h-20 rounded-xl object-cover" src={req.passengerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.passengerName)}&background=FFD100&color=000000`} alt={req.passengerName} />
                    <div className="absolute -bottom-2 -right-2 bg-primary-container text-text-primary px-sm py-xs rounded-lg text-xs font-bold border-2 border-white flex items-center gap-1">
                      4.9 <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-xs">
                      <h3 className="font-h3 text-h3 text-text-primary">{req.passengerName}</h3>
                    </div>
                    <p className="text-body-md text-secondary mb-md">Interested in joining your ride from {ride.pickup}.</p>
                    <div className="flex gap-sm w-full sm:w-auto">
                      <button 
                        onClick={() => handleAccept(req)}
                        disabled={ride.availableSeats <= 0}
                        className="flex-1 sm:flex-none px-xl py-md bg-primary text-zinc-900 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Accept
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="flex-1 sm:flex-none px-xl py-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-sm"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-xl text-center border-2 border-dashed border-border-subtle">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-md">person_search</span>
                <p className="text-secondary">No pending requests.</p>
              </div>
            )}
          </div>

          {/* Joined Passengers Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Joined Passengers ({ride.passengers?.length || 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ride.passengers?.length > 0 ? (
                ride.passengers.map((pId, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex items-center gap-4">
                    <img 
                      className="w-12 h-12 rounded-xl object-cover" 
                      src={passengerDetails[pId]?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(passengerDetails[pId]?.name || 'User')}&background=FFD100&color=000000`} 
                      alt="Passenger" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 truncate">{passengerDetails[pId]?.name || 'Loading...'}</p>
                      <p className="text-xs text-zinc-400">Confirmed Rider</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-xl p-8 text-center border border-zinc-100">
                  <p className="text-zinc-400 text-sm">No passengers have joined yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-surface-container-high rounded-xl p-lg shadow-sm border border-outline-variant">
            <h4 className="font-h3 text-h3 mb-md">Ride Details</h4>
            <div className="space-y-md mb-8">
              <div className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary">my_location</span>
                <div className="min-w-0">
                  <p className="text-xs font-label-caps text-secondary">PICKUP</p>
                  <p className="text-body-md font-bold truncate">{ride.pickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div className="min-w-0">
                  <p className="text-xs font-label-caps text-secondary">DROPOFF</p>
                  <p className="text-body-md font-bold truncate">{ride.destination}</p>
                </div>
              </div>
              <div className="pt-md border-t border-border-subtle flex justify-between items-center">
                <div>
                  <p className="text-xs font-label-caps text-secondary">DEPARTURE</p>
                  <p className="text-body-md font-bold">{ride.date}, {formatTime12h(ride.time)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-label-caps text-secondary">EST. TOTAL FARE</p>
                  <p className="text-xl font-black text-primary">₹{ride.fare}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-100">
              {ride.status === 'open' && (
                <button 
                  onClick={handleCompleteRide}
                  className="w-full py-4 bg-primary text-zinc-900 font-black rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 mb-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Complete Ride
                </button>
              )}

              {ride.status !== 'cancelled' && ride.status !== 'completed' ? (
                <button 
                  onClick={handleCancelRide}
                  className="w-full py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Cancel Ride
                </button>
              ) : ride.status === 'cancelled' ? (
                <div className="py-3 px-4 bg-zinc-50 rounded-xl text-zinc-400 text-center font-bold text-sm">
                  Ride Cancelled
                </div>
              ) : (
                <div className="py-3 px-4 bg-green-50 rounded-xl text-green-600 text-center font-bold text-sm">
                  Ride Completed
                </div>
              )}
              
              <button 
                onClick={handleDeleteRide}
                className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ManageRequests;
