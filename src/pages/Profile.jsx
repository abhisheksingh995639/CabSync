import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Profile = () => {
  const { userProfile, currentUser, logout } = useAuth();
  const { showConfirm } = useNotification();
  const navigate = useNavigate();

  if (!currentUser) return null; // Let ProtectedRoute handle this

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

  // If we have an auth user but the firestore profile is still fetching, show a brief loader
  // But if it's explicitly null (not undefined), it means the doc doesn't exist yet
  if (userProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  // Fallback data if userProfile is null (new user)
  const displayName = userProfile?.name || currentUser?.displayName || 'User';
  const displayEmail = userProfile?.email || currentUser?.email || '';
  const displayPhoto = userProfile?.photoUrl || currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBoOEHihZ-Dg-7bItVNaExQIXkhqzjTbx5a0lwbt9izoMgClEAG1J7H2uGbwJbOsSB3sbX1Xp99WPsZk3GxSgaUI5fW_QfuyTyhj4wJ2tjy2ITcf19Gj0zKB5m7q7HQMS3A8LbJ8d4MiK6tnthZvIDMWQ8-McFBRjr149roEmDtEjg_E_Y_zJRiAjW-V0LzYSDF85P8odWaMmVTSh8qMM8zowFcxCUP941rFaYdUrZsrBGg7OJTOdzo2rNRs8OdVyWZ3QLh-75eODOY";

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      {/* Profile Header Section */}
      <div className="flex flex-col md:flex-row gap-xl mb-2xl">
        {/* User Visuals */}
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-primary-container shadow-md overflow-hidden bg-surface">
            <img 
              alt={displayName} 
              className="w-full h-full object-cover" 
              src={displayPhoto} 
            />
          </div>
          {userProfile?.isVerified && (
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-primary-container text-on-primary-container p-sm rounded-full shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          )}
        </div>
        {/* User Info & Actions */}
        <div className="flex flex-col justify-center flex-grow space-y-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
            <div>
              <h1 className="font-h1 text-h1 text-text-primary mb-xs">{displayName}</h1>
              <div className="flex items-center gap-sm">
                <div className="flex text-primary-container">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                </div>
                <span className="font-body-lg text-text-primary">{userProfile?.rating || '0.0'} <span className="text-text-secondary font-normal">({userProfile?.reviewsCount || 0} reviews)</span></span>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/edit-profile" className="flex-1 md:flex-none px-8 py-3 bg-primary-container text-text-primary font-bold rounded-2xl shadow-sm hover:bg-accent-light transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xl">edit</span>
                {userProfile?.name ? 'Edit Profile' : 'Setup Profile'}
              </Link>
              <button 
                onClick={handleLogout}
                className="flex-1 md:flex-none px-8 py-3 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                Log Out
              </button>
            </div>
          </div>
          <p className="font-body-md text-text-secondary max-w-2xl leading-relaxed">
            {userProfile?.bio || "No bio added yet. Click 'Setup Profile' to tell us about yourself!"}
          </p>
          <div className="flex flex-wrap gap-sm">
            {userProfile?.preferences?.map((pref, i) => (
              <span key={i} className="px-md py-xs bg-surface-container-low text-on-surface-variant font-label-caps rounded-full border border-outline-variant uppercase">{pref}</span>
            )) || (
              <span className="px-md py-xs bg-surface-container-low text-on-surface-variant font-label-caps rounded-full border border-outline-variant uppercase">No preferences set</span>
            )}
          </div>
        </div>
      </div>
      {/* Bento Grid Stats & History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Stats Card */}
        <div className="md:col-span-1 bg-white p-xl rounded-xl shadow-md border border-zinc-100 flex flex-col justify-between">
          <h3 className="font-h3 text-h3 mb-lg">Ride Stats</h3>
          <div className="space-y-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="p-sm bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">route</span>
                </div>
                <span className="font-body-md text-text-secondary">Total Rides</span>
              </div>
              <span className="font-h3 text-h3 text-text-primary">{userProfile?.totalRides || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="p-sm bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">handshake</span>
                </div>
                <span className="font-body-md text-text-secondary">Verified</span>
              </div>
              <span className="font-h3 text-h3 text-text-primary">{userProfile?.isVerified ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="p-sm bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">savings</span>
                </div>
                <span className="font-body-md text-text-secondary">Community Impact</span>
              </div>
              <span className="font-h3 text-h3 text-text-primary">High</span>
            </div>
          </div>
        </div>
        {/* Ride History Highlights */}
        <div className="md:col-span-2 bg-white p-xl rounded-xl shadow-md border border-zinc-100">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-h3 text-h3">Recent Activity</h3>
            <Link to="/my-joined-rides" className="text-primary font-body-lg hover:underline transition-all">View all</Link>
          </div>
          <div className="space-y-md">
            <div className="p-12 text-center bg-zinc-50 rounded-xl border border-dashed border-border-subtle">
              <p className="text-secondary">Visit 'My Rides' to see your full history.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
