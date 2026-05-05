import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

const Profile = () => {
  const { userProfile: currentUserProfile, currentUser, logout } = useAuth();
  const { id } = useParams();
  const { showConfirm } = useNotification();
  const navigate = useNavigate();
  
  const targetUserId = id || currentUser?.uid;
  const isOwnProfile = !id || id === currentUser?.uid;

  const [viewedProfile, setViewedProfile] = useState(undefined);
  const [recentRides, setRecentRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [rideStats, setRideStats] = useState({
    total: 0,
    asHost: 0,
    asRider: 0,
    totalSpent: 0
  });

  // Fetch target user's profile if not our own
  useEffect(() => {
    if (!targetUserId) return;

    if (isOwnProfile) {
      setViewedProfile(currentUserProfile);
    } else {
      const fetchTargetProfile = async () => {
        try {
          const docRef = doc(db, 'users', targetUserId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setViewedProfile(docSnap.data());
          } else {
            setViewedProfile(null);
          }
        } catch (err) {
          console.error("Error fetching target profile:", err);
          setViewedProfile(null);
        }
      };
      fetchTargetProfile();
    }
  }, [targetUserId, isOwnProfile, currentUserProfile]);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchRecent = async () => {
      try {
        const hostedQ = query(
          collection(db, 'rides'),
          where('hostId', '==', targetUserId),
          where('status', '==', 'completed')
        );
        const joinedQ = query(
          collection(db, 'rides'),
          where('passengers', 'array-contains', targetUserId),
          where('status', '==', 'completed')
        );
        const [hostedSnap, joinedSnap] = await Promise.all([getDocs(hostedQ), getDocs(joinedQ)]);
        const hosted = hostedSnap.docs.map(d => ({ id: d.id, ...d.data(), role: 'host' }));
        const joined = joinedSnap.docs.map(d => ({ id: d.id, ...d.data(), role: 'passenger' }));
        const combined = [...hosted, ...joined];
        const unique = Array.from(new Map(combined.map(r => [r.id, r])).values());
        unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        // Calculate dynamic stats
        const stats = {
          total: unique.length,
          asHost: unique.filter(r => r.role === 'host').length,
          asRider: unique.filter(r => r.role === 'passenger').length,
          totalSpent: unique.reduce((acc, r) => acc + Math.round((r.fare || 0) / ((r.passengers?.length || 0) + 1)), 0)
        };
        
        setRideStats(stats);
        setRecentRides(unique.slice(0, 3));
        setLoadingRides(false);
      } catch (err) {
        console.error("Profile recent rides error:", err);
        setLoadingRides(false);
      }
    };

    fetchRecent();
  }, [targetUserId]);

  if (!currentUser) return null;

  const handleLogout = () => {
    showConfirm(
      "Sign Out",
      "Are you sure you want to log out of CabSync?",
      async () => {
        try {
          await logout();
          navigate('/login');
        } catch (err) {
          console.error("Logout error:", err);
        }
      }
    );
  };

  if (viewedProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFD100]"></div>
      </div>
    );
  }

  if (viewedProfile === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-white rounded-3xl skeuo-card flex items-center justify-center mb-6 text-zinc-200">
          <span className="material-symbols-outlined text-5xl">person_off</span>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">User Not Found</h2>
        <p className="text-zinc-400 font-medium max-w-sm mb-8">The profile you're looking for doesn't exist or may have been removed.</p>
        <button onClick={() => navigate(-1)} className="bg-zinc-900 text-[#FFD100] font-black px-8 py-3 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95">
          Go Back
        </button>
      </div>
    );
  }

  const displayName = viewedProfile?.name || 'User';
  const displayEmail = viewedProfile?.email || '';
  const displayPhoto = viewedProfile?.photoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FFD100&color=000000`;

  // Build dynamic star rating
  const rating = parseFloat(viewedProfile?.rating || 0);
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-28 md:pb-12">

        {/* ── PROFILE HEADER ── */}
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] skeuo-card p-5 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-row gap-4 md:gap-8 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[1.5rem] overflow-hidden border-2 border-zinc-100 shadow-sm">
                <img
                  alt={displayName}
                  className="w-full h-full object-cover"
                  src={displayPhoto}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FFD100&color=000000`;
                  }}
                />
              </div>
              {viewedProfile?.isVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#FFD100] text-zinc-900 p-1 rounded-full shadow-md">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="font-black text-xl md:text-3xl text-zinc-900 tracking-tight truncate">{displayName}</h1>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-zinc-400 font-medium text-xs md:text-sm truncate flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      {displayEmail}
                    </p>
                    {viewedProfile?.phone && (
                      <p className="text-zinc-400 font-medium text-xs md:text-sm truncate flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {viewedProfile.phone}
                      </p>
                    )}
                  </div>
                  {/* Dynamic Star Rating */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex text-[#FFD100]">
                      {rating > 0 ? (
                        <>
                          {[...Array(fullStars)].map((_, i) => (
                            <span key={`full-${i}`} className="material-symbols-outlined text-[18px] drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                          {hasHalf && (
                            <span className="material-symbols-outlined text-[18px] drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                          )}
                          {[...Array(emptyStars)].map((_, i) => (
                            <span key={`empty-${i}`} className="material-symbols-outlined text-[18px] text-zinc-200">star</span>
                          ))}
                        </>
                      ) : (
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No rating yet</span>
                      )}
                    </div>
                    {rating > 0 && (
                      <span className="text-xs font-black text-zinc-700 ml-1">{rating.toFixed(1)}</span>
                    )}
                    {viewedProfile?.reviewsCount > 0 && (
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">({viewedProfile.reviewsCount} reviews)</span>
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to="/edit-profile"
                      className="flex items-center gap-1.5 bg-zinc-900 text-[#FFD100] font-black text-xs md:text-sm px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span className="hidden sm:inline">Edit Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 font-black text-xs md:text-sm px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span className="hidden sm:inline">Log Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-zinc-500 font-medium text-xs md:text-sm mt-3 leading-relaxed line-clamp-2">
                {viewedProfile?.bio || (isOwnProfile ? "No bio added yet. Edit your profile to tell the community about yourself." : "No bio added yet.")}
              </p>


            </div>
          </div>
        </div>

        {/* ── STATS + ACTIVITY GRID ── */}
        <div className={`grid grid-cols-1 ${isOwnProfile ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-2xl mx-auto w-full'} gap-4 md:gap-6`}>

          {/* Ride Stats Card */}
          <div className="md:col-span-1 bg-white rounded-2xl skeuo-card p-5 md:p-6">
            <h3 className="font-black text-base md:text-lg text-zinc-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FFD100] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Ride Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-zinc-400 text-lg">route</span>
                  <span className="font-bold text-sm text-zinc-600">Total Rides</span>
                </div>
                <span className="font-black text-lg text-zinc-900">{rideStats.total}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-zinc-400 text-lg">person_pin_circle</span>
                  <span className="font-bold text-sm text-zinc-600">As Host</span>
                </div>
                <span className="font-black text-lg text-zinc-900">{rideStats.asHost}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-zinc-400 text-lg">airline_seat_recline_normal</span>
                  <span className="font-bold text-sm text-zinc-600">As Rider</span>
                </div>
                <span className="font-black text-lg text-zinc-900">{rideStats.asRider}</span>
              </div>
              {isOwnProfile && (
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#FFD100] text-lg">payments</span>
                    <span className="font-bold text-sm text-white/60">Total Spent</span>
                  </div>
                  <span className="font-black text-lg text-[#FFD100]">₹{rideStats.totalSpent}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-zinc-400 text-lg">verified_user</span>
                  <span className="font-bold text-sm text-zinc-600">Verified</span>
                </div>
                {viewedProfile?.isVerified ? (
                  <span className="bg-green-50 text-green-700 font-black text-[10px] px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-widest">Yes</span>
                ) : (
                  <span className="bg-zinc-100 text-zinc-400 font-black text-[10px] px-2 py-0.5 rounded-lg border border-zinc-200 uppercase tracking-widest">No</span>
                )}
              </div>
            </div>
          </div>

          {/* History Card - Private */}
          {isOwnProfile && (
            <div className="md:col-span-2 bg-white rounded-2xl skeuo-card p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base md:text-lg text-zinc-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFD100] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  History
                </h3>
                <Link to="/history" className="text-[#FFD100] font-black text-xs hover:text-yellow-600 transition-colors flex items-center gap-0.5">
                  View all
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>

              {loadingRides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFD100]"></div>
                </div>
              ) : recentRides.length > 0 ? (
                <div className="space-y-3">
                  {recentRides.map((ride) => {
                    const totalPeople = (ride.passengers?.length || 0) + 1;
                    const perPerson = Math.round((ride.fare || 0) / totalPeople);
                    return (
                      <Link
                        key={ride.id}
                        to={`/ride/${ride.id}`}
                        className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            ride.role === 'host' ? 'bg-zinc-900 text-[#FFD100]' : 'bg-[#FFD100] text-zinc-900'
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {ride.role === 'host' ? 'person_pin_circle' : 'airline_seat_recline_normal'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-zinc-900 truncate">{ride.pickup} → {ride.destination}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-zinc-400 font-medium">{ride.date}</p>
                              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="font-black text-sm text-zinc-900">₹{perPerson}</p>
                          <p className="text-[9px] text-zinc-400 font-black uppercase">per person</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-3 text-zinc-300">
                    <span className="material-symbols-outlined text-2xl">history</span>
                  </div>
                  <p className="font-black text-sm text-zinc-900 mb-1">No ride history yet</p>
                  <p className="text-zinc-400 text-xs font-medium max-w-xs mb-4">Complete your first shared ride to see your activity here.</p>
                  <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black text-xs px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all active:scale-95">
                    Find a Ride
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
