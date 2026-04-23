import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#E8F3FA] overflow-hidden font-sans">
      
      {/* Decorative Background Orbs (Exact layout from Image 1) */}
      <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
      
      {/* Tiny floating dots */}
      <div className="absolute top-[20%] right-[20%] w-4 h-4 bg-yellow-400 rounded-full shadow-lg"></div>
      <div className="absolute bottom-[15%] left-[25%] w-6 h-6 bg-indigo-500 rounded-full shadow-lg"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/90 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-white backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login</h1>
          <p className="text-gray-500 text-xs">Welcome back please login to your account</p>
        </div>

        <form className="space-y-5">
          {/* Username Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="User Name"
              className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder-gray-400"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 rounded bg-[#A7E2D0] border-none group-hover:bg-[#8CD5BF] transition-colors">
                <input type="checkbox" className="absolute opacity-0 cursor-pointer w-full h-full" />
                {/* Custom checkmark icon can go here if needed */}
              </div>
              <span className="text-xs text-gray-500">Remember me</span>
            </label>
          </div>

          {/* Gradient Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#87C6F8] to-[#D5ECA3] hover:from-[#72B8EF] hover:to-[#C4DE8A] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-4"
          >
            Login
          </button>

          {/* Forgot Password Link */}
          <div className="text-center mt-3">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Forgot Password?
            </a>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-gray-800 hover:text-indigo-600 transition-colors">
              Sing up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}