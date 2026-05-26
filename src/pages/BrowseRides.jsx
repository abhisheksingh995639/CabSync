import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatTime12h } from '../utils/formatters';
import Slider from '@mui/material/Slider';

const BrowseRides = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchFrom = searchParams.get('from') || '';
  const searchTo = searchParams.get('to') || '';
  const searchDate = searchParams.get('date') || '';
  const searchTime = searchParams.get('time') || '';
  const isAdvancedSearch = Boolean(searchFrom && searchTo && searchDate && searchTime);

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('cabsync_filter_search') || '');
  const [maxPrice, setMaxPrice] = useState(() => Number(localStorage.getItem('cabsync_filter_maxprice')) || 2500);
  const [selectedType, setSelectedType] = useState(() => localStorage.getItem('cabsync_filter_type') || 'Any');
  const [startTime, setStartTime] = useState(() => Number(localStorage.getItem('cabsync_filter_starttime')) || 0);
  const [endTime, setEndTime] = useState(() => Number(localStorage.getItem('cabsync_filter_endtime')) || 1439);
  const [selectedVehicleType, setSelectedVehicleType] = useState(() => localStorage.getItem('cabsync_filter_vehicletype') || 'Any');
  const [minSeats, setMinSeats] = useState(() => Number(localStorage.getItem('cabsync_filter_minseats')) || 1);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('cabsync_filter_search', searchTerm);
    localStorage.setItem('cabsync_filter_maxprice', maxPrice.toString());
    localStorage.setItem('cabsync_filter_type', selectedType);
    localStorage.setItem('cabsync_filter_starttime', startTime.toString());
    localStorage.setItem('cabsync_filter_endtime', endTime.toString());
    localStorage.setItem('cabsync_filter_vehicletype', selectedVehicleType);
    localStorage.setItem('cabsync_filter_minseats', minSeats.toString());
  }, [searchTerm, maxPrice, selectedType, startTime, endTime, selectedVehicleType, minSeats]);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const q = query(
      collection(db, 'rides'),
      where('status', 'in', ['open', 'OPEN'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt descending on the client side
      const sortedRides = ridesData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setRides(sortedRides);
      setLoading(false);
    }, (err) => {
      console.error("Browse Rides Query Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const baseFilteredRides = rides.filter(ride => {
    const matchesPrice = (ride.fare || 0) <= maxPrice;
    const matchesType = selectedType === 'Any' || (
      selectedType === 'AC' 
        ? (ride.tags && ride.tags.includes('AC'))
        : !(ride.tags && ride.tags.includes('AC'))
    );
    
    const rideTimeMins = timeToMinutes(ride.time);
    const matchesTimeFilter = rideTimeMins >= startTime && rideTimeMins <= endTime;

    const matchesVehicleType = selectedVehicleType === 'Any' || 
      (ride.carModel || 'Sedan').toLowerCase() === selectedVehicleType.toLowerCase();

    const rideSeats = ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4);
    const matchesMinSeats = rideSeats >= minSeats;

    return matchesPrice && matchesType && matchesTimeFilter && matchesVehicleType && matchesMinSeats;
  });

  const normalizeDate = (d) => {
    if (!d) return '';
    const clean = d.trim().replace(/-/g, "/");
    const parts = clean.split("/");
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
  };

  let exactMatches = [];
  let similarRides = [];
  let simpleRides = [];

  if (isAdvancedSearch) {
    const normTargetDate = normalizeDate(searchDate);
    const targetMins = timeToMinutes(searchTime);

    const locationMatched = baseFilteredRides.filter(ride => {
      const matchP = (ride.pickup || "").toLowerCase().includes(searchFrom.toLowerCase());
      const matchD = (ride.destination || "").toLowerCase().includes(searchTo.toLowerCase());
      return matchP && matchD;
    });

    exactMatches = locationMatched.filter(ride => {
      return normalizeDate(ride.date) === normTargetDate && ride.time === searchTime;
    });

    similarRides = locationMatched.filter(ride => !exactMatches.includes(ride));

    similarRides.sort((a, b) => {
      const aDateMatch = normalizeDate(a.date) === normTargetDate ? 0 : 1;
      const bDateMatch = normalizeDate(b.date) === normTargetDate ? 0 : 1;
      if (aDateMatch !== bDateMatch) return aDateMatch - bDateMatch;

      const aTimeMins = timeToMinutes(a.time);
      const bTimeMins = timeToMinutes(b.time);
      const aTimeDiff = Math.abs(aTimeMins - targetMins);
      const bTimeDiff = Math.abs(bTimeMins - targetMins);
      if (aTimeDiff !== bTimeDiff) return aTimeDiff - bTimeDiff;

      return (a.fare || 0) - (b.fare || 0);
    });

    exactMatches.sort((a, b) => (a.fare || 0) - (b.fare || 0));

  } else {
    simpleRides = baseFilteredRides;
  }

  const advancedRides = isAdvancedSearch ? [...exactMatches, ...similarRides] : simpleRides;

  const filteredRides = advancedRides.filter(ride => {
    if (!searchTerm) return true;
    return (ride.destination || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
           (ride.pickup || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const RideCard = ({ ride }) => (
    <Link key={ride.id} to={`/ride/${ride.id}`} className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:p-8 skeuo-card flex flex-col hover:-translate-y-1.5 transition-all duration-500 group">
      <div className="flex justify-between items-start mb-4 md:mb-8">
        <div className="flex items-center gap-2 md:gap-4">
          <img 
            alt={ride.hostName} 
            className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl skeuo-card object-cover" 
            src={ride.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000`}
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.hostName)}&background=FFD100&color=000000` }}
          />
          <div>
            <h3 className="font-black text-zinc-900 text-sm md:text-base">{ride.hostName}</h3>
            <div className="flex gap-1.5 md:gap-2 mt-0.5 md:mt-1">
              <div className="flex items-center text-[8px] md:text-[10px] font-black text-yellow-600 bg-yellow-50 px-1.5 md:px-2 py-0.5 rounded-md uppercase tracking-widest">
                <span className="material-symbols-outlined text-[10px] md:text-[12px] mr-0.5 md:mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {ride.rating ? ride.rating.toFixed(1) : '5.0'}
              </div>
              {ride.rideType && (
                <div className="flex items-center text-[8px] md:text-[10px] font-black text-zinc-400 bg-zinc-50 px-1.5 md:px-2 py-0.5 rounded-md uppercase tracking-widest border border-zinc-100">
                  <span className="material-symbols-outlined text-[10px] md:text-[12px] mr-0.5 md:mr-1">ac_unit</span>
                  {ride.rideType}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg md:text-3xl font-black text-zinc-900 tracking-tighter">₹{Math.round((ride.fare || 0) / ((ride.passengers?.length || 0) + 1))}</span>
          <span className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">per person</span>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 mb-4 md:mb-8 relative">
        <div className="absolute left-[13px] md:left-[15px] top-4 bottom-4 w-0.5 bg-zinc-100 group-hover:bg-[#FFD100]/30 transition-colors"></div>
        
        <div className="flex items-center gap-3 md:gap-6 relative z-10">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white transition-all skeuo-card border-none text-[10px]">
            <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
          <div className="flex-1">
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pickup</p>
            <p className="text-zinc-600 font-bold text-sm md:text-base truncate">{ride.pickup}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 relative z-10">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FFD100] shadow-lg">
            <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
          </div>
          <div className="flex-1">
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Destination</p>
            <p className="text-zinc-900 font-black text-sm md:text-base truncate">{ride.destination}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-3 md:gap-y-6 md:gap-x-4 mb-4 md:mb-8 pt-4 md:pt-6 border-t border-zinc-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
            <span className="material-symbols-outlined text-lg md:text-xl">calendar_today</span>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Date</p>
            <p className="text-xs md:text-sm font-black text-zinc-900">{ride.date}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
            <span className="material-symbols-outlined text-lg md:text-xl">schedule</span>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Time</p>
            <p className="text-xs md:text-sm font-black text-zinc-900">{formatTime12h(ride.time)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
            <span className="material-symbols-outlined text-lg md:text-xl">directions_car</span>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Vehicle</p>
            <p className="text-xs md:text-sm font-black text-zinc-900 truncate max-w-[100px]">{ride.carModel || 'Sedan'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
            <span className="material-symbols-outlined text-lg md:text-xl">group</span>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Seats</p>
            <p className="text-xs md:text-sm font-black text-zinc-900">{(ride.availableSeats !== undefined ? ride.availableSeats : (ride.seats || 4))} left</p>
          </div>
        </div>
      </div>

      <div className="w-full py-2.5 md:py-4 bg-zinc-900 text-[#FFD100] text-center font-black rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] text-sm md:text-base">
        Join Now
      </div>
    </Link>
  );

  return (
    <div className="bg-[#F5F5F0] min-h-screen">
      {/* Search Header Section */}
      <section className="bg-white border-b border-zinc-200 py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
            <div className="space-y-1 md:space-y-2">
              <h1 className="font-black text-3xl md:text-5xl text-zinc-900 tracking-tight">Available <span className="editorial-italic text-[#FFD100]">Rides.</span></h1>
              <p className="text-zinc-500 font-medium text-sm md:text-base">
                {loading ? 'Finding the best matches...' : `We found ${filteredRides.length} rides for you.`}
              </p>
            </div>
            <div className="w-full md:w-96 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FFD100] transition-colors">search</span>
              <input 
                className="w-full pl-12 pr-4 py-3 md:py-4 bg-zinc-50 border-none rounded-2xl skeuo-input-tactile focus:ring-2 focus:ring-[#FFD100]/20 outline-none transition-all placeholder:text-zinc-400 font-medium text-sm md:text-base" 
                placeholder="Where are you going?" 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mt-6 flex justify-center">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="skeuo-button-tactile-light px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-zinc-200"
            >
              <span className="material-symbols-outlined text-base">{showFilters ? 'close' : 'tune'}</span>
              {showFilters ? 'Close Filters' : 'Filter Results'}
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Filters */}
        <aside className={`w-full lg:w-80 flex-shrink-0 space-y-8 lg:pr-10 lg:border-r lg:border-zinc-200/60 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] skeuo-card">
            <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FFD100]">tune</span>
              Filter Results
            </h2>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Ride Type</label>
                <div className="space-y-3">
                  {['Any', 'AC', 'Non-AC'].map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="rideType" 
                        className="hidden" 
                        checked={selectedType === type}
                        onChange={() => setSelectedType(type)}
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                        selectedType === type ? 'border-[#FFD100] bg-[#FFD100]' : 'border-zinc-200 group-hover:border-[#FFD100]'
                      }`}>
                        {selectedType === type && (
                          <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>
                        )}
                      </div>
                      <span className={`font-bold transition-colors ${
                        selectedType === type ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'
                      }`}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Vehicle Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Any', 'Sedan', 'SUV', 'Hatchback', 'MPV', 'Not Confirmed'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedVehicleType(type)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        selectedVehicleType === type 
                          ? 'bg-zinc-900 text-[#FFD100] shadow-md' 
                          : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Min Seats Available</label>
                  <span className="text-zinc-900 font-black text-sm">{minSeats} {minSeats === 1 ? 'Seat' : 'Seats'}</span>
                </div>
                <div className="relative h-10 flex items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={minSeats}
                    onChange={(e) => setMinSeats(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-[#FFD100] skeuo-input-tactile border-none"
                  />
                  <div 
                    className="absolute h-1.5 bg-[#FFD100] rounded-full pointer-events-none" 
                    style={{ width: `${((minSeats - 1) / 9) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-zinc-300">1</span>
                  <span className="text-[10px] font-bold text-zinc-300">10</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Time Range</label>
                  <span className="text-zinc-900 font-black text-[10px]">{minutesToTime(startTime)} - {minutesToTime(endTime)}</span>
                </div>
                <div className="px-2">
                  <Slider
                    value={[startTime, endTime]}
                    onChange={(e, newValue) => {
                      setStartTime(newValue[0]);
                      setEndTime(newValue[1]);
                    }}
                    min={0}
                    max={1439}
                    step={15}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(val) => minutesToTime(val)}
                    sx={{
                      color: '#FFD100',
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#FFF',
                        border: '2px solid currentColor',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0px 0px 0px 8px rgba(255, 209, 0, 0.16)',
                        },
                        '&.Mui-active': {
                          boxShadow: '0px 0px 0px 14px rgba(255, 209, 0, 0.16)',
                        },
                      },
                      '& .MuiSlider-valueLabel': {
                        backgroundColor: '#202020',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                      },
                      '& .MuiSlider-rail': {
                        opacity: 0.2,
                        backgroundColor: '#D1D1D1',
                      },
                    }}
                  />
                </div>
                <div className="flex justify-between -mt-1">
                  <span className="text-[9px] font-bold text-zinc-300">12:00 AM</span>
                  <span className="text-[9px] font-bold text-zinc-300">11:59 PM</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Max Price</label>
                  <span className="text-zinc-900 font-black text-sm">₹{maxPrice}</span>
                </div>
                <div className="relative h-10 flex items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-[#FFD100] skeuo-input-tactile border-none"
                  />
                  <div 
                    className="absolute h-1.5 bg-[#FFD100] rounded-full pointer-events-none" 
                    style={{ width: `${(maxPrice / 5000) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-zinc-300">₹0</span>
                  <span className="text-[10px] font-bold text-zinc-300">₹5000</span>
                </div>
              </div>

            </div>
          </div>

          <div className="hidden lg:block bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFD100]/20 rounded-full blur-2xl group-hover:bg-[#FFD100]/30 transition-all"></div>
            <h3 className="text-xl font-black mb-2 relative z-10">Post your ride</h3>
            <p className="text-white/60 text-sm mb-6 relative z-10 leading-relaxed">Save even more by sharing your own empty seats.</p>
            <Link to="/post" className="bg-[#FFD100] text-zinc-900 font-black px-6 py-3 rounded-xl inline-block relative z-10 active:scale-95 transition-all">Start Now</Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-[#FFD100]"></div>
              <p className="text-zinc-400 font-bold text-sm md:text-base">Scanning for available seats...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {filteredRides.length > 0 ? (
                <>
                  {isAdvancedSearch && exactMatches.length > 0 && (
                    <div className="col-span-full">
                      <h3 className="text-xl font-black text-zinc-900 mb-2">Exact Matches</h3>
                    </div>
                  )}
                  {isAdvancedSearch && exactMatches.map(ride => <RideCard key={ride.id} ride={ride} />)}

                  {isAdvancedSearch && exactMatches.length === 0 && similarRides.length > 0 && (
                    <div className="col-span-full bg-red-50 text-red-900 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                      <span className="material-symbols-outlined text-red-500">info</span>
                      <div>
                        <h4 className="font-bold text-sm">Exact Match Not Found</h4>
                        <p className="text-xs opacity-80 mt-1">No rides found exactly at {searchDate}, {formatTime12h(searchTime)}. Showing similar available rides below:</p>
                      </div>
                    </div>
                  )}

                  {isAdvancedSearch && similarRides.length > 0 && (
                    <div className="col-span-full mt-4">
                      <h3 className="text-xl font-black text-zinc-900 mb-2">Similar Available Rides</h3>
                    </div>
                  )}
                  {isAdvancedSearch && similarRides.map(ride => <RideCard key={ride.id} ride={ride} />)}

                  {!isAdvancedSearch && filteredRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
                </>
              ) : (
                <div className="col-span-full py-16 md:py-20 text-center bg-white rounded-2xl md:rounded-[2rem] skeuo-card !transition-none flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-zinc-300">
                    <span className="material-symbols-outlined text-4xl md:text-5xl">search_off</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-1 md:mb-2">No rides found</h3>
                  <p className="text-zinc-400 font-medium text-sm md:text-base max-w-xs mx-auto px-4">
                    {isAdvancedSearch 
                      ? "We couldn't find any rides matching your search criteria. Try modifying your filters or search."
                      : "Try adjusting your search terms or filters to find more travelers."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BrowseRides;
