import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import BrowseRides from './pages/BrowseRides';
import PostRide from './pages/PostRide';
import RideDetails from './pages/RideDetails';
import Login from './pages/Login';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import History from './pages/History';
import ConfirmedRide from './pages/ConfirmedRide';

import Messages from './pages/Messages';
import Chat from './pages/Chat';
import BookingConfirmation from './pages/BookingConfirmation';
import MyPostedRides from './pages/MyPostedRides';
import MyJoinedRides from './pages/MyJoinedRides';
import RateRide from './pages/RateRide';
import AdminDashboard from './pages/AdminDashboard';
import { ThemeProvider } from './context/ThemeContext';


const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Progress Bar - key triggers re-animation on route change */}
      <div key={pathname} className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none">
        <div 
          className="h-full bg-[#FFD100] transition-all duration-500 ease-out shadow-[0_0_10px_#FFD100]" 
          style={{ width: '100%', opacity: 0, animation: 'navProgress 0.6s ease-out' }}
        ></div>
      </div>
      
      <Navbar />
      <div className="flex-grow pb-24 md:pb-0">
        <Outlet />
      </div>
      <footer className="hidden md:block">
        <Footer />
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post" element={<PostRide />} />
                <Route path="/browse" element={<BrowseRides />} />
                <Route path="/ride/:id" element={<RideDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:id" element={<PublicProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/history" element={<History />} />
                <Route path="/confirmed-ride/:id" element={<ConfirmedRide />} />
                <Route path="/manage-requests/:id" element={<RideDetails />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
                <Route path="/my-posted-rides" element={<MyPostedRides />} />
                <Route path="/my-joined-rides" element={<MyJoinedRides />} />
                <Route path="/rate/:id" element={<RateRide />} />
              </Route>

              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
