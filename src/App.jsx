import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import BrowseRides from './pages/BrowseRides';
import PostRide from './pages/PostRide';
import RideDetails from './pages/RideDetails';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import MyRequests from './pages/MyRequests';
import ConfirmedRide from './pages/ConfirmedRide';
import ManageRequests from './pages/ManageRequests';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import BookingConfirmation from './pages/BookingConfirmation';
import MyPostedRides from './pages/MyPostedRides';
import MyJoinedRides from './pages/MyJoinedRides';
import RateRide from './pages/RateRide';

const ProtectedLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex-grow pb-24 md:pb-0">
      <Outlet />
    </div>
    <footer className="hidden md:block">
      <Footer />
    </footer>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
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
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/confirmed-ride/:id" element={<ConfirmedRide />} />
              <Route path="/manage-requests/:id" element={<ManageRequests />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
              <Route path="/my-posted-rides" element={<MyPostedRides />} />
              <Route path="/my-joined-rides" element={<MyJoinedRides />} />
              <Route path="/rate/:id" element={<RateRide />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
