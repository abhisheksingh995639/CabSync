import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

const Chat = () => {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [ride, setRide] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!rideId) return;

    // Fetch Ride Details for header
    const unsubscribeRide = onSnapshot(doc(db, 'rides', rideId), (docSnap) => {
      if (docSnap.exists()) {
        setRide({ id: docSnap.id, ...docSnap.data() });
      }
    });

    // Fetch Messages
    const q = query(
      collection(db, 'messages'),
      where('rideId', '==', rideId)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort on client side to avoid needing a composite index
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.timestamp?.toMillis?.() || Date.now();
        const timeB = b.timestamp?.seconds || b.timestamp?.toMillis?.() || Date.now();
        return timeA - timeB;
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
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !rideId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        rideId,
        senderId: currentUser.uid,
        senderName: userProfile?.name || currentUser.displayName || 'Anonymous',
        senderPhoto: userProfile?.photoUrl || currentUser.photoURL || '',
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <main className="flex-grow flex flex-col overflow-hidden max-w-7xl mx-auto w-full bg-white h-[calc(100vh-64px)] animate-fade-in">
      <div className="flex flex-grow overflow-hidden">
        {/* Chat Area */}
        <section className="flex-grow flex flex-col bg-white">
          {/* Chat Header */}
          <header className="p-lg border-b border-border-subtle flex flex-col gap-sm md:flex-row md:items-center md:justify-between bg-white">
            <div className="flex items-center gap-md">
              <button onClick={() => navigate('/messages')} className="p-base"><span className="material-symbols-outlined">arrow_back</span></button>
              <div>
                <h1 className="font-body-lg text-body-lg font-bold">{ride?.destination ? `Ride to ${ride.destination}` : 'Ride Chat'}</h1>
                <div className="flex items-center gap-xs text-secondary text-xs">
                  <span className="material-symbols-outlined text-[14px]">route</span>
                  <span>{ride?.pickup} → {ride?.destination}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Message List */}
          <div className="flex-grow p-lg overflow-y-auto flex flex-col gap-lg bg-surface/30">
            <div className="bg-surface-container-low border border-primary-container/30 rounded-xl p-md flex gap-md items-start max-w-2xl mx-auto shadow-sm">
              <div className="bg-primary-container p-2 rounded-lg">
                <span className="material-symbols-outlined text-text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-primary">Safety First</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">This is a shared ride chat. Coordinate your pickup details safely.</p>
              </div>
            </div>

            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUser?.uid;
              return (
                <div key={msg.id || index} className={`flex gap-md max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <img 
                      className="w-10 h-10 rounded-full object-cover self-end mb-1" 
                      src={msg.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=FFD100&color=000000`} 
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=FFD100&color=000000` }}
                      alt={msg.senderName} 
                      title={msg.senderName} 
                    />
                  )}
                  <div className={`flex flex-col gap-xs ${isMe ? 'items-end' : ''}`}>
                    {!isMe && <span className="text-[10px] font-bold text-secondary ml-1">{msg.senderName}</span>}
                    <div className={`${isMe ? 'bg-primary-container text-text-primary rounded-br-none' : 'bg-white border border-border-subtle rounded-bl-none'} p-md rounded-2xl shadow-sm text-sm leading-relaxed`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-secondary ${isMe ? 'mr-1' : 'ml-1'}`}>
                      {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Field */}
          <footer className="p-lg bg-white border-t border-border-subtle">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-md">
              <div className="flex-grow relative">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full py-3 px-lg bg-surface-container-low border border-border-subtle rounded-full focus:border-primary-container outline-none text-sm" 
                  placeholder="Type a message..." 
                  type="text"
                />
              </div>
              <button type="submit" className="bg-primary-container text-text-primary p-md rounded-full shadow-md hover:bg-accent-light flex items-center justify-center disabled:opacity-50" disabled={!newMessage.trim()}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </form>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default Chat;
