import React from 'react';
import { useNavigate } from 'react-router-dom';
import { imgGroup1, imgVector11, imgVector12, imgImage4 } from "../assets/figma";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#1b5e20] via-[#43a047] to-[#dcedc8] overflow-hidden flex flex-col items-center justify-center">
      
      {/* Decorative Leaves */}
      <div className="absolute top-0 left-0 w-48 h-48 opacity-30 transform -translate-x-1/4 -translate-y-1/4">
         <img src={imgVector11} alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-10 right-20 w-32 h-32 opacity-30 transform rotate-45">
         <img src={imgVector12} alt="" className="w-full h-full object-contain" />
      </div>
       <div className="absolute bottom-20 left-10 w-40 h-40 opacity-30 transform -rotate-12">
         <img src={imgVector12} alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-0 right-0 w-56 h-56 opacity-30 transform translate-x-1/4 translate-y-1/4">
         <img src={imgVector11} alt="" className="w-full h-full object-contain" />
      </div>
      
      {/* Main Content */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        
        {/* Text */}
        <h1 className="font-['Prompt',sans-serif] font-bold text-4xl md:text-6xl text-white drop-shadow-md mb-4 leading-tight tracking-wide">
          Report Your <span className="text-[#30f51a] drop-shadow-md">Waste</span>
          <br />
          In Your Village
        </h1>

        {/* Image Section */}
        <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] mb-8 flex items-center justify-center">
            {/* Background Shape */}
             <div className="absolute inset-0 flex items-center justify-center opacity-60 scale-110">
                <img src={imgGroup1} alt="" className="w-full h-full object-contain" />
             </div>
            
            {/* Main Bin Image */}
            <img 
                src={imgImage4} 
                alt="Recycling Bin" 
                className="relative w-full h-full object-contain drop-shadow-2xl z-10"
            />
        </div>

        {/* Button */}
        <button
          onClick={() => navigate('/login')}
          className="bg-black text-white font-['Prompt',sans-serif] font-bold text-xl py-3 px-12 rounded-full hover:bg-gray-900 transition-all hover:scale-105 shadow-xl cursor-pointer"
        >
          Get Started
        </button>

      </div>
    </div>
  );
}
