import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { formatTime12h } from '../utils/formatters';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { showNotification, showConfirm } = useNotification();
  const [myRides, setMyRides] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [searchData, setSearchData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: ''
  });

  // Autofill from localStorage if user is visiting after home search
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
        
        // Clear them so they don't persist forever
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

    // Fetch My Posted Rides
    const myRidesQuery = query(
      collection(db, 'rides'),
      where('hostId', '==', currentUser.uid)
    );

    const unsubscribeMyRides = onSnapshot(myRidesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyRides(docs.slice(0, 3)); // Show top 3
    }, (err) => {
      console.error("Dashboard MyRides Error:", err);
    });

    // Fetch My Join Requests (Request Status)
    const myRequestsQuery = query(
      collection(db, 'requests'),
      where('passengerId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeMyRequests = onSnapshot(myRequestsQuery, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        // Optimistic update
        const originalRequests = [...myRequests];
        setMyRequests(prev => prev.filter(r => r.id !== requestId));

        try {
          await deleteDoc(doc(db, 'requests', requestId));
          showNotification("Success", "Request status removed.");
        } catch (err) {
          console.error("Error deleting request:", err);
          setMyRequests(originalRequests); // Rollback on error
          showNotification("Error", "Failed to delete request.");
        }
      }
    );
  };

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      {/* ... previous sections ... */}
      {/* High-Impact Hero Section */}
      <section className="py-20 px-4 sm:px-8 relative overflow-hidden">
        {/* Soft background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD100]/10 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="font-black text-5xl md:text-7xl text-zinc-900 tracking-tight leading-[1.1]">
                Go anywhere with<br/><span className="editorial-italic text-[#FFD100] drop-shadow-sm">CabSync.</span>
              </h1>
              <p className="font-medium text-lg text-zinc-600 max-w-lg mx-auto lg:mx-0">Reliable rides, verified community, and smarter splitting.</p>
            </div>

            {/* Search Tool Widget */}
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-[2.5rem] skeuo-card shadow-2xl max-w-xl mx-auto lg:mx-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-400 group-hover:bg-[#FFD100] transition-colors"></div>
                    <input 
                      value={searchData.pickup}
                      onChange={(e) => setSearchData({...searchData, pickup: e.target.value})}
                      className="w-full pl-10 pr-4 py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
                      placeholder="Pickup location" 
                      type="text" 
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 group-hover:bg-[#FFD100] transition-colors"></div>
                    <input 
                      value={searchData.destination}
                      onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                      className="w-full pl-10 pr-4 py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
                      placeholder="Destination" 
                      type="text" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">calendar_today</span>
                    <input 
                      value={searchData.date}
                      onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
                      type="date" 
                    />
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">schedule</span>
                    <input 
                      value={searchData.time}
                      onChange={(e) => setSearchData({...searchData, time: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium" 
                      type="time" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#FFD100] text-zinc-900 font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2 skeuo-button-raised">
                  <span className="material-symbols-outlined">search</span>
                  Search Rides
                </button>
              </div>
            </form>
          </div>

          <div className="hidden lg:block relative">
            <div className="skeuo-card rounded-[3rem] bg-white p-4 transition-all duration-700 hover:shadow-3xl group">
              <div className="relative rounded-[2.5rem] overflow-hidden">
                <img className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCc3QLkYg3ChC4RSyl0dcWt5tVNCgKYspHHjw8NTEq1-5CW_eYSvtk0gtQbMGCIEmNIHQlpsE5PnVNJR4FRi5MKkLZ0NdXFyo7yHn7-_Dhs_OKXu5n4S0BiyInKIvAgcn_503qnaGvoJi9C95Orwz74gvgDV3-o8AWbuGr6TMX9tcN9emPRhZq8mn-bnRDnmUN7a-g5c2LUQyF8Nw166cK0_pDbwxFPiSMQoQX-s72FeTRqdnL5ddFkgvi9-L-cugQn0-A_Gc2LzIE" alt="Hero image" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                  <div className="text-white">
                    <p className="font-black text-2xl">Verified & Safe</p>
                    <p className="text-white/80 font-medium">Every rider is ID-verified for your safety.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Action Grid (Uber-Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Search Ride", icon: "search", link: "/browse", bg: "bg-white", text: "text-zinc-900", iconColor: "text-[#FFD100]" },
            { title: "Post Ride", icon: "add_circle", link: "/post", bg: "bg-white", text: "text-zinc-900", iconColor: "text-[#FFD100]" },
            { title: "Joined Rides", icon: "group", link: "/my-joined-rides", bg: "bg-white", text: "text-zinc-900", iconColor: "text-[#FFD100]" },
            { title: "History", icon: "history", link: "/my-requests", bg: "bg-white", text: "text-zinc-900", iconColor: "text-[#FFD100]" }
          ].map((action, i) => (
            <Link key={i} to={action.link} className={`p-6 rounded-[2rem] skeuo-card bg-white flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-500`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 bg-zinc-50`}>
                <span className={`material-symbols-outlined text-3xl ${action.iconColor}`}>{action.icon}</span>
              </div>
              <span className={`font-black text-lg text-zinc-900`}>{action.title}</span>
            </Link>
          ))}
        </div>
      </section>
      
      {/* My Posted Rides Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[#FFD100] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_pin_circle</span>
            My Posted Rides
          </h2>
          <Link to="/my-posted-rides" className="text-[#FFD100] font-black hover:text-yellow-600 transition-colors flex items-center gap-1">
            View all
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>

        {myRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-[2.5rem] p-8 skeuo-card relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-2 w-full bg-[#FFD100]"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-zinc-50 text-zinc-400 border border-zinc-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{ride.status}</span>
                    <h3 className="font-black text-xl text-zinc-900 mt-3 truncate">{ride.destination}</h3>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-xl text-zinc-900 font-black text-xs">
                    {formatTime12h(ride.time)}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                    {ride.date}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-lg">group</span>
                    {ride.seats - ride.availableSeats}/{ride.seats} Seats
                  </div>
                </div>
                <Link to={`/manage-requests/${ride.id}`} className="block w-full bg-zinc-900 text-white text-center font-black py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                  Manage Ride
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-200">
              <span className="material-symbols-outlined text-5xl">directions_car</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">No rides posted yet</h3>
            <p className="text-zinc-400 font-medium mb-8 max-w-xs">Share your journey and split the costs with the community.</p>
            <Link to="/post" className="bg-zinc-900 text-[#FFD100] font-black py-4 px-10 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95">Post Your First Ride</Link>
          </div>
        )}
      </section>

      {/* Request Status Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[#FFD100] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            Request Status
          </h2>
        </div>

        {myRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myRequests.map(req => (
              <div key={req.id} className="bg-white rounded-[2.5rem] p-8 skeuo-card relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                    req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                    req.status === 'pending' ? 'bg-zinc-50 text-zinc-500 border border-zinc-100' :
                    req.status === 'cancelled' ? 'bg-zinc-100 text-zinc-400 border border-zinc-200' :
                    'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {req.status === 'approved' ? 'verified' : req.status === 'pending' ? 'schedule' : 'block'}
                    </span>
                    <span className="font-black text-[9px] uppercase tracking-widest">{req.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 shadow-inner">
                      <span className="material-symbols-outlined text-sm">route</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteRequest(req.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">To Destination</p>
                    <h4 className="font-black text-xl text-zinc-900 truncate">{req.rideDestination}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <span className="material-symbols-outlined text-lg text-zinc-300">location_on</span>
                    <span className="truncate font-medium">From {req.ridePickup}</span>
                  </div>
                </div>

                <Link to={`/ride/${req.rideId}`} className="block w-full bg-zinc-50 text-zinc-900 text-center font-black py-4 rounded-xl hover:bg-zinc-100 transition-all active:scale-95 border border-zinc-100">
                  View Ride Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center skeuo-card border-dashed border-2 border-zinc-100 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 text-zinc-200">
              <span className="material-symbols-outlined text-5xl">history</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">No requests sent yet</h3>
            <p className="text-zinc-400 font-medium mb-8 max-w-xs">Start joining rides to track your request statuses here.</p>
            <Link to="/browse" className="bg-zinc-900 text-[#FFD100] font-black py-4 px-10 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95">Find a Ride</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
