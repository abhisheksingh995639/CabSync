import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(`Google Login Failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic phone validation
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, { 
        name: formData.name, 
        phone: formData.phone 
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create an account.');
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
            src="/signup-hero.png" 
            alt="Plan your journey" 
            className="w-full h-full object-cover opacity-95 transition-transform duration-10000 hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent flex items-end p-12">
            <div className="text-zinc-900">
              <h3 className="font-black text-4xl tracking-tight mb-2">Plan your route.</h3>
              <p className="text-zinc-700 font-medium text-lg">Join thousands of daily commuters saving time and costs.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 h-full p-8 md:px-16 flex flex-col justify-center bg-white relative z-10">
          <div className="my-auto">
            <h2 className="text-4xl font-black text-zinc-900 mb-8 text-center tracking-tight">Create Account</h2>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center mb-6 font-medium border border-red-100">{error}</div>}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-zinc-900 text-xs pl-1 uppercase tracking-wider" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-medium text-zinc-900 skeuo-input-tactile placeholder:text-zinc-400 text-sm" 
                      id="name" 
                      placeholder="John Doe" 
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-zinc-900 text-xs pl-1 uppercase tracking-wider" htmlFor="phone">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>call</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-medium text-zinc-900 skeuo-input-tactile placeholder:text-zinc-400 text-sm" 
                    id="phone" 
                    placeholder="10-digit number" 
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[+]?[0-9\s\-()]{10,}"
                    title="Please enter at least 10 digits"
                    required
                  />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-zinc-900 text-xs pl-1 uppercase tracking-wider" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                  <input 
                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-medium text-zinc-900 skeuo-input-tactile placeholder:text-zinc-400" 
                    id="email" 
                    placeholder="name@example.com" 
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-zinc-900 text-xs pl-1 uppercase tracking-wider" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
                  <input 
                    className={`w-full pl-14 pr-14 py-3.5 rounded-2xl border border-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-black text-zinc-900 skeuo-input-tactile placeholder:text-zinc-400 ${!showPassword ? 'tracking-[0.2em]' : ''}`}
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength="6"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="w-full py-4 mt-4 bg-[#FFD100] text-zinc-900 font-black text-lg rounded-2xl skeuo-button-raised hover:translate-y-[-2px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            {/* Or Continue With */}
            <div className="mt-8 mb-6 flex items-center justify-center gap-4">
                <div className="h-px bg-zinc-200 w-12"></div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Or Join With</span>
                <div className="h-px bg-zinc-200 w-12"></div>
            </div>

            {/* Social Buttons */}
            <div className="flex justify-center">
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={loading} 
                  type="button" 
                  className="w-full h-14 rounded-2xl border border-zinc-200 flex items-center justify-center gap-3 hover:bg-zinc-50 hover:-translate-y-0.5 transition-all skeuo-card active:translate-y-0"
                >
                    <img alt="Google" className="w-5 h-5" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" />
                    <span className="font-bold text-zinc-700 text-sm">Continue with Google</span>
                </button>
            </div>

            <p className="text-center mt-8 font-medium text-zinc-500">
                Already have an account? <Link className="text-zinc-900 font-bold hover:underline underline-offset-4" to="/login">Log In here</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
