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
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFD100]"></div>
    </div>
  );

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-28 md:pb-12">

        {/* Page Header */}
        <div className="mb-6 md:mb-10">
          <h1 className="font-black text-3xl md:text-5xl text-zinc-900 tracking-tight mb-1">
            Ride <span className="editorial-italic text-[#FFD100]">History.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm md:text-base">Your completed shared journeys.</p>
        </div>

        {/* Stats Strip */}
        {rides.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 md:mb-8">
            <div className="bg-white rounded-2xl p-3 md:p-4 skeuo-card text-center">
              <p className="font-black text-xl md:text-2xl text-zinc-900">{rides.length}</p>
              <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Total Rides</p>
            </div>
            <div className="bg-white rounded-2xl p-3 md:p-4 skeuo-card text-center">
              <p className="font-black text-xl md:text-2xl text-zinc-900">{rides.filter(r => r.role === 'host').length}</p>
              <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">As Host</p>
            </div>
            <div className="bg-white rounded-2xl p-3 md:p-4 skeuo-card text-center">
              <p className="font-black text-xl md:text-2xl text-zinc-900">{rides.filter(r => r.role === 'passenger').length}</p>
              <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">As Rider</p>
            </div>
          </div>
        )}

        {rides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {rides.map((ride) => {
              const totalPeople = (ride.passengers?.length || 0) + 1;
              const perPersonFare = Math.round((ride.fare || 0) / totalPeople);
              const isHost = ride.role === 'host';

              return (
                <div key={ride.id} className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 skeuo-card flex flex-col group hover:-translate-y-1 transition-all duration-300">
                  {/* Card Top Row */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-lg flex items-center gap-1 bg-green-50 text-green-700 border border-green-100">
                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="font-black text-[8px] uppercase tracking-widest">Completed</span>
                      </div>
                      <div className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                        isHost
                          ? 'bg-zinc-900 text-[#FFD100] border-zinc-700'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {isHost ? 'Ride Host' : 'Rider'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">{ride.date}</span>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">From</p>
                      <p className="font-bold text-sm text-zinc-600 truncate">{ride.pickup}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 flex-shrink-0 flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-zinc-200"></div>
                        <span className="material-symbols-outlined text-[12px] text-[#FFD100]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">To</p>
                      <h4 className="font-black text-base md:text-lg text-zinc-900 truncate">{ride.destination}</h4>
                    </div>
                    {!isHost && (
                      <p className="text-[10px] text-zinc-400 font-medium">Organized by {ride.hostName}</p>
                    )}
                  </div>

                  {/* Bottom: Fare + Link */}
                  <div className="pt-4 border-t border-zinc-50 flex justify-between items-center">
                    <Link
                      to={`/ride/${ride.id}`}
                      className="text-zinc-900 font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all hover:text-[#FFD100]"
                    >
                      View Details
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </Link>
                    <div className="text-right">
                      <p className="font-black text-zinc-900 text-base">₹{perPersonFare}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">per person</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-10 md:p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 text-zinc-300">
              <span className="material-symbols-outlined text-4xl md:text-5xl">history</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-2">No completed rides yet</h3>
            <p className="text-zinc-400 font-medium max-w-xs mx-auto mb-6 text-sm">Once a shared ride is marked complete by the host, it will appear here for both the host and all passengers.</p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-zinc-900 text-[#FFD100] font-black px-8 py-3.5 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg text-sm"
            >
              Find a Ride
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
