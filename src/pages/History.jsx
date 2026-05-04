import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';

const History = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // We need to fetch both rides where I was the host AND where I was a passenger
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

        // Combine and remove duplicates (though unlikely, it's safe)
        const combined = [...hostedRides, ...joinedRides];
        const uniqueRides = Array.from(new Map(combined.map(r => [r.id, r])).values());

        // Sort by creation date or a completed timestamp if we had one. Using createdAt for now.
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-black text-4xl md:text-6xl text-zinc-900 tracking-tight mb-2">Ride <span className="editorial-italic text-[#FFD100]">History.</span></h1>
          <p className="text-zinc-500 font-medium">View your past completed shared journeys.</p>
        </div>

        {rides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-[2.5rem] p-6 skeuo-card flex flex-col group hover:-translate-y-1 transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="px-3 py-1 rounded-lg flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span className="font-black text-[9px] uppercase tracking-widest">COMPLETED</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 shadow-inner">
                    <span className="material-symbols-outlined text-sm">event</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                    <h4 className="font-black text-xl text-zinc-900 truncate">{ride.destination}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <span className="material-symbols-outlined text-lg text-zinc-300">location_on</span>
                    <span className="truncate font-medium">From {ride.pickup}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-bold">
                    {ride.date} • Organized by {ride.hostName}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-zinc-50 flex justify-between items-center">
                  <Link to={`/ride/${ride.id}`} className="text-zinc-900 font-black text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Link>
                  <p className="font-black text-zinc-900">₹{ride.fare}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center skeuo-card border-dashed border-2 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-300">
              <span className="material-symbols-outlined text-5xl">history</span>
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">No completed rides yet</h3>
            <p className="text-zinc-400 font-medium max-w-xs mx-auto mb-8">Once your shared rides are completed by the host, they will appear here.</p>
            <button onClick={() => navigate('/browse')} className="bg-zinc-900 text-[#FFD100] font-black px-8 py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg">Find a Ride</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
