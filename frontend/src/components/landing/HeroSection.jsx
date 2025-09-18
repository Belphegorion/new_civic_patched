import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, MapPinIcon, UserGroupIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 min-h-screen flex items-center">
      {/* Mobile-optimized background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-72 md:h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative w-full mx-auto px-4 py-12 md:py-20">
        <div className="text-center fade-in">
          {/* Mobile-optimized logo */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl md:rounded-3xl blur-xl" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/20">
                <MapPinIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
                <SparklesIcon className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-4 w-4 md:h-6 md:w-6 text-yellow-300 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Mobile-responsive heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white mb-6 md:mb-8 leading-tight md:leading-none tracking-tight px-2">
            <span className="block mb-1 md:mb-2">Empower Your</span>
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Community
            </span>
          </h1>

          {/* Mobile-optimized subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 md:mb-4 max-w-3xl mx-auto font-light px-4">
            Report civic issues, track progress in real-time
          </p>
          <p className="text-base md:text-lg text-white/70 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            Join thousands of citizens making their communities better, one report at a time.
          </p>

          {/* Mobile-first CTA buttons */}
          <div className="flex flex-col gap-4 justify-center mb-12 md:mb-20 px-4">
            <Link to="/login" className="group relative overflow-hidden bg-white text-gray-900 px-6 py-4 md:px-8 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 active:scale-95 md:hover:scale-105 shadow-xl">
              <span className="relative z-10 flex items-center justify-center">
                Start Reporting Now
                <ArrowRightIcon className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link to="/register" className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 md:px-8 rounded-2xl font-semibold text-base md:text-lg border-2 border-white/20 active:bg-white/20 md:hover:bg-white/20 md:hover:border-white/40 transition-all duration-300">
              Create Account
            </Link>
          </div>

          {/* Mobile-optimized stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto px-4">
            <div className="group bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 active:bg-white/10 md:hover:bg-white/10 md:hover:border-white/20 transition-all duration-300 md:hover:scale-105">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl md:rounded-2xl p-3 md:p-4 w-fit mx-auto mb-3 md:mb-4">
                <UserGroupIcon className="h-6 w-6 md:h-10 md:w-10 text-white" />
              </div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">12,000+</div>
              <div className="text-white/70 text-sm md:text-lg">Active Citizens</div>
              <div className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">Growing daily</div>
            </div>
            <div className="group bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 active:bg-white/10 md:hover:bg-white/10 md:hover:border-white/20 transition-all duration-300 md:hover:scale-105">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl md:rounded-2xl p-3 md:p-4 w-fit mx-auto mb-3 md:mb-4">
                <ChartBarIcon className="h-6 w-6 md:h-10 md:w-10 text-white" />
              </div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">25,000+</div>
              <div className="text-white/70 text-sm md:text-lg">Issues Resolved</div>
              <div className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">98% satisfaction rate</div>
            </div>
            <div className="group bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 active:bg-white/10 md:hover:bg-white/10 md:hover:border-white/20 transition-all duration-300 md:hover:scale-105">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl md:rounded-2xl p-3 md:p-4 w-fit mx-auto mb-3 md:mb-4">
                <MapPinIcon className="h-6 w-6 md:h-10 md:w-10 text-white" />
              </div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">150+</div>
              <div className="text-white/70 text-sm md:text-lg">Cities Served</div>
              <div className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">Across 5 countries</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;