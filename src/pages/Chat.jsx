import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

const Chat = () => {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [ride, setRide] = useState(undefined); // undefined = loading, null = not found
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);
  useEffect(() => {
    if (!rideId) return;

    const getTimestampMs = (timestamp) => {
      if (!timestamp) return 0;
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
      }
      if (typeof timestamp.seconds === 'number') {
        return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1000000);
      }
      if (typeof timestamp === 'number') {
        return timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      }
      if (typeof timestamp === 'string') {
        const parsed = Date.parse(timestamp);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const unsubscribeRide = onSnapshot(doc(db, 'rides', rideId), (docSnap) => {
      if (docSnap.exists()) {
        setRide({ id: docSnap.id, ...docSnap.data() });
      } else {
        setRide(null); // Not found
      }
    });

    const q = query(
      collection(db, 'messages'),
      where('rideId', '==', rideId)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => {
        return getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp);
      });
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (err) => {
      console.error("Chat Messages Error:", err);
    });

    return () => {
      unsubscribeRide();
      unsubscribeMessages();
    };
  }, [rideId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser || !rideId || sending) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage(''); // Optimistic clear
    try {
      await addDoc(collection(db, 'messages'), {
        rideId,
        senderId: currentUser.uid,
        senderName: userProfile?.name || currentUser.displayName || 'Anonymous',
        senderPhoto: userProfile?.photoUrl || currentUser.photoURL || '',
        text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setNewMessage(text); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  // Keyboard: Enter sends, Shift+Enter = newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading state
  if (ride === undefined) {
    return (
      <main className="flex-grow flex flex-col overflow-hidden w-full bg-white h-[calc(100vh-64px-80px)] md:h-[calc(100vh-64px)] animate-fade-in">
        <div className="flex items-center gap-4 p-6 border-b border-zinc-100">
          <button onClick={() => navigate('/messages')} className="p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-40 bg-zinc-100 rounded-full"></div>
            <div className="h-3 w-64 bg-zinc-50 rounded-full"></div>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFD100]"></div>
        </div>
      </main>
    );
  }

  // Not found state
  if (ride === null) {
    return (
      <main className="flex-grow flex flex-col overflow-hidden w-full bg-white h-[calc(100vh-64px-80px)] md:h-[calc(100vh-64px)] animate-fade-in">
        <div className="flex items-center gap-4 p-6 border-b border-zinc-100">
          <button onClick={() => navigate('/messages')} className="p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-black text-zinc-900">Chat Room</h1>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-300">
            <span className="material-symbols-outlined text-5xl">chat_error</span>
          </div>
          <h2 className="font-black text-xl text-zinc-900">Chat not found</h2>
          <p className="text-zinc-400 font-medium max-w-xs">This ride chat doesn't exist or you may not have access to it.</p>
          <button onClick={() => navigate('/messages')} className="mt-4 bg-zinc-900 text-[#FFD100] font-black px-8 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95">
            Back to Inbox
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-x-0 top-16 bottom-20 md:bottom-0 bg-white flex flex-col">
      
      {/* Chat Header */}
      <header className="px-4 md:px-6 py-3 border-b border-zinc-100 flex items-center gap-3 bg-white flex-shrink-0 z-10">
        <button 
          onClick={() => navigate('/messages')} 
          className="p-2 rounded-xl hover:bg-zinc-50 transition-all active:scale-90 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-zinc-700">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName || 'H')}&background=FFD100&color=000000`}
            alt={ride.hostName}
          />
          <div className="min-w-0">
            <h1 className="font-black text-zinc-900 truncate leading-tight text-base">Ride to {ride.destination}</h1>
            <div className="flex items-center gap-1 text-zinc-400 text-xs mt-0.5">
              <span className="material-symbols-outlined text-[12px]">route</span>
              <span className="truncate">{ride.pickup} → {ride.destination}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 flex-shrink-0">
          <span className="material-symbols-outlined text-[14px] text-[#FFD100]">group</span>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{(ride.passengers?.length || 0) + 1}</span>
        </div>
      </header>

      {/* Message List — only this scrolls */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-[#F5F5F0]/50">
        
        {/* Safety Banner */}
        <div className="bg-white border border-yellow-100 rounded-2xl p-4 flex gap-3 items-start max-w-lg mx-auto w-full shadow-sm">
          <div className="bg-[#FFD100]/20 p-2 rounded-xl flex-shrink-0">
            <span className="material-symbols-outlined text-[#FFD100] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
          <div>
            <h4 className="font-black text-xs text-zinc-900 uppercase tracking-widest mb-1">Safety First</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">This is a shared ride chat. Coordinate your pickup details safely and never share sensitive personal info.</p>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-zinc-300 shadow-sm">
              <span className="material-symbols-outlined text-4xl">chat</span>
            </div>
            <p className="font-black text-sm text-zinc-400 uppercase tracking-widest">No messages yet</p>
            <p className="text-xs text-zinc-300 mt-1">Be the first to say hello!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser?.uid;
          const showAvatar = !isMe && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);
          return (
            <div key={msg.id || index} className={`flex gap-3 ${isMe ? 'self-end flex-row-reverse' : 'self-start'} max-w-[85%] md:max-w-[65%]`}>
              <div className="w-8 flex-shrink-0 self-end mb-5">
                {showAvatar && !isMe && (
                  <img 
                    className="w-8 h-8 rounded-xl object-cover" 
                    src={msg.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=FFD100&color=000000`} 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=FFD100&color=000000` }}
                    alt={msg.senderName} 
                    title={msg.senderName} 
                  />
                )}
              </div>
              <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{msg.senderName}</span>
                )}
                <div className={`${
                  isMe 
                    ? 'bg-[#FFD100] text-zinc-900 rounded-br-sm' 
                    : 'bg-white border border-zinc-100 text-zinc-900 rounded-bl-sm'
                } px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed font-medium`}>
                  {msg.text}
                </div>
                <span className={`text-[9px] font-bold text-zinc-300 uppercase tracking-widest ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {msg.timestamp ? new Date(
                    msg.timestamp.toDate ? msg.timestamp.toDate().getTime() : 
                    (typeof msg.timestamp === 'number' ? (msg.timestamp < 10000000000 ? msg.timestamp * 1000 : msg.timestamp) : Date.parse(msg.timestamp))
                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — always pinned to the bottom */}
      <footer className="px-4 md:px-6 py-3 bg-white border-t border-zinc-100 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-grow relative">
            <textarea 
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-3 px-5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none text-sm transition-all resize-none leading-relaxed overflow-hidden" 
              placeholder="Type a message..." 
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button 
            type="submit" 
            className="bg-[#FFD100] text-zinc-900 w-12 h-12 rounded-2xl shadow-lg hover:bg-yellow-400 flex items-center justify-center disabled:opacity-40 disabled:grayscale transition-all active:scale-90 flex-shrink-0" 
            disabled={!newMessage.trim() || sending}
          >
            <span className="material-symbols-outlined font-black text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {sending ? 'hourglass_top' : 'send'}
            </span>
          </button>
        </form>
      </footer>
    </main>
  );
};

export default Chat;

