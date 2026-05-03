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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!ride) return <div className="text-center py-20">Ride not found.</div>;

  const isHost = ride.hostId === currentUser?.uid;
  const isApproved = myRequest?.status === 'approved';
  const isPending = myRequest?.status === 'pending';

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in mb-20 md:mb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Header / Banner */}
        <div className="lg:col-span-12">
          <div className={`p-6 rounded-2xl flex items-center justify-between ${isHost ? 'bg-zinc-900 text-white' : 'bg-primary-container text-text-primary'}`}>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">
                {isHost ? 'admin_panel_settings' : 'commute'}
              </span>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{isHost ? 'Host View' : 'Ride Details'}</h1>
                <p className="opacity-80 text-sm">{isHost ? 'You are managing this ride' : `Organized by ${ride.hostName}`}</p>
              </div>
            </div>
            {isHost && (
              <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold border border-white/20">OWNER</span>
            )}
          </div>
        </div>

        {/* Left Column: Route Details */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl p-8 shadow-md border border-border-subtle overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                (ride.status || 'open') === 'open' ? 'bg-accent-light text-text-primary' : 'bg-red-100 text-red-700'
              }`}>
                {(ride.status || 'open').toUpperCase()}
              </span>
            </div>
            <h2 className="font-h3 text-h3 mb-8">Journey Path</h2>
            <div className="space-y-12 relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-100"></div>
              <div className="flex items-start gap-6 relative">
                <div className="z-10 bg-primary w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-label-caps text-secondary mb-1">PICKUP POINT</p>
                  <p className="text-xl font-bold text-text-primary">{ride.pickup}</p>
                  <p className="text-sm text-secondary mt-1">{ride.date} • {formatTime12h(ride.time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-6 relative">
                <div className="z-10 bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <span className="material-symbols-outlined text-sm text-white">location_on</span>
                </div>
                <div>
                  <p className="text-xs font-label-caps text-secondary mb-1">FINAL DESTINATION</p>
                  <p className="text-xl font-bold text-text-primary">{ride.destination}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Passenger List (Visible to Host or Approved Passengers) */}
          {(isHost || isApproved) && (
            <section className="bg-white rounded-2xl p-8 shadow-md border border-border-subtle">
              <h2 className="font-h3 text-h3 mb-6">Confirmed Passengers</h2>
              <div className="flex flex-wrap gap-4">
                {ride.passengers?.length > 0 ? (
                  ride.passengers.map((pId, i) => (
                    <div key={i} className="flex items-center gap-3 bg-zinc-50 p-2 pr-4 rounded-full border border-zinc-100">
                      <img className="w-10 h-10 rounded-full object-cover" src={passengerDetails[pId]?.photoUrl || `https://i.pravatar.cc/100?u=${pId}`} alt="Passenger" />
                      <span className="text-sm font-bold">{passengerDetails[pId]?.name || `User #${pId.slice(0, 4)}`}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary italic">No passengers confirmed yet.</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Actions & Meta */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fare Card */}
          <div className="bg-white p-8 rounded-2xl shadow-md border border-border-subtle flex flex-col items-center text-center">
            <span className="font-label-caps text-secondary uppercase tracking-widest text-xs mb-2">Estimated Total Fare</span>
            <p className="text-5xl font-black text-primary mb-2">₹{ride.fare}</p>
            <p className="text-sm text-secondary">Split between {ride.passengers?.length + 1} people</p>
            <div className="w-full h-px bg-zinc-100 my-6"></div>
            <div className="flex justify-between w-full">
              <div className="text-left">
                <p className="text-[10px] text-secondary uppercase font-bold">Seats Total</p>
                <p className="text-lg font-bold">{ride.seats}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-secondary uppercase font-bold">Available</p>
                <p className="text-lg font-bold text-primary">{ride.availableSeats}</p>
              </div>
            </div>
          </div>

          {/* Contextual Action Area */}
          <div className="space-y-4">
            {isHost ? (
              <>
                <Link to={`/manage-requests/${ride.id}`} className="w-full bg-primary-container text-text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-light transition-all shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Manage Requests
                </Link>
                <Link to={`/chat/${ride.id}`} className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all">
                  <span className="material-symbols-outlined">chat</span>
                  Ride Group Chat
                </Link>
                <button onClick={handleCancelRide} className="w-full text-error font-bold py-2 hover:underline">
                  Cancel this Ride
                </button>
              </>
            ) : (
              <>
                {isApproved ? (
                  <>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-700">
                      <span className="material-symbols-outlined">check_circle</span>
                      <p className="font-bold text-sm">Your spot is confirmed!</p>
                    </div>
                    <Link to={`/chat/${ride.id}`} className="w-full bg-primary-container text-text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-light transition-all shadow-lg">
                      <span className="material-symbols-outlined">chat</span>
                      Chat with Group
                    </Link>
                    <button onClick={handleLeaveRide} className="w-full text-error font-bold py-2 hover:underline text-sm">
                      Leave this Ride
                    </button>
                  </>
                ) : isPending ? (
                  <div className="bg-surface-container-low border border-border-subtle p-6 rounded-xl text-center space-y-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <span className="material-symbols-outlined text-primary animate-pulse">hourglass_top</span>
                    </div>
                    <div>
                      <p className="font-bold">Request Pending</p>
                      <p className="text-xs text-secondary mt-1">The host will review your request shortly.</p>
                    </div>
                    <button onClick={handleLeaveRide} className="text-secondary text-xs hover:underline">Withdraw Request</button>
                  </div>
                ) : (
                  <button 
                    onClick={handleJoinRequest}
                    disabled={processing || ride.availableSeats === 0 || ride.status !== 'open'}
                    className="w-full bg-primary-container text-text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-light transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">handshake</span>
                    {ride.status !== 'open' ? 'Ride Closed' : (ride.availableSeats === 0 ? 'Ride Full' : (processing ? 'Requesting...' : 'Request to Join'))}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Host Profile (Always visible for passengers, or "You" for host) */}
          <section className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
            <h4 className="text-xs font-label-caps text-secondary mb-4 uppercase">Ride Organizer</h4>
            <div className="flex items-center gap-4">
              <img 
                className="w-14 h-14 rounded-full object-cover border-2 border-primary-container" 
                src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000`} 
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000` }}
                alt="Host" 
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{isHost ? 'You (Host)' : ride.hostName}</p>
                <div className="flex items-center text-primary text-xs gap-1">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold">{isHost ? (userProfile?.rating || '5.0') : '4.9'}</span>
                </div>
              </div>
              {!isHost && (
                <button className="text-primary font-bold text-sm hover:underline">View Profile</button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RideDetails;
