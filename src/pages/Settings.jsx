import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const Settings = () => {
  const { userProfile, currentUser, logout, updateProfileData } = useAuth();
  const { showConfirm, showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const updateSetting = async (key, value) => {
    try {
      const newSettings = {
        ...(userProfile?.privacySettings || {}),
        [key]: value
      };
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        privacySettings: newSettings
      });
      // Assuming updateProfileData merges or updates local context if implemented
      // or we just trust the snapshot listener in AuthContext to pick it up.
      showNotification("Success", "Setting updated.");
    } catch (err) {
      console.error("Error updating setting:", err);
      showNotification("Error", "Failed to update setting.");
    }
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

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-28 md:pb-12">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-900 hover:bg-zinc-50 transition-all">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Settings</h1>
        </div>

        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           {/* Privacy Settings */}
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
                      value={userProfile?.privacySettings?.showPhone || 'public'}
                      onChange={(e) => updateSetting('showPhone', e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD100]/20"
                    >
                       <option value="public">Everyone</option>
                       <option value="confirmed">Group Member</option>
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
                      value={userProfile?.privacySettings?.showHistory || 'public'}
                      onChange={(e) => updateSetting('showHistory', e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD100]/20"
                    >
                       <option value="public">Everyone</option>
                       <option value="confirmed">Group Member</option>
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
      </main>
    </div>
  );
};

export default Settings;
