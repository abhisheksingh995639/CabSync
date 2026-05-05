import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
  const { userProfile, currentUser, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || ''
      });
    } else if (currentUser) {
      // Fallback for new users setting up profile
      setFormData({
        name: currentUser.displayName || '',
        phone: '',
        bio: ''
      });
    }
  }, [userProfile, currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileData(formData);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-xl md:py-2xl animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-xl flex items-center justify-between">
          <div>
            <h1 className="font-h1 text-h1 text-text-primary">Edit Profile</h1>
            <p className="text-text-secondary font-body-md mt-xs">Customize your public presence on CabSync.</p>
          </div>
          <button onClick={() => navigate('/profile')} className="text-text-secondary font-body-lg hover:underline transition-all">Cancel</button>
        </div>
        {/* Profile Edit Card Cluster */}
        <div className="grid grid-cols-1 gap-lg">
          {/* Photo Upload Section */}
          <section className="bg-background-primary rounded-xl p-xl shadow-md border border-border-subtle flex flex-col md:flex-row items-center gap-xl">
            <div className="relative group">
              <img 
                alt="Current profile photo" 
                className="w-32 h-32 rounded-full object-cover border-4 border-accent-light" 
                src={userProfile?.photoUrl || currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBuBjf9m55vfw7iLnkpLJrgc1bLy_GnXU9fC2MyI7ZAHswjmL1zXeAU2Bx990vcc6AbkYJ9fEngBW1l9-yWV0-3QnrxPlqn3Tb1sHN1lV9ROUbUplVI3dD9sBRgVLkrjerygpIvdrdi1KLvz9B7rSDbn4GmxcT5pcZ-STxhn_z_1d6BeNuVA8Sq54V-LzXH5HHsK2PlI2bQzU1EUQvX6vlvGpCdCzQmUTiLKIcm_7l1rkeBABUZag9aJTdQgBT1gblrk5lnuoowyFHh"} 
              />
              <button className="absolute bottom-0 right-0 bg-primary-container p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center hover:bg-accent-light transition-all active:scale-90">
                <span className="material-symbols-outlined text-text-primary text-[20px]">photo_camera</span>
              </button>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-h3 text-h3 text-text-primary">Profile Picture</h3>
              <p className="text-text-secondary text-sm mt-1">PNG, JPG or GIF. Max size 2MB.</p>
              <div className="mt-md flex flex-wrap justify-center md:justify-start gap-md">
                <button className="bg-primary-container text-text-primary px-lg py-2 rounded-full font-bold hover:bg-accent-light transition-all active:scale-95">Upload New</button>
                <button className="bg-background-secondary text-text-secondary px-lg py-2 rounded-full font-bold hover:bg-zinc-200 transition-all active:scale-95">Remove</button>
              </div>
            </div>
          </section>
          {/* Input Fields Grid */}
          <section className="bg-background-primary rounded-xl p-xl shadow-md border border-border-subtle">
            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 animate-fade-in">
                {/* Inputs Column */}
                <div className="flex flex-col gap-8 md:w-[40%]">
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

                {/* Bio Column */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Your Bio</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full flex-grow bg-white border border-zinc-100 rounded-[2rem] px-6 py-5 skeuo-input-tactile focus:ring-4 focus:ring-yellow-400/10 outline-none text-zinc-900 font-black text-sm transition-all resize-none min-h-[180px]" 
                    rows="4"
                    maxLength="250"
                    placeholder="Tell us a bit about yourself..."
                  ></textarea>
                  <p className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest mr-2">{formData.bio.length} / 250 characters</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
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
          </section>
        </div>
      </div>
    </main>
  );
};

export default EditProfile;
