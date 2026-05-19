import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { formatTime12h } from '../utils/formatters';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { showNotification, showConfirm, showRestrictedModal } = useNotification();
  const [myRides, setMyRides] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchData, setSearchData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('restricted') === 'true') {
      showRestrictedModal();
      // Remove the param from URL to prevent re-triggering on refresh
      navigate('/dashboard', { replace: true });
    }
  }, [location, showRestrictedModal, navigate]);

  useEffect(() => {
    if (currentUser) {
      const savedPickup = localStorage.getItem('cabsync_temp_pickup');
      const savedDestination = localStorage.getItem('cabsync_temp_destination');
      if (savedPickup || savedDestination) {
        setSearchData(prev => ({
          ...prev,
          pickup: savedPickup || prev.pickup,
          destination: savedDestination || prev.destination
        }));
        localStorage.removeItem('cabsync_temp_pickup');
        localStorage.removeItem('cabsync_temp_destination');
      }
    }
  }, [currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchData.pickup) queryParams.append('from', searchData.pickup);
    if (searchData.destination) queryParams.append('to', searchData.destination);
    if (searchData.date) queryParams.append('date', searchData.date);
    navigate(`/browse?${queryParams.toString()}`);
  };

  useEffect(() => {
    if (!currentUser) return;

    const myRidesQuery = query(
      collection(db, 'rides'),
      where('hostId', '==', currentUser.uid),
      where('status', 'in', ['open', 'OPEN'])
    );

    const unsubscribeMyRides = onSnapshot(myRidesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyRides(docs.slice(0, 3));
    }, (err) => console.error("Dashboard MyRides Error:", err));

    const myRequestsQuery = query(
      collection(db, 'requests'),
      where('passengerId', '==', currentUser.uid)
    );

    const unsubscribeMyRequests = onSnapshot(myRequestsQuery, async (snapshot) => {
      const requestsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(req => req.status !== 'cancelled');
      
      const resolvedRequests = await Promise.all(
        requestsData.map(async (req) => {
          try {
            const rideSnap = await getDoc(doc(db, 'rides', req.rideId));
            if (rideSnap.exists()) {
              const rData = rideSnap.data();
              return {
                ...req,
                rideDate: rData.date,
                rideTime: rData.time,
                rideFare: rData.fare
              };
            }
          } catch (e) {
            console.error("Error fetching ride for request:", e);
          }
          return req;
        })
      );

      resolvedRequests.sort((a, b) => {
        const tA = a.timestamp?.seconds || a.timestamp || 0;
        const tB = b.timestamp?.seconds || b.timestamp || 0;
        return tB - tA;
      });

      setMyRequests(resolvedRequests);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard MyRequests Error:", err);
      setLoading(false);
    });

    return () => {
      unsubscribeMyRides();
      unsubscribeMyRequests();
    };
  }, [currentUser]);

  const handleDeleteRequest = async (requestId) => {
    showConfirm(
      "Delete Status",
      "Are you sure you want to remove this request status from your dashboard?",
      async () => {
        const originalRequests = [...myRequests];
        setMyRequests(prev => prev.filter(r => r.id !== requestId));
        try {
          await deleteDoc(doc(db, 'requests', requestId));
          showNotification("Success", "Request status removed.");
        } catch (err) {
          console.error("Error deleting request:", err);
          setMyRequests(originalRequests);
          showNotification("Error", "Failed to delete request.");
        }
      }
    );
  };

  const statusConfig = {
    approved: { bg: 'bg-green-50 text-green-700 border-green-100', icon: 'verified' },
    completed:{ bg: 'bg-blue-50 text-blue-700 border-blue-100',   icon: 'check_circle' },
    pending:  { bg: 'bg-zinc-50 text-zinc-500 border-zinc-100',   icon: 'schedule' },
    cancelled:{ bg: 'bg-zinc-100 text-zinc-400 border-zinc-200',  icon: 'block' },
    rejected: { bg: 'bg-red-50 text-red-700 border-red-100',      icon: 'block' },
  };

  return (
    <div className="bg-[#F5F5F0] min-h-screen">

      {/* ── HERO / SEARCH ── */}
      <section className="relative overflow-hidden px-4 sm:px-8 pt-8 pb-6 md:pt-16 md:pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD100]/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Greeting */}
            <div className="mb-4 md:mb-8">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Welcome back</p>
              <h1 className="font-black text-3xl md:text-6xl text-zinc-900 tracking-tight leading-tight">
                Go anywhere with<br />
                <span className="editorial-italic text-[#FFD100]">CabSync.</span>
              </h1>
              <p className="text-sm md:text-base font-medium text-zinc-500 mt-2 md:mt-3">
                Reliable rides, verified community, smarter splitting.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl md:rounded-[2rem] skeuo-card p-4 md:p-6 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 text-base">location_on</span>
                  <input
                    value={searchData.pickup}
                    onChange={(e) => setSearchData({...searchData, pickup: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 md:py-3.5 bg-zinc-50 border-none rounded-xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none placeholder:text-zinc-300 font-medium text-sm"
                    placeholder="Pickup"
                    type="text"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 text-base">flag</span>
                  <input
                    value={searchData.destination}
                    onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 md:py-3.5 bg-zinc-50 border-none rounded-xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none placeholder:text-zinc-300 font-medium text-sm"
                    placeholder="Destination"
                    type="text"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 text-base">calendar_today</span>
                  <input
                    value={searchData.date}
                    onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 md:py-3.5 bg-zinc-50 border-none rounded-xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none font-medium text-sm text-zinc-500"
                    type="date"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 text-base">schedule</span>
                  <input
                    value={searchData.time}
                    onChange={(e) => setSearchData({...searchData, time: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 md:py-3.5 bg-zinc-50 border-none rounded-xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none font-medium text-sm text-zinc-500"
                    type="time"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#FFD100] text-zinc-900 font-black py-3 md:py-4 rounded-xl skeuo-button-raised hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Search Rides
              </button>
            </form>
          </div>

          <div className="hidden lg:block relative">
            <div className="skeuo-card rounded-[3rem] bg-white p-3 transition-all duration-700 hover:shadow-3xl group">
              <div className="relative rounded-[2.5rem] overflow-hidden">
                <img className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCc3QLkYg3ChC4RSyl0dcWt5tVNCgKYspHHjw8NTEq1-5CW_eYSvtk0gtQbMGCIEmNIHQlpsE5PnVNJR4FRi5MKkLZ0NdXFyo7yHn7-_Dhs_OKXu5n4S0BiyInKIvAgcn_503qnaGvoJi9C95Orwz74gvgDV3-o8AWbuGr6TMX9tcN9emPRhZq8mn-bnRDnmUN7a-g5c2LUQyF8Nw166cK0_pDbwxFPiSMQoQX-s72FeTRqdnL5ddFkgvi9-L-cugQn0-A_Gc2LzIE" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="font-black text-xl">Verified & Safe</p>
                    <p className="text-white/80 font-medium text-sm">Every rider is ID-verified for your safety.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-5 md:pb-10">
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[
            { title: "Browse",  icon: "search",       link: "/browse"          },
            { title: "Post",    icon: "add_circle",   link: "/post"            },
            { title: "Joined",  icon: "group",        link: "/my-joined-rides" },
            { title: "History", icon: "history",      link: "/history"         },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.link}
              className="skeuo-card bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-zinc-50 flex items-center justify-center mb-1.5 md:mb-2 group-hover:bg-[#FFD100]/10 transition-colors">
                <span className="material-symbols-outlined text-lg md:text-2xl text-[#FFD100]">{action.icon}</span>
              </div>
              <span className="font-black text-[10px] md:text-sm text-zinc-900 leading-tight">{action.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MY POSTED RIDES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-5 md:pb-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-base md:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFD100] text-xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_pin_circle</span>
            My Posted Rides
          </h2>
          <Link to="/my-posted-rides" className="text-[#FFD100] font-black text-xs md:text-sm hover:text-yellow-600 transition-colors flex items-center gap-0.5">
            View all
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>
        </div>

        {myRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {myRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-2xl md:rounded-[2rem] skeuo-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                {/* Yellow top accent */}
                <div className="h-1 w-full bg-[#FFD100]" />
                <div className="p-4 md:p-6">
                  {/* Header status and fare */}
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-50 pb-3">
                    <span className="bg-[#FFD100]/10 text-zinc-800 border border-[#FFD100]/20 px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">airline_seat_recline_normal</span>
                      {(ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4))} / {ride.seats || 4} seats
                    </span>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Total Fare</span>
                      <span className="text-sm md:text-base font-black text-zinc-900">₹{ride.fare}</span>
                    </div>
                  </div>

                  {/* Path Map (Single Line) */}
                  <div className="flex items-center justify-between gap-4 mb-4 pt-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">From</p>
                      <p className="text-zinc-700 font-bold text-xs md:text-sm truncate">{ride.pickup}</p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-300 text-base flex-shrink-0 self-end mb-1">arrow_forward</span>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">To</p>
                      <p className="text-zinc-900 font-black text-xs md:text-sm truncate">{ride.destination}</p>
                    </div>
                  </div>

                  {/* Departure Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-zinc-50">
                    <div className="min-w-0">
                      <p className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Departure Date</p>
                      <p className="text-zinc-700 font-bold text-[10px] md:text-xs truncate">{ride.date}</p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Departure Time</p>
                      <p className="text-zinc-900 font-black text-[10px] md:text-xs truncate">{formatTime12h(ride.time)}</p>
                    </div>
                  </div>

                  <Link
                    to={`/ride/${ride.id}`}
                    className="block w-full bg-zinc-900 text-white text-center font-black py-2.5 md:py-3.5 rounded-lg md:rounded-xl hover:bg-zinc-800 transition-all text-xs md:text-sm active:scale-95"
                  >
                    Manage Ride
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-8 md:p-14 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-3 md:mb-5 text-zinc-200">
              <span className="material-symbols-outlined text-3xl md:text-4xl">directions_car</span>
            </div>
            <h3 className="text-base md:text-xl font-black text-zinc-900 mb-1 md:mb-2">No rides posted yet</h3>
            <p className="text-zinc-400 font-medium mb-4 md:mb-7 max-w-xs text-sm">Share your journey and split the costs with the community.</p>
            <Link to="/post" className="bg-zinc-900 text-[#FFD100] font-black py-2.5 md:py-4 px-6 md:px-10 rounded-xl hover:bg-zinc-800 transition-all text-sm active:scale-95">
              Post Your First Ride
            </Link>
          </div>
        )}
      </section>

      {/* ── REQUEST STATUS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 md:pb-12">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-base md:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFD100] text-xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            Request Status
          </h2>
          <Link to="/my-joined-rides" className="text-[#FFD100] font-black text-xs md:text-sm hover:text-yellow-600 transition-colors flex items-center gap-0.5">
            View all
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>
        </div>

        {myRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {myRequests.map(req => {
              const cfg = statusConfig[req.status] || statusConfig.rejected;
              return (
                <div key={req.id} className="bg-white rounded-2xl md:rounded-[2rem] skeuo-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                  {/* Yellow top accent */}
                  <div className="h-1 w-full bg-[#FFD100]" />
                  <div className="p-4 md:p-6">
                    {/* Header status and fare */}
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-50 pb-3">
                      <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-md border flex items-center gap-1 ${cfg.bg}`}>
                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {cfg.icon}
                        </span>
                        <span className="font-black text-[9px] md:text-[10px] uppercase tracking-widest">{req.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Total Fare</span>
                        <span className="text-sm md:text-base font-black text-zinc-900">₹{req.rideFare || '—'}</span>
                      </div>
                    </div>

                    {/* Path Map (Single Line) */}
                    <div className="flex items-center justify-between gap-4 mb-4 pt-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">From</p>
                        <p className="text-zinc-700 font-bold text-xs md:text-sm truncate">{req.ridePickup}</p>
                      </div>
                      <span className="material-symbols-outlined text-zinc-300 text-base flex-shrink-0 self-end mb-1">arrow_forward</span>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">To</p>
                        <p className="text-zinc-900 font-black text-xs md:text-sm truncate">{req.rideDestination}</p>
                      </div>
                    </div>

                    {/* Departure Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-zinc-50">
                      <div className="min-w-0">
                        <p className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Departure Date</p>
                        <p className="text-zinc-700 font-bold text-[10px] md:text-xs truncate">{req.rideDate || '—'}</p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Departure Time</p>
                        <p className="text-zinc-900 font-black text-[10px] md:text-xs truncate">
                          {req.rideTime ? formatTime12h(req.rideTime) : '—'}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/ride/${req.rideId}`}
                      className="block w-full bg-zinc-900 text-white text-center font-black py-2.5 md:py-3.5 rounded-lg md:rounded-xl hover:bg-zinc-800 transition-all text-xs md:text-sm active:scale-95"
                    >
                      View Ride
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-8 md:p-14 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-3 md:mb-5 text-zinc-200">
              <span className="material-symbols-outlined text-3xl md:text-4xl">history</span>
            </div>
            <h3 className="text-base md:text-xl font-black text-zinc-900 mb-1 md:mb-2">No requests sent yet</h3>
            <p className="text-zinc-400 font-medium mb-4 md:mb-7 max-w-xs text-sm">Start joining rides to track your request statuses here.</p>
            <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black py-2.5 md:py-4 px-6 md:px-10 rounded-xl hover:bg-zinc-800 transition-all text-sm active:scale-95">
              Find a Ride
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
