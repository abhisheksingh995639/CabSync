import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, getDoc, increment, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { formatTime12h } from '../utils/formatters';

import { useNotification } from '../context/NotificationContext';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { showNotification, showConfirm } = useNotification();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRequest, setMyRequest] = useState(null);
  const [passengerDetails, setPassengerDetails] = useState({});
  const [requests, setRequests] = useState([]);

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
    if (!id || !currentUser) return;

    // Fetch Ride Details
    const unsubscribeRide = onSnapshot(doc(db, 'rides', id), (docSnap) => {
      if (docSnap.exists()) {
        setRide({ id: docSnap.id, ...docSnap.data() });
      } else {
        setRide(null);
      }
      setLoading(false);
    });

    // Check if current user has already requested this ride
    const q = query(
      collection(db, 'requests'),
      where('rideId', '==', id),
      where('passengerId', '==', currentUser.uid)
    );

    const unsubscribeRequest = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Get the latest non-cancelled request
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(r => r.status !== 'cancelled');
        setMyRequest(reqs[0] || null);
      } else {
        setMyRequest(null);
      }
    });

    // Fetch Pending Requests (for Host view)
    const qRequests = query(
      collection(db, 'requests'),
      where('rideId', '==', id),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeRide();
      unsubscribeRequest();
      unsubscribeRequests();
    };
  }, [id, currentUser]);

  const [processing, setProcessing] = useState(false);

  const handleJoinRequest = async () => {
    if (!currentUser || !ride) return;
    
    setProcessing(true);
    try {
      await addDoc(collection(db, 'requests'), {
        rideId: ride.id,
        ridePickup: ride.pickup,
        rideDestination: ride.destination,
        passengerId: currentUser.uid,
        passengerName: userProfile?.name || currentUser.displayName || 'Anonymous',
        passengerPhoto: userProfile?.photoUrl || currentUser.photoURL || '',
        hostId: ride.hostId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      
      // Send push notification to host
      try {
        const hostDoc = await getDoc(doc(db, 'users', ride.hostId));
        if (hostDoc.exists()) {
          const hostToken = hostDoc.data().fcmToken;
          if (hostToken) {
            const authToken = await currentUser.getIdToken(false);
            await fetch('https://cabsync.netlify.app/.netlify/functions/sendPush', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: authToken,
                targetToken: hostToken,
                title: 'New Ride Request',
                body: `${userProfile?.name || currentUser.displayName || 'Anonymous'} wants to join your ride from ${ride.pickup} to ${ride.destination}.`
              })
            });
          }
        }
      } catch (pushErr) {
        console.error("Error sending push notification:", pushErr);
      }

      showNotification('Request Sent', 'Wait for the host to approve your request.');
    } catch (err) {
      console.error("Error sending request:", err);
      showNotification('Error', 'Failed to send request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleLeaveRide = async () => {
    showConfirm(
      "Leave Ride",
      "Are you sure you want to leave this ride?",
      async () => {
        setProcessing(true);
        try {
          const rideRef = doc(db, 'rides', ride.id);
          const updatedPassengers = (ride.passengers || []).filter(id => id !== currentUser.uid);
          const updatedPassengerDetails = (ride.passengerDetails || []).filter(p => p.uid !== currentUser.uid);
          await updateDoc(rideRef, { 
            passengers: updatedPassengers,
            availableSeats: (ride.seats || 4) - updatedPassengers.length,
            passengerDetails: updatedPassengerDetails
          });
          if (myRequest) {
            await deleteDoc(doc(db, 'requests', myRequest.id));
          }
          showNotification("Success", "You have left the ride.");
        } catch (err) {
          console.error("Error leaving ride:", err);
          showNotification("Error", "Failed to leave ride.");
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleRemovePassenger = async (passengerId) => {
    showConfirm(
      "Remove Passenger",
      "Are you sure you want to remove this passenger from your ride?",
      async () => {
        setProcessing(true);
        try {
          const rideRef = doc(db, 'rides', id);
          const updatedPassengers = (ride.passengers || []).filter(uid => uid !== passengerId);
          const updatedPassengerDetails = (ride.passengerDetails || []).filter(p => p.uid !== passengerId);
          
          await updateDoc(rideRef, {
            passengers: updatedPassengers,
            availableSeats: (ride.seats || 4) - updatedPassengers.length,
            passengerDetails: updatedPassengerDetails
          });

          const q = query(
            collection(db, 'requests'),
            where('rideId', '==', id),
            where('passengerId', '==', passengerId)
          );
          const reqSnapshot = await getDocs(q);
          const deletePromises = reqSnapshot.docs.map(reqDoc => 
            deleteDoc(doc(db, 'requests', reqDoc.id))
          );
          await Promise.all(deletePromises);

          showNotification("Success", "Passenger has been removed.");
        } catch (err) {
          console.error("Error removing passenger:", err);
          showNotification("Error", "Failed to remove passenger.");
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleCancelRide = async () => {
    showConfirm(
      "Cancel Ride",
      "Are you sure you want to cancel your ride? This will notify all passengers.",
      async () => {
        setProcessing(true);
        try {
          await updateDoc(doc(db, 'rides', ride.id), { status: 'cancelled' });
          const q = query(collection(db, 'requests'), where('rideId', '==', ride.id));
          const reqSnapshot = await getDocs(q);
          const updatePromises = reqSnapshot.docs.map(reqDoc => 
            updateDoc(doc(db, 'requests', reqDoc.id), { status: 'cancelled' })
          );
          await Promise.all(updatePromises);
          showNotification("Success", "Ride cancelled successfully.");
          navigate('/dashboard');
        } catch (err) {
          console.error("Error cancelling ride:", err);
          showNotification("Error", "Failed to cancel ride.");
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleAccept = async (request) => {
    if (!ride || (ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4)) <= 0) return;

    try {
      // 1. Update Request Status
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'approved'
      });

      // 2. Update Ride: Add passenger, decrement available seats, and sync passenger details
      await updateDoc(doc(db, 'rides', ride.id), {
        availableSeats: increment(-1),
        passengers: arrayUnion(request.passengerId),
        passengerDetails: arrayUnion({
          uid: request.passengerId,
          name: request.passengerName || 'Anonymous',
          photoUrl: request.passengerPhoto || ''
        })
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
      "Mark as Completed",
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

  const handleDeleteRide = async () => {
    showConfirm(
      "Delete Ride",
      "Are you sure you want to delete this ride? This cannot be undone.",
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

  const handleShare = async () => {
    const shareData = {
      title: 'Join my CabSync ride!',
      text: `Join my ride from ${ride.pickup} to ${ride.destination} on ${ride.date}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showNotification('Link Copied', 'Ride link copied to clipboard!');
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!ride) return <div className="text-center py-20">Ride not found.</div>;

  const isHost = ride.hostId === currentUser?.uid;
  const isApproved = myRequest?.status === 'approved';
  const isPending = myRequest?.status === 'pending';

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 animate-fade-in mb-24 lg:mb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left Column: Journey & People */}
        <div className="lg:col-span-7 space-y-8 md:space-y-12">
          
          {/* Journey Header */}
          <section className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 skeuo-card relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 md:mb-12">
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${isHost ? 'bg-zinc-900 text-[#FFD100]' : 'bg-[#FFD100] text-zinc-900'}`}>
                  <span className="material-symbols-outlined text-3xl md:text-4xl">{isHost ? 'admin_panel_settings' : 'commute'}</span>
                </div>
                <div>
                  <h1 className="font-black text-2xl md:text-4xl text-zinc-900 tracking-tight leading-tight">{isHost ? 'Your Ride' : 'Ride Details'}</h1>
                  <p className="text-zinc-400 font-medium text-xs md:text-base">Trip ID: #{ride.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  (ride.status || 'open').toLowerCase() === 'open' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {ride.status ? ride.status.toLowerCase() : 'open'}
                </span>
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all active:scale-90"
                  title="Share Ride"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>
            </div>

            <div className="space-y-10 relative ml-4 md:ml-6">
              <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-100"></div>
              
              <div className="flex items-start gap-8 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white skeuo-card flex items-center justify-center text-zinc-400 border-none">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-2">Pickup Point</p>
                  <p className="font-black text-xl md:text-2xl text-zinc-900 leading-tight mb-1">{ride.pickup}</p>
                  <p className="text-sm font-medium text-zinc-500">{ride.date} • {formatTime12h(ride.time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-8 relative z-10">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100] shadow-lg">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-2">Final Destination</p>
                  <p className="font-black text-xl md:text-2xl text-zinc-900 leading-tight">{ride.destination}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Pending Requests (Host only) */}
          {isHost && (
            <section className="bg-white rounded-[2.5rem] p-8 md:p-10 skeuo-card">
              <h2 className="font-black text-xl text-zinc-900 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD100]">person_add</span>
                Pending Requests ({requests.length})
              </h2>
              <div className="space-y-4">
                {requests.length > 0 ? (
                  requests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group">
                      <div className="relative shrink-0">
                        <img className="w-16 h-16 rounded-xl object-cover skeuo-card border-none" src={req.passengerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.passengerName)}&background=FFD100&color=000000`} alt={req.passengerName} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-zinc-900 truncate">{req.passengerName}</h3>
                        <p className="text-xs text-zinc-400">Interested in joining your ride</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleAccept(req)}
                          disabled={(ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4)) <= 0}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[#FFD100] text-zinc-900 font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 text-xs disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Accept
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-zinc-50 rounded-[2rem] border-dashed border-2 border-zinc-100">
                    <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">No pending requests</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Passenger List */}
          {(isHost || isApproved) && (
            <section className="bg-white rounded-[2.5rem] p-8 md:p-10 skeuo-card">
              <h2 className="font-black text-xl text-zinc-900 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD100]">group</span>
                Confirmed Passengers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Host Card (Always at the top) */}
                <div className="flex items-center justify-between gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group">
                  <Link to={`/user/${ride.hostId}`} className="flex items-center gap-4 min-w-0 hover:opacity-85 transition-all group/p">
                    <img 
                      className="w-12 h-12 rounded-xl object-cover skeuo-card border-none" 
                      src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000`} 
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000` }}
                      alt="Host" 
                    />
                    <div className="min-w-0">
                      <p className="font-black text-sm text-zinc-900 truncate group-hover/p:text-[#FFD100] transition-colors">{ride.hostName} {isHost && '(You)'}</p>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        Host
                        <span className="material-symbols-outlined text-[10px] text-[#FFD100]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Confirmed Passengers */}
                {ride.passengers?.length > 0 && (
                  ride.passengers.map((pId, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group">
                      <Link to={`/user/${pId}`} className="flex items-center gap-4 min-w-0 hover:opacity-85 transition-all group/p">
                        <img className="w-12 h-12 rounded-xl object-cover skeuo-card border-none" src={passengerDetails[pId]?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(passengerDetails[pId]?.name || 'P')}&background=FFD100&color=000000`} alt="Passenger" />
                        <div className="min-w-0">
                          <p className="font-black text-sm text-zinc-900 truncate group-hover/p:text-[#FFD100] transition-colors">{passengerDetails[pId]?.name || `User #${pId.slice(0, 4)}`}</p>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Passenger • Profile</p>
                        </div>
                      </Link>
                      {isHost && (
                        <button
                          onClick={() => handleRemovePassenger(pId)}
                          disabled={processing}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shrink-0"
                          title="Remove Passenger"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Economics & Actions */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Fare Economics */}
          <div className="bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFD100]/10 rounded-full blur-3xl group-hover:bg-[#FFD100]/20 transition-all duration-700"></div>
            
            <div className="text-center mb-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Estimated Your Split</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-black text-[#FFD100] mt-4">₹</span>
                <span className="text-6xl md:text-7xl font-black text-[#FFD100] tracking-tighter">
                  {Math.round((ride.fare || 0) / ((ride.passengers?.length || 0) + 1))}
                </span>
              </div>
              <p className="text-xs font-black text-white/30 uppercase tracking-widest mt-2">Paid directly to host</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Ride Fare</p>
                <p className="text-xl font-black">₹{ride.fare}</p>
              </div>
              <div className="text-center border-l border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Available Seats</p>
                <p className="text-xl font-black text-[#FFD100]">{(ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4))} of {ride.seats || 4}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10 mt-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Vehicle Type</p>
                <p className="text-xl font-black">{ride.carModel || 'Not Confirmed'}</p>
              </div>
              <div className="text-center border-l border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Comfort</p>
                <p className="text-xl font-black text-[#FFD100]">{ride.tags?.includes('AC') ? 'AC' : 'Non-AC'}</p>
              </div>
            </div>
          </div>

          {/* Contextual Actions */}
          <div className="space-y-4">
            {isHost ? (
              <div className="flex flex-col gap-4">
                {(ride.status || 'open').toLowerCase() === 'open' && (
                  <button 
                    onClick={handleCompleteRide}
                    className="w-full bg-[#FFD100] text-zinc-900 py-5 rounded-2xl font-black text-center shadow-xl hover:bg-yellow-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Mark as Completed
                  </button>
                )}

                <Link to={`/chat/${ride.id}`} className="w-full bg-white border border-zinc-100 text-zinc-900 py-5 rounded-2xl font-black text-center skeuo-card border-none hover:bg-zinc-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Open Group Chat
                </Link>

                <button 
                  onClick={handleDeleteRide}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-center hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete Ride
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {isApproved ? (
                  <>
                    <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] flex items-center gap-4 text-green-700">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Booking Confirmed</p>
                        <p className="text-xs font-medium opacity-80">You are ready to go!</p>
                      </div>
                    </div>
                    <Link to={`/chat/${ride.id}`} className="w-full bg-white border border-zinc-100 text-zinc-900 py-5 rounded-2xl font-black text-center skeuo-card border-none hover:bg-zinc-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">chat</span>
                      Open Group Chat
                    </Link>
                    <button 
                      onClick={handleLeaveRide} 
                      className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-center hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Leave Ride
                    </button>
                  </>
                ) : isPending ? (
                  <div className="bg-white rounded-[2rem] p-8 skeuo-card text-center space-y-6">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                      <span className="material-symbols-outlined text-3xl animate-pulse">hourglass_top</span>
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 text-lg mb-1 tracking-tight">Request Pending</p>
                      <p className="text-xs font-medium text-zinc-400">The host is reviewing your request.</p>
                    </div>
                    <button onClick={handleLeaveRide} className="text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 transition-all">Withdraw Request</button>
                  </div>
                ) : (
                  <button 
                    onClick={handleJoinRequest}
                    disabled={processing || ride.availableSeats === 0 || (ride.status || 'open').toLowerCase() !== 'open'}
                    className="w-full bg-[#FFD100] text-zinc-900 py-6 rounded-2xl font-black text-lg shadow-2xl hover:bg-yellow-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {(ride.status || 'open').toLowerCase() !== 'open' ? 'Ride Closed' : (ride.availableSeats === 0 ? 'Ride Full' : (processing ? 'Processing...' : 'Request to Join'))}
                  </button>
                )}
              </div>
            )}
          </div>


        </div>
      </div>
    </main>
  );
};

export default RideDetails;
