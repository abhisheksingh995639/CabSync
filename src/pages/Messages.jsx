import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';

const Messages = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showNotification } = useNotification();
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

    // We want to find all rides where the user is either the host OR an approved passenger
    // Since Firestore doesn't support complex OR queries across different fields well with 'array-contains', 
    // we'll fetch both sets and combine them.

    const fetchConversations = async () => {
      try {
        // 1. Rides where I am the host
        const qHost = query(collection(db, 'rides'), where('hostId', '==', currentUser.uid));
        
        // 2. Rides where I am an approved passenger (my UID is in 'passengers' array)
        const qPassenger = query(collection(db, 'rides'), where('passengers', 'array-contains', currentUser.uid));

        const unsubHost = onSnapshot(qHost, (snapshot) => {
          updateConvos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), 'host');
        });

        const unsubPassenger = onSnapshot(qPassenger, (snapshot) => {
          updateConvos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), 'passenger');
        });

        return () => {
          unsubHost();
          unsubPassenger();
        };
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setLoading(false);
      }
    };

    const convoMap = new Map();
    const updateConvos = (newRides, type) => {
      newRides.forEach(ride => convoMap.set(ride.id, ride));
      setConversations(Array.from(convoMap.values()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    };

    fetchConversations();
  }, [currentUser]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-6">Inbox<span className="editorial-italic text-[#FFD100]">.</span></h1>
          <div className="relative max-w-2xl group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">search</span>
            <input 
              className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
              placeholder="Search conversations..." 
              type="text"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-2xl text-zinc-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FFD100]">forum</span>
              Active Conversations
            </h2>
          </div>

          {conversations.filter(c => !hiddenChats.includes(c.id)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {conversations.filter(c => !hiddenChats.includes(c.id)).map(ride => (
                <Link key={ride.id} to={`/chat/${ride.id}`} className="block bg-white p-6 rounded-[2.5rem] skeuo-card transition-all cursor-pointer active:scale-[0.98] group">
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img alt="Ride host" className="w-14 h-14 rounded-2xl object-cover skeuo-card border-none" src={ride.hostPhoto || "https://lh3.googleusercontent.com/aida-public/AB6AXuDdfU0ffpwOHhvz7Tvve5sq_rEUiGmX8gnC8lnIHR7J3QZz-n7iI_IXO89--bJ7z_0rYTI5z_PJciSxYRvv2irIXp0XTzD9-SoWHtbhrA7pyIxsOoXHXbt6NuLcaB9dnYVA6MUzeh0TEAxHwTBDuE9PxGhQNZfrjtkiT2iZi5aULwcxheMqORUEX_LP9ulquicXFQ62nIF1Htg2Y6ARynbpgwntrqsQmrKO4fk58_Z3DcAqoxxwrwJVe3iKEA5C6Ww_8SJPb9GSNPqX"} />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-zinc-900 truncate">Ride to {ride.destination}</p>
                        <button 
                          onClick={(e) => handleDeleteConversation(e, ride.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                      <p className="text-sm text-zinc-500 font-medium truncate mt-1">Chat with {ride.hostId === currentUser.uid ? 'passengers' : ride.hostName}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="bg-zinc-50 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-zinc-100">
                          <span className="material-symbols-outlined text-[14px] text-[#FFD100]">group</span>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{ride.passengers?.length || 0} Members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-300">
                <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 mb-2">No active chats found</h3>
              <p className="text-zinc-400 font-medium max-w-xs mx-auto mb-8">Join or post a ride to start communicating with your carpool partners.</p>
              <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black px-8 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg">Start Exploring</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
