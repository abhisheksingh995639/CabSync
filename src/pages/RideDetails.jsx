import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, getDoc } from 'firebase/firestore';
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

    return () => {
      unsubscribeRide();
      unsubscribeRequest();
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
          const updatedPassengers = ride.passengers.filter(id => id !== currentUser.uid);
          await updateDoc(rideRef, { 
            passengers: updatedPassengers,
            availableSeats: ride.seats - updatedPassengers.length
          });
          if (myRequest) {
            await updateDoc(doc(db, 'requests', myRequest.id), { status: 'cancelled' });
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
                  (ride.status || 'open') === 'open' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {ride.status || 'open'}
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

          {/* Passenger List */}
          {(isHost || isApproved) && (
            <section className="bg-white rounded-[2.5rem] p-8 md:p-10 skeuo-card">
              <h2 className="font-black text-xl text-zinc-900 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD100]">group</span>
                Confirmed Passengers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ride.passengers?.length > 0 ? (
                  ride.passengers.map((pId, i) => (
                    <div key={i} className="flex items-center gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group">
                      <img className="w-12 h-12 rounded-xl object-cover skeuo-card border-none" src={passengerDetails[pId]?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(passengerDetails[pId]?.name || 'P')}&background=FFD100&color=000000`} alt="Passenger" />
                      <div className="min-w-0">
                        <p className="font-black text-sm text-zinc-900 truncate">{passengerDetails[pId]?.name || `User #${pId.slice(0, 4)}`}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Passenger</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center bg-zinc-50 rounded-[2rem] border-dashed border-2 border-zinc-100">
                    <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">No passengers yet</p>
                  </div>
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
                <p className="text-xl font-black text-[#FFD100]">{ride.availableSeats} of {ride.seats}</p>
              </div>
            </div>
          </div>

          {/* Contextual Actions */}
          <div className="space-y-4">
            {isHost ? (
              <div className="flex flex-col gap-4">
                <Link to={`/manage-requests/${ride.id}`} className="w-full bg-[#FFD100] text-zinc-900 py-5 rounded-2xl font-black text-center shadow-xl hover:bg-yellow-400 transition-all active:scale-[0.98]">
                  Manage Requests
                </Link>
                <Link to={`/chat/${ride.id}`} className="w-full bg-white border border-zinc-100 text-zinc-900 py-5 rounded-2xl font-black text-center skeuo-card border-none hover:bg-zinc-50 transition-all active:scale-[0.98]">
                  Open Group Chat
                </Link>
                <button onClick={handleCancelRide} className="text-red-500 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors py-2 mx-auto w-max">
                  Cancel Entire Ride
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
                    <Link to={`/chat/${ride.id}`} className="w-full bg-zinc-900 text-[#FFD100] py-5 rounded-2xl font-black text-center shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98]">
                      Start Chatting
                    </Link>
                    <button onClick={handleLeaveRide} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors pt-2">
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
                    disabled={processing || ride.availableSeats === 0 || ride.status !== 'open'}
                    className="w-full bg-[#FFD100] text-zinc-900 py-6 rounded-2xl font-black text-lg shadow-2xl hover:bg-yellow-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {ride.status !== 'open' ? 'Ride Closed' : (ride.availableSeats === 0 ? 'Ride Full' : (processing ? 'Processing...' : 'Request to Join'))}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Host Info */}
          <section className="bg-white rounded-[2.5rem] p-8 skeuo-card">
            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6">Ride Organizer</h4>
            <div className="flex items-center gap-5">
              <div className="relative">
                <img 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover skeuo-card border-none" 
                  src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000`} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000` }}
                  alt="Host" 
                />
                <div className="absolute -bottom-1 -right-1 bg-[#FFD100] text-zinc-900 p-1 rounded-full shadow-md border-2 border-white">
                  <span className="material-symbols-outlined text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg text-zinc-900 truncate leading-tight mb-1">{isHost ? 'You (Host)' : ride.hostName}</p>
                <div className="flex items-center gap-2">
                  <div className="flex text-[#FFD100]">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-black text-xs text-zinc-700">{isHost ? (userProfile?.rating || '5.0') : '4.9'}</span>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">• Trusted Host</span>
                </div>
              </div>
              {!isHost && (
                <Link to={`/profile/${ride.hostId}`} className="text-[#FFD100] font-black text-[10px] uppercase tracking-widest hover:text-yellow-600 transition-all">Profile</Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RideDetails;
