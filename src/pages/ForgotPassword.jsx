import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox (and spam folder) for further instructions.');
    } catch (err) {
      setError('Failed to reset password. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex items-center justify-center relative">
      {/* Main Container */}
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Close Button */}
        <Link to="/" className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors z-20">
          <span className="material-symbols-outlined text-2xl">close</span>
        </Link>

        {/* Left Side: Illustration Area */}
        <div className="hidden md:block w-1/2 relative overflow-hidden bg-[#FDFBF2]">
          <img 
            src="/forgot-hero.png" 
            alt="Security" 
            className="w-full h-full object-cover opacity-90 transition-transform duration-10000 hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-12">
            <div className="text-white">
              <h3 className="font-black text-4xl tracking-tight mb-2">Secure your account.</h3>
              <p className="text-white/80 font-medium text-lg">We'll help you get back on the road safely.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 h-full p-8 md:p-16 flex flex-col justify-center bg-white relative z-10">
          <h2 className="text-4xl font-black text-zinc-900 mb-6 text-center tracking-tight">Reset Password</h2>
          <p className="text-zinc-500 font-medium text-center mb-10">Enter your email address and we'll send you a link to reset your password.</p>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center mb-6 font-medium border border-red-100">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm text-center mb-6 font-medium border border-green-100">{message}</div>}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-zinc-900 text-sm pl-1" htmlFor="email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                <input 
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border border-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-medium text-zinc-900 skeuo-input-tactile placeholder:text-zinc-400" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full py-4 mt-2 bg-[#FFD100] text-zinc-900 font-black text-lg rounded-2xl skeuo-button-raised hover:translate-y-[-2px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin"></div>
                  <span>Sending Link...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="text-center mt-12 font-medium text-zinc-500">
              Remember your password? <Link className="text-zinc-900 font-bold hover:underline underline-offset-4" to="/login">Log In here</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
