import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const History = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchHistory = async () => {
      try {
        const hostedQuery = query(
          collection(db, 'rides'),
          where('hostId', '==', currentUser.uid),
          where('status', '==', 'completed')
        );

        const joinedQuery = query(
          collection(db, 'rides'),
          where('passengers', 'array-contains', currentUser.uid),
          where('status', '==', 'completed')
        );

        const [hostedSnap, joinedSnap] = await Promise.all([
          getDocs(hostedQuery),
          getDocs(joinedQuery)
        ]);

        const hostedRides = hostedSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'host' }));
        const joinedRides = joinedSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'passenger' }));

        const combined = [...hostedRides, ...joinedRides];
        const uniqueRides = Array.from(new Map(combined.map(r => [r.id, r])).values());
        uniqueRides.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setRides(uniqueRides);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching history:", err);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100]"></div>
      <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">Loading your history...</p>
    </div>
  );

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 animate-fade-in">
        
        <div className="mb-8 md:mb-16">
          <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-3 md:mb-4">
            Ride <span className="editorial-italic text-[#FFD100]">History.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm md:text-lg">View your past journeys and track your savings impact.</p>
        </div>

        {rides.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 skeuo-card text-center">
              <p className="font-black text-2xl md:text-4xl text-zinc-900 tracking-tighter">{rides.length}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Total Rides</p>
            </div>
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 skeuo-card text-center">
              <p className="font-black text-2xl md:text-4xl text-zinc-900 tracking-tighter">{rides.filter(r => r.role === 'host').length}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">As Host</p>
            </div>
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 skeuo-card text-center">
              <p className="font-black text-2xl md:text-4xl text-zinc-900 tracking-tighter">{rides.filter(r => r.role === 'passenger').length}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">As Rider</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl text-center">
              <p className="font-black text-2xl md:text-4xl text-[#FFD100] tracking-tighter">₹{rides.reduce((acc, r) => acc + Math.round((r.fare || 0) / ((r.passengers?.length || 0) + 1)), 0)}</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Total Spent</p>
            </div>
          </div>
        )}

        {rides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {rides.map((ride) => {
              const totalPeople = (ride.passengers?.length || 0) + 1;
              const perPersonFare = Math.round((ride.fare || 0) / totalPeople);
              const isHost = ride.role === 'host';

              return (
                <Link key={ride.id} to={`/ride/${ride.id}`} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 skeuo-card flex flex-col group hover:-translate-y-1.5 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="flex flex-col gap-3">
                      <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest w-max ${
                        isHost ? 'bg-zinc-900 text-[#FFD100] border-zinc-800' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {isHost ? 'Ride Host' : 'Rider'}
                      </div>
                      <h4 className="font-black text-lg md:text-xl text-zinc-900 leading-tight truncate">{ride.destination}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Fare</p>
                      <p className="text-xl md:text-2xl font-black text-zinc-900 tracking-tighter">₹{perPersonFare}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-4 text-zinc-500">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      <span className="text-xs font-bold">{ride.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      <span className="text-xs font-bold truncate">{ride.pickup}</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-zinc-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Completed
                    </span>
                    <span className="material-symbols-outlined text-zinc-300 group-hover:text-[#FFD100] group-hover:translate-x-1 transition-all">arrow_forward</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 md:p-24 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-8 text-zinc-200">
              <span className="material-symbols-outlined text-5xl">history</span>
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-4">No completed rides yet</h3>
            <p className="text-zinc-400 font-medium max-w-sm mb-12 text-sm leading-relaxed">
              Once you finish a shared journey, it will appear here. Start your carpooling history by finding a ride today.
            </p>
            <button onClick={() => navigate('/browse')} className="bg-zinc-900 text-[#FFD100] font-black px-12 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl">
              Start Exploring
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
