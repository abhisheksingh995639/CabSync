import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';

const Messages = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenChats, setHiddenChats] = useState(() => {
    const saved = localStorage.getItem(`cabsync_hidden_chats_${currentUser?.uid}`);
    return saved ? JSON.parse(saved) : [];
  });

  const handleDeleteConversation = (e, rideId) => {
    e.preventDefault();
    e.stopPropagation();
    
    showConfirm(
      "Delete Conversation",
      "Are you sure you want to remove this chat from your inbox? This won't affect other members.",
      () => {
        const updated = [...hiddenChats, rideId];
        setHiddenChats(updated);
        localStorage.setItem(`cabsync_hidden_chats_${currentUser?.uid}`, JSON.stringify(updated));
        showNotification("Success", "Conversation hidden.");
      }
    );
  };

  useEffect(() => {
    if (!currentUser) return;

    const convoMap = new Map();

    const update = (docs) => {
      docs.forEach(d => convoMap.set(d.id, { id: d.id, ...d.data() }));
      setConversations(Array.from(convoMap.values()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    };

    const qHost = query(collection(db, 'rides'), where('hostId', '==', currentUser.uid));
    const qPassenger = query(collection(db, 'rides'), where('passengers', 'array-contains', currentUser.uid));

    const unsubHost = onSnapshot(qHost, snap => update(snap.docs));
    const unsubPassenger = onSnapshot(qPassenger, snap => update(snap.docs));

    return () => { unsubHost(); unsubPassenger(); };
  }, [currentUser]);

  const visibleConversations = conversations
    .filter(c => !hiddenChats.includes(c.id))
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.destination?.toLowerCase().includes(q) ||
        c.pickup?.toLowerCase().includes(q) ||
        c.hostName?.toLowerCase().includes(q)
      );
    });

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-16">
        {/* Header — single, clean title + count */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-end justify-between mb-6">
            <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight">
              Inbox<span className="editorial-italic text-[#FFD100]">.</span>
            </h1>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pb-2">{visibleConversations.length} Chats</span>
          </div>

          {/* Functional Search Bar */}
          <div className="relative max-w-2xl group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">search</span>
            <input 
              className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
              placeholder="Search by destination, pickup or host..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation Grid */}
        {visibleConversations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {visibleConversations.map(ride => (
              <Link key={ride.id} to={`/chat/${ride.id}`} className="block bg-white p-6 rounded-[2.5rem] skeuo-card transition-all cursor-pointer active:scale-[0.98] group">
                <div className="flex gap-4">
                  {/* Avatar with correctly anchored status dot */}
                  <div className="relative flex-shrink-0 w-14 h-14">
                    <img 
                      alt={ride.hostName || 'Host'} 
                      className="w-14 h-14 rounded-2xl object-cover skeuo-card border-none" 
                      src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName || 'H')}&background=FFD100&color=000000`} 
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm translate-x-1 translate-y-1"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-black text-zinc-900 truncate">Ride to {ride.destination}</p>
                      <button 
                        onClick={(e) => handleDeleteConversation(e, ride.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Hide conversation"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium truncate mt-1">
                      {ride.hostId === currentUser.uid ? 'You are the host' : `Host: ${ride.hostName}`}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Fixed member count: passengers + 1 host */}
                      <div className="bg-zinc-50 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-zinc-100">
                        <span className="material-symbols-outlined text-[14px] text-[#FFD100]">group</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {(ride.passengers?.length || 0) + 1} Member{(ride.passengers?.length || 0) + 1 !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="bg-zinc-50 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-zinc-100">
                        <span className="material-symbols-outlined text-[14px] text-zinc-400">event</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {ride.date ? new Date(ride.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty / No-results state with fixed padding so CTA isn't under bottom nav */
          <div className="bg-white rounded-[3rem] py-12 px-8 md:p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-300">
              {searchQuery
                ? <span className="material-symbols-outlined text-5xl">search_off</span>
                : <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
              }
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">
              {searchQuery ? 'No results found' : 'No active chats'}
            </h3>
            <p className="text-zinc-400 font-medium max-w-xs mx-auto mb-8">
              {searchQuery
                ? `No conversations match "${searchQuery}". Try a different search.`
                : 'Join or post a ride to start communicating with your carpool partners.'
              }
            </p>
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="bg-zinc-100 text-zinc-900 font-black px-8 py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                Clear Search
              </button>
            ) : (
              <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black px-8 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg">
                Start Exploring
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
