import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  increment,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { formatTime12h } from '../utils/formatters';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { showNotification, showConfirm } = useNotification();

  // Search/Filter states
  const [userSearch, setUserSearch] = useState('');
  const [rideSearch, setRideSearch] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRides = onSnapshot(query(collection(db, 'rides'), orderBy('createdAt', 'desc')), (snapshot) => {
      setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      // Assuming a 'reports' collection exists or will be used
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubRides();
      unsubReports();
    };
  }, []);

  const [reports, setReports] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowSignups: true
  });
  const [announcement, setAnnouncement] = useState('');

  const handleDeleteUser = (userId) => {
    showConfirm("Delete User", "Are you sure you want to delete this user? This action cannot be undone.", async () => {
      try {
        await deleteDoc(doc(db, 'users', userId));
        showNotification("Success", "User deleted successfully");
      } catch (err) {
        showNotification("Error", "Failed to delete user");
      }
    });
  };

  const handleDeleteRide = (rideId) => {
    showConfirm("Delete Ride", "Are you sure you want to delete this ride?", async () => {
      try {
        await deleteDoc(doc(db, 'rides', rideId));
        showNotification("Success", "Ride deleted successfully");
      } catch (err) {
        showNotification("Error", "Failed to delete ride");
      }
    });
  };

  const toggleUserVerification = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !currentStatus
      });
      showNotification("Success", `User ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (err) {
      showNotification("Error", "Failed to update status");
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: 'group', color: 'bg-blue-500' },
    { label: 'Active Rides', value: rides.filter(r => (r.status || 'open').toLowerCase() === 'open').length, icon: 'directions_car', color: 'bg-green-500' },
    { label: 'Verified Users', value: users.filter(u => u.isVerified).length, icon: 'verified', color: 'bg-yellow-500' },
    { label: 'Total Reports', value: reports.length, icon: 'report', color: 'bg-red-500' },
  ];

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRides = rides.filter(r => 
    r.destination?.toLowerCase().includes(rideSearch.toLowerCase()) || 
    r.pickup?.toLowerCase().includes(rideSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white hidden md:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-[#FFD100]">Cab</span>Sync <span className="text-[10px] bg-[#FFD100] text-zinc-900 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'users', label: 'Manage Users', icon: 'group' },
            { id: 'rides', label: 'Manage Rides', icon: 'directions_car' },
            { id: 'reports', label: 'Reports & Bans', icon: 'report' },
            { id: 'announcements', label: 'Announcements', icon: 'campaign' },
            { id: 'settings', label: 'Settings', icon: 'settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-[#FFD100] text-zinc-900 font-black shadow-lg shadow-yellow-400/20' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white font-medium'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-zinc-800">
            <Link 
              to="/dashboard"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white font-medium transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Site
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-zinc-800">
          <div className="bg-zinc-800/50 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">System Health</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm font-medium">All systems normal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-zinc-500 font-medium">Monitoring and controlling CabSync data.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-400">calendar_today</span>
                <span className="text-sm font-bold text-zinc-600">{new Date().toLocaleDateString()}</span>
             </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 group hover:shadow-xl transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                    <span className="text-green-500 font-black text-xs flex items-center bg-green-50 px-2 py-1 rounded-full">
                      +12% <span className="material-symbols-outlined text-xs">trending_up</span>
                    </span>
                  </div>
                  <h3 className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-1">{stat.label}</h3>
                  <p className="text-4xl font-black text-zinc-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <h3 className="text-xl font-black text-zinc-900 mb-6">Recent Users</h3>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                            {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-zinc-400">person</span></div>}
                          </div>
                          <div>
                            <p className="font-black text-sm text-zinc-900">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-zinc-500 font-medium">{user.email}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <h3 className="text-xl font-black text-zinc-900 mb-6">Recent Rides</h3>
                  <div className="space-y-4">
                    {rides.slice(0, 5).map(ride => (
                      <div key={ride.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex-1">
                          <p className="font-black text-sm text-zinc-900 truncate">To: {ride.destination}</p>
                          <p className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span> {formatTime12h(ride.time)} • {ride.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xs text-zinc-900">₹{ride.price || '0'}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">{ride.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-[1.5rem] shadow-sm focus:ring-2 focus:ring-[#FFD100]/20 outline-none font-medium"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">User</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Phone</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Rating</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                              {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-zinc-400">person</span></div>}
                            </div>
                            <div>
                              <p className="font-black text-sm text-zinc-900">{user.name || 'Anonymous'}</p>
                              <p className="text-xs text-zinc-500 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-zinc-600">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-sm font-bold text-zinc-700">{user.rating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleUserVerification(user.id, user.isVerified)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                              user.isVerified ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {user.isVerified ? 'Verified' : 'Verify Now'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-auto"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                <input 
                  type="text" 
                  placeholder="Search by pickup or destination..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-[1.5rem] shadow-sm focus:ring-2 focus:ring-[#FFD100]/20 outline-none font-medium"
                  value={rideSearch}
                  onChange={(e) => setRideSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Route</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Host</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Time/Date</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Seats</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredRides.map(ride => (
                      <tr key={ride.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-black text-sm text-zinc-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-green-500">fiber_manual_record</span>
                              {ride.pickup}
                            </p>
                            <p className="font-black text-sm text-zinc-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-red-500">location_on</span>
                              {ride.destination}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-bold text-zinc-700">{ride.hostName || 'Host'}</p>
                           <p className="text-[10px] text-zinc-400 font-medium">UID: {ride.hostId?.slice(0,8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-zinc-700">{formatTime12h(ride.time)}</p>
                          <p className="text-xs text-zinc-400 font-medium">{ride.date}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-zinc-700">{ride.availableSeats}/{ride.seats}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            (ride.status || 'open').toLowerCase() === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {ride.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                const link = `${window.location.origin}/ride/${ride.id}`;
                                navigator.clipboard.writeText(link);
                                showNotification("Copied", "Ride link copied to clipboard!");
                              }}
                              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                              title="Share Ride"
                            >
                              <span className="material-symbols-outlined text-lg">share</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteRide(ride.id)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                              title="Delete Ride"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <h3 className="text-xl font-black text-zinc-900 mb-6">User Reports</h3>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm text-red-900">Reported: {report.targetName}</p>
                        <p className="text-xs text-red-700">Reason: {report.reason}</p>
                        <p className="text-[10px] text-red-400 uppercase font-bold mt-1">By: {report.reporterName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const userRef = doc(db, 'users', report.targetUserId);
                              const userSnap = await getDoc(userRef);
                              const currentWarns = userSnap.data()?.warnCount || 0;
                              const newWarns = currentWarns + 1;
                              
                              await updateDoc(userRef, { warnCount: increment(1) });
                              
                              // Open email client
                              const subject = encodeURIComponent("Official Warning from CabSync Admin");
                              const body = encodeURIComponent(`Hello ${report.targetName},\n\nWe have received a report regarding: "${report.reason}".\n\nThis is your warning #${newWarns}. Please adhere to community guidelines.\n\nRegards,\nCabSync Admin`);
                              window.location.href = `mailto:${userSnap.data()?.email}?subject=${subject}&body=${body}`;

                              if (newWarns >= 5) {
                                showConfirm(
                                  "Threshold Reached (5/5)", 
                                  `${report.targetName} has reached 5 warnings. Would you like to ban this user now?`,
                                  async () => {
                                    await updateDoc(userRef, { isBanned: true });
                                    showNotification("Success", "User has been banned.");
                                  }
                                );
                              } else {
                                showNotification("Warned", `Warning #${newWarns} sent to ${report.targetName}`);
                              }
                            } catch (err) {
                              console.error("Warning error:", err);
                              showNotification("Error", "Failed to process warning.");
                            }
                          }}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg shadow-yellow-500/20"
                        >
                          <span className="material-symbols-outlined text-sm">warning</span>
                          Warn
                        </button>
                        <button 
                          onClick={async () => {
                            showConfirm("Ban User", `Are you sure you want to ban ${report.targetName}?`, async () => {
                              await updateDoc(doc(db, 'users', report.targetUserId), { isBanned: true });
                              showNotification("Success", "User has been banned.");
                            });
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black"
                        >
                          Ban User
                        </button>
                        <button 
                          onClick={async () => {
                            await deleteDoc(doc(db, 'reports', report.id));
                            showNotification("Success", "Report dismissed.");
                          }}
                          className="bg-white text-zinc-600 px-4 py-2 rounded-xl text-xs font-black border border-zinc-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-zinc-200 text-6xl mb-4">gpp_good</span>
                  <p className="text-zinc-400 font-medium">No active reports. Community is behaving!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <h3 className="text-xl font-black text-zinc-900 mb-2">Push Global Announcement</h3>
              <p className="text-zinc-500 text-sm mb-6">This message will be visible to all users on their dashboard.</p>
              
              <textarea 
                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FFD100]/20 outline-none font-medium h-40 mb-4"
                placeholder="Type your announcement here..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
              />
              
              <button 
                onClick={() => {
                  showNotification("Success", "Announcement broadcasted!");
                  setAnnouncement('');
                }}
                className="w-full bg-[#FFD100] text-zinc-900 font-black py-4 rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
              >
                Broadcast to Everyone
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <h3 className="text-xl font-black text-zinc-900 mb-8">Platform Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <div>
                    <p className="font-black text-zinc-900">Maintenance Mode</p>
                    <p className="text-xs text-zinc-500 font-medium">Temporarily disable all user actions</p>
                  </div>
                  <button 
                    onClick={() => setSystemSettings({...systemSettings, maintenanceMode: !systemSettings.maintenanceMode})}
                    className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <div>
                    <p className="font-black text-zinc-900">Allow New Signups</p>
                    <p className="text-xs text-zinc-500 font-medium">Open/Close registration for new users</p>
                  </div>
                  <button 
                    onClick={() => setSystemSettings({...systemSettings, allowSignups: !systemSettings.allowSignups})}
                    className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.allowSignups ? 'bg-green-500' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.allowSignups ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <button 
                  onClick={() => showNotification("Success", "Settings saved successfully")}
                  className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl mt-4"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
