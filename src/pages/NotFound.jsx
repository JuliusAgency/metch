import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import dinoImage from "@/assets/dino_404.png";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[85vh] p-4" dir="rtl">
      <div className="bg-gradient-to-b from-[#F6FBFF] to-white rounded-[3rem] shadow-xl p-10 md:p-20 text-center w-full max-w-[90vw] min-h-[75vh] mx-auto flex flex-col items-center justify-center relative overflow-hidden">

        {/* Dinosaur Image Container - Relative for positioning sparkles */}
        <div className="mb-6 relative">
          <img
            src={dinoImage}
            alt="Dinosaur 404"
            className="w-28 md:w-36 h-auto mx-auto relative z-10"
          />

          {/* Sparkles */}
          <div className="absolute -top-4 -right-8 animate-pulse">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute top-2 -right-12 scale-50 animate-pulse delay-75">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#1D3A8A] mb-2 tracking-wide">
          404
        </h1>

        {/* Oops Text */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#1D3A8A] mb-6">
          אופס..
        </h2>

        {/* Description Text */}
        <div className="space-y-1 text-[#1D3A8A]/80 text-lg md:text-xl font-medium mb-8">
          <p>שלחנו את העמוד הזה לראיון עבודה</p>
          <p>כנראה שעוד לא חזר :)</p>
        </div>

        {/* Home Button */}
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-[#1D86E7] hover:bg-[#166bc2] text-white rounded-full px-12 py-6 text-xl font-medium min-w-[200px]">
            חזרה
          </Button>
        </Link>
      </div>
    </div>
  );
}