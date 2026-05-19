import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Spooky",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Precious",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Cookie"
];

const EditProfile = () => {
  const { userProfile, currentUser, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  // Build full avatar list: Google photo first (if available), then presets
  const avatarOptions = React.useMemo(() => {
    const list = [];
    const googlePhoto = currentUser?.photoURL;
    if (googlePhoto) list.push(googlePhoto);
    list.push(...AVATAR_PRESETS);
    return list;
  }, [currentUser]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || ''
      });
      setSelectedAvatar(userProfile.photoUrl || currentUser?.photoURL || avatarOptions[0] || '');
    } else if (currentUser) {
      setFormData({
        name: currentUser.displayName || '',
        phone: ''
      });
      setSelectedAvatar(currentUser.photoURL || avatarOptions[0] || '');
    }
  }, [userProfile, currentUser, avatarOptions]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileData({
        ...formData,
        photoUrl: selectedAvatar
      });
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100]"></div>
      </div>
    );
  }

  const isGooglePhoto = (url) => currentUser?.photoURL && url === currentUser.photoURL;

  return (
    <main className="bg-[#F5F5F0] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-28 md:pb-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl md:text-3xl text-zinc-900 tracking-tight">Edit Profile</h1>
            <p className="text-zinc-400 font-medium text-sm mt-1">Customize your public presence on CabSync.</p>
          </div>
          <button onClick={() => navigate('/profile')} className="text-zinc-400 font-black text-sm hover:text-zinc-600 transition-colors">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar Section */}
          <section className="bg-white rounded-2xl md:rounded-[2.5rem] skeuo-card p-5 md:p-8">
            <div className="flex flex-col items-center gap-6">
              {/* Current Avatar Preview */}
              <div className="relative group">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl md:rounded-[1.5rem] overflow-hidden border-2 border-zinc-100 shadow-sm bg-zinc-50">
                  <img
                    alt="Current profile photo"
                    className="w-full h-full object-cover"
                    src={selectedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=FFD100&color=000000`}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=FFD100&color=000000`;
                    }}
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div className="w-full">
                <h3 className="font-black text-sm text-zinc-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFD100] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                  Choose Profile Avatar
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  {avatarOptions.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        selectedAvatar === url
                          ? 'border-[#FFD100] ring-4 ring-[#FFD100]/20 scale-110 shadow-lg shadow-yellow-400/20'
                          : 'border-zinc-100 hover:border-zinc-300 hover:scale-105'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Avatar option ${i + 1}`}
                        className="w-full h-full object-cover bg-zinc-50"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${i}&background=FFD100&color=000000`;
                        }}
                      />
                      {isGooglePhoto(url) && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center">
                          <span className="text-white text-[7px] font-black uppercase tracking-wider">Google</span>
                        </div>
                      )}
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-[#FFD100]/10 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#FFD100] flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-zinc-900 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Input Fields */}
          <section className="bg-white rounded-2xl md:rounded-[2.5rem] skeuo-card p-5 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 skeuo-input-tactile focus:ring-4 focus:ring-yellow-400/10 outline-none text-zinc-900 font-black text-sm transition-all"
                  type="text"
                  required
                  placeholder="Your full name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300">call</span>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 skeuo-input-tactile focus:ring-4 focus:ring-yellow-400/10 outline-none text-zinc-900 font-black text-sm transition-all"
                    type="tel"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              disabled={loading}
              className="w-full sm:flex-1 bg-zinc-900 text-[#FFD100] py-5 rounded-2xl font-black shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FFD100]"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined font-black">save</span>
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto bg-white border border-zinc-100 text-zinc-400 px-10 py-5 rounded-2xl font-black hover:bg-zinc-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfile;
