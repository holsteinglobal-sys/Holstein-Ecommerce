import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import { toast } from 'react-toastify';
import toast from "react-hot-toast";

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup,googleSignIn  } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    try {
      setLoading(true);
      await signup(email, password, name, phone);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    await googleSignIn();
    toast.success("Logged in with Google!");
    navigate('/');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};


  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
  <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-xl">

    {/* Header */}
    <div className="text-center mb-15">
      <h2 className="text-3xl font-bold text-indigo-700">
        Create Account
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Get started with your free account
      </p>
    </div>

    {/* Form */}
    <form className="space-y-5" onSubmit={handleSubmit}>

      {/* Full Name */}
      <input
        id="name"
        name="name"
        type="text"
        autoComplete="name"
        required
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-5 py-3 text-sm text-gray-900
                   border border-gray-300 rounded-full
                   placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                   transition-all duration-200"
      />

      {/* Phone */}
       <input
        id="phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-5 py-3 text-sm text-gray-900
                   border border-gray-300 rounded-full
                   placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                   transition-all duration-200"
      />

      {/* Email */}
      <input
        id="email-address"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-5 py-3 text-sm text-gray-900
                   border border-gray-300 rounded-full
                   placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                   transition-all duration-200"
      />

      {/* Password */}
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-5 py-3 text-sm text-gray-900
                     border border-gray-300 rounded-full
                     placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <input
          id="confirm-password"
          name="confirm-password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-5 py-3 text-sm text-gray-900
                     border border-gray-300 rounded-full
                     placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none"
        >
          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full text-sm font-semibold text-white
                   bg-indigo-700 hover:bg-indigo-800
                   shadow-md hover:shadow-lg
                   transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600
                   disabled:opacity-60"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      {/* Footer */}
     
      <button className="btn w-full rounded-full bg-white text-black border-[#e5e5e5] flex items-center justify-center gap-2 mx-auto"
      onClick={handleGoogleLogin}
      >
  <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
  Login with Google
</button>
 <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-indigo-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  </div>
</div>

  );
};

export default Signup;
