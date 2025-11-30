import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#1b5e20] via-[#43a047] to-[#dcedc8] overflow-hidden flex flex-col items-center justify-center">
      
      {/* Main Content */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        
        {/* Text */}
        <h1 className="font-sans font-bold text-4xl md:text-6xl text-white drop-shadow-md mb-8 leading-tight tracking-wide">
          Report Your <span className="text-[#30f51a] drop-shadow-md">Waste</span>
          <br />
          In Your Village
        </h1>

        {/* Button */}
        <button
          onClick={() => navigate('/login')}
          className="bg-black text-white font-sans font-bold text-xl py-3 px-12 rounded-full hover:bg-gray-900 transition-all hover:scale-105 shadow-xl cursor-pointer"
        >
          Get Started
        </button>

      </div>
    </div>
  );
}
