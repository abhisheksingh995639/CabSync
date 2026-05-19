import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';

const Profile = () => {
  const { userProfile: currentUserProfile, currentUser, logout } = useAuth();
  const { id } = useParams();
  const { showConfirm, showNotification } = useNotification();
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
  const [activeProfileTab, setActiveProfileTab] = useState('activity');

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [hasMutualRide, setHasMutualRide] = useState(false);

  useEffect(() => {
    if (!currentUser || !targetUserId || isOwnProfile) return;

    const checkMutualRide = async () => {
      try {
        const q1 = query(
          collection(db, 'rides'),
          where('hostId', '==', targetUserId),
          where('passengers', 'array-contains', currentUser.uid)
        );
        const q2 = query(
          collection(db, 'rides'),
          where('hostId', '==', currentUser.uid),
          where('passengers', 'array-contains', targetUserId)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        if (!snap1.empty || !snap2.empty) {
          setHasMutualRide(true);
        } else {
          setHasMutualRide(false);
        }
      } catch (err) {
        console.error("Error checking mutual ride:", err);
      }
    };

    checkMutualRide();
  }, [currentUser, targetUserId, isOwnProfile]);

  const canViewPhone = () => {
    if (isOwnProfile) return true;
    const preference = viewedProfile?.privacySettings?.showPhone || 'public';
    if (preference === 'public') return true;
    if (preference === 'confirmed') return hasMutualRide;
    return false;
  };

  const canViewHistory = () => {
    if (isOwnProfile) return true;
    const preference = viewedProfile?.privacySettings?.showHistory || 'public';
    if (preference === 'public') return true;
    if (preference === 'confirmed') return hasMutualRide;
    return false;
  };

  const canViewBio = () => {
    if (isOwnProfile) return true;
    const preference = viewedProfile?.privacySettings?.showBio || 'public';
    if (preference === 'public') return true;
    return false;
  };

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

  const handleDeactivateAccount = async () => {
    showConfirm(
      "Deactivate Account",
      "Your profile will be hidden from other users. You can reactivate your account anytime by logging back in. Proceed?",
      async () => {
        setSubmitting(true);
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
             isDeactivated: true,
             deactivatedAt: serverTimestamp()
          });
          
          await logout();
          showNotification("Success", "Account deactivated. See you soon!");
          navigate('/login');
        } catch (err) {
          console.error("Deactivate error:", err);
          showNotification("Error", "Failed to deactivate account.");
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleDeleteAccount = async () => {
    showConfirm(
      "Delete Account",
      "This action is permanent and cannot be undone. All your ride history and profile data will be deleted. Are you absolutely sure?",
      async () => {
        setSubmitting(true);
        try {
          // 1. Delete Firestore Data
          await updateDoc(doc(db, 'users', currentUser.uid), {
             isDeleted: true,
             deletedAt: serverTimestamp()
          });

          // 2. Delete Auth Account
          await currentUser.delete();
          
          showNotification("Success", "Your account has been deleted.");
          navigate('/signup');
        } catch (err) {
          console.error("Delete account error:", err);
          if (err.code === 'auth/requires-recent-login') {
            showNotification("Security Check", "Please log out and log back in before deleting your account for security reasons.");
          } else {
            showNotification("Error", "Failed to delete account. Please try again later.");
          }
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleRateUser = async () => {
    if (selectedRating === 0) {
      showNotification("Error", "Please select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', targetUserId);
      const currentRating = viewedProfile.rating || 0;
      const currentCount = viewedProfile.reviewsCount || 0;
      
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + selectedRating) / newCount;

      await updateDoc(userRef, {
        rating: newRating,
        reviewsCount: increment(1)
      });

      setViewedProfile(prev => ({
        ...prev,
        rating: newRating,
        reviewsCount: newCount
      }));

      showNotification("Success", "Rating submitted! Thank you.");
      setIsRateModalOpen(false);
      setSelectedRating(0);
    } catch (err) {
      console.error("Error rating user:", err);
      showNotification("Error", "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) {
      showNotification("Error", "Please provide a reason for the report.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetUserId,
        targetName: displayName,
        reporterId: currentUser.uid,
        reporterName: currentUserProfile?.name || 'Anonymous',
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'pending'
      });

      showNotification("Success", "Report submitted. We will review it shortly.");
      setIsReportModalOpen(false);
      setReportReason('');
    } catch (err) {
      console.error("Error reporting user:", err);
      showNotification("Error", "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = {
        ...(viewedProfile?.privacySettings || {}),
        [key]: value
      };
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        privacySettings: newSettings
      });
      setViewedProfile(prev => ({
        ...prev,
        privacySettings: newSettings
      }));
      showNotification("Success", "Setting updated.");
    } catch (err) {
      console.error("Error updating setting:", err);
      showNotification("Error", "Failed to update setting.");
    }
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
                    {canViewPhone() && viewedProfile?.phone && (
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
                {isOwnProfile ? (
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
                ) : (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setIsRateModalOpen(true)}
                      className="flex items-center gap-1.5 bg-[#FFD100] text-zinc-900 font-black text-xs md:text-sm px-4 py-2.5 rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span>Rate</span>
                    </button>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center gap-1.5 bg-white text-red-500 font-black text-xs md:text-sm px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-50 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">report</span>
                      <span>Report</span>
                    </button>
                  </div>
                )}
              </div>

              {canViewBio() && (
                <p className="text-zinc-500 font-medium text-xs md:text-sm mt-3 leading-relaxed line-clamp-2">
                  {viewedProfile?.bio || (isOwnProfile ? "No bio added yet. Edit your profile to tell the community about yourself." : "No bio added yet.")}
                </p>
              )}


            </div>
          </div>
        </div>

        {/* ── PROFILE TABS ── */}
        {isOwnProfile && (
          <div className="flex gap-1 bg-white p-1.5 rounded-2xl skeuo-card mb-6 overflow-x-auto whitespace-nowrap">
            <button 
              onClick={() => setActiveProfileTab('activity')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeProfileTab === 'activity' ? 'bg-zinc-900 text-[#FFD100] shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              Activity
            </button>
            <button 
              onClick={() => setActiveProfileTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeProfileTab === 'settings' ? 'bg-zinc-900 text-[#FFD100] shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              Privacy Settings
            </button>
          </div>
        )}

        {/* ── STATS + ACTIVITY GRID ── */}
        {activeProfileTab === 'activity' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Ride Stats Card */}
          <div className="bg-white rounded-2xl skeuo-card p-5 md:p-6 h-full">
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
          {canViewHistory() && (
            <div className="bg-white rounded-2xl skeuo-card p-5 md:p-6 h-full">
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
        ) : (
          /* ── PRIVACY SETTINGS TAB ── */
          <div className="max-w-3xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-[2.5rem] skeuo-card p-8">
                <h3 className="text-xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[#FFD100]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                   Privacy Controls
                </h3>
                <p className="text-zinc-500 text-sm mb-8 font-medium">Control who can see your personal information on CabSync.</p>

                <div className="space-y-6">
                   {/* Phone Privacy */}
                   <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                         <p className="font-black text-zinc-900">Phone Number Visibility</p>
                         <p className="text-xs text-zinc-500 font-medium">Choose who can see your phone number.</p>
                      </div>
                      <select 
                        value={viewedProfile?.privacySettings?.showPhone || 'public'}
                        onChange={(e) => updateSetting('showPhone', e.target.value)}
                        className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD100]/20"
                      >
                         <option value="public">Everyone</option>
                         <option value="confirmed">Confirmed Passengers</option>
                         <option value="private">Only Me</option>
                      </select>
                   </div>

                   {/* History Privacy */}
                   <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                         <p className="font-black text-zinc-900">Ride History Visibility</p>
                         <p className="text-xs text-zinc-500 font-medium">Choose who can view your completed ride history.</p>
                      </div>
                      <select 
                        value={viewedProfile?.privacySettings?.showHistory || 'public'}
                        onChange={(e) => updateSetting('showHistory', e.target.value)}
                        className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD100]/20"
                      >
                         <option value="public">Everyone</option>
                         <option value="confirmed">Confirmed Passengers</option>
                         <option value="private">Only Me</option>
                      </select>
                   </div>

                   {/* Bio Visibility */}
                   <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                         <p className="font-black text-zinc-900">Profile Bio Visibility</p>
                         <p className="text-xs text-zinc-500 font-medium">Choose who can read your bio.</p>
                      </div>
                      <select 
                        value={viewedProfile?.privacySettings?.showBio || 'public'}
                        onChange={(e) => updateSetting('showBio', e.target.value)}
                        className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD100]/20"
                      >
                         <option value="public">Everyone</option>
                         <option value="private">Only Me</option>
                      </select>
                   </div>

                   <div className="pt-6 border-t border-zinc-100">
                      <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
                         <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">info</span>
                         <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            Your safety is our priority. Regardless of these settings, ride hosts and confirmed passengers will always see your essential contact details for safety coordination.
                         </p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Danger Zone */}
             <div className="bg-red-50 rounded-[2.5rem] border border-red-100 p-8">
                <h3 className="text-xl font-black text-red-600 mb-2 flex items-center gap-2">
                   <span className="material-symbols-outlined">dangerous</span>
                   Danger Zone
                </h3>
                <p className="text-red-700/60 text-sm mb-6 font-medium">Temporarily hide your profile or permanently remove your data.</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleDeactivateAccount}
                    disabled={submitting}
                    className="flex-1 bg-white text-red-600 border border-red-200 font-black px-8 py-3 rounded-2xl hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Deactivate Account'}
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={submitting}
                    className="flex-1 bg-red-600 text-white font-black px-8 py-3 rounded-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Delete My Account'}
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* ── RATE MODAL ── */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Rate {displayName}</h2>
            <p className="text-zinc-500 text-sm mb-8">How was your journey with this user?</p>
            
            <div className="flex justify-center gap-2 mb-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    selectedRating >= star ? 'bg-[#FFD100] text-zinc-900 shadow-lg shadow-yellow-400/30' : 'bg-zinc-50 text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: `'FILL' ${selectedRating >= star ? 1 : 0}` }}>star</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={submitting}
                onClick={handleRateUser}
                className="w-full bg-zinc-900 text-[#FFD100] font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="w-full bg-zinc-50 text-zinc-400 font-black py-4 rounded-2xl hover:bg-zinc-100 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-zinc-900 mb-2 text-red-600">Report User</h2>
            <p className="text-zinc-500 text-sm mb-6">Please specify why you are reporting this user. Our team will review it.</p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex: No-show, inappropriate behavior, etc."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-red-100 outline-none font-medium h-32 mb-6"
            />

            <div className="flex flex-col gap-3">
              <button
                disabled={submitting}
                onClick={handleReportUser}
                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-full bg-zinc-50 text-zinc-400 font-black py-4 rounded-2xl hover:bg-zinc-100 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
