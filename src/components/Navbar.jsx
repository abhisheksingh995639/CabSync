import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { userProfile } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return isActive(path)
      ? "text-zinc-900 font-black px-2 py-4 transition-colors"
      : "text-zinc-500 font-medium hover:text-yellow-600 transition-colors px-2 py-4";
  };

  const mobileNavLinkClass = (path) => {
    return isActive(path)
      ? "flex flex-col items-center justify-center text-[#FFD100] bg-zinc-900 rounded-2xl px-5 py-2 transition-all shadow-md"
      : "flex flex-col items-center justify-center text-zinc-500 px-5 py-2 hover:text-yellow-500 transition-all";
  };

  return (
    <>
      <header className="sticky top-0 w-full z-50 border-b bg-white/80 backdrop-blur-xl border-zinc-200 shadow-sm">
        <div className="flex justify-between items-center h-16 w-full px-6 max-w-screen-2xl mx-auto antialiased relative">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FFD100] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-zinc-900 font-black text-xl leading-none">c</span>
            </div>
            <div className="text-2xl font-black tracking-tighter text-zinc-900">CabSync</div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>Home</Link>
            <Link to="/browse" className={navLinkClass('/browse')}>Search</Link>
            <Link to="/post" className={navLinkClass('/post')}>Post</Link>
            <Link to="/my-joined-rides" className={navLinkClass('/my-joined-rides')}>Joined</Link>
            <Link to="/my-requests" className={navLinkClass('/my-requests')}>History</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:bg-zinc-100 hover:text-zinc-900 p-2.5 rounded-full transition-colors hidden sm:block" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            <Link to="/messages" className="material-symbols-outlined text-zinc-500 cursor-pointer hover:bg-zinc-100 hover:text-zinc-900 p-2.5 rounded-full transition-colors hidden sm:block" style={{ fontVariationSettings: "'FILL' 0" }}>chat_bubble</Link>
            <Link to="/profile" className="w-10 h-10 ml-2 rounded-[14px] overflow-hidden border-2 border-zinc-200 hover:border-yellow-400 transition-colors shadow-sm">
              <img 
                alt="User profile avatar" 
                src={userProfile?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=FFD100&color=000000`} 
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=FFD100&color=000000` }}
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-2 pb-safe bg-white/80 backdrop-blur-xl border-t border-zinc-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <Link to="/dashboard" className={mobileNavLinkClass('/dashboard')}>
          <span className="material-symbols-outlined">home</span>
          <span className="font-['Inter'] text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/browse" className={mobileNavLinkClass('/browse')}>
          <span className="material-symbols-outlined">search</span>
          <span className="font-['Inter'] text-[10px] font-bold">Search</span>
        </Link>
        <Link to="/post" className={mobileNavLinkClass('/post')}>
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-['Inter'] text-[10px] font-bold">Post</span>
        </Link>
        <Link to="/my-joined-rides" className={mobileNavLinkClass('/my-joined-rides')}>
          <span className="material-symbols-outlined">group</span>
          <span className="font-['Inter'] text-[10px] font-bold">Joined</span>
        </Link>
        <Link to="/my-requests" className={mobileNavLinkClass('/my-requests')}>
          <span className="material-symbols-outlined">history</span>
          <span className="font-['Inter'] text-[10px] font-bold">History</span>
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
