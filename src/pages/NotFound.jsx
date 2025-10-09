import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="p-4 md:p-6 min-h-screen flex items-center justify-center" dir="rtl">
      <div className="w-[85vw] max-w-2xl mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              {/* 404 Illustration */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  {/* Robot/Computer Character */}
                  <svg width="120" height="120" viewBox="0 0 120 120" className="text-blue-500">
                    <rect x="30" y="40" width="60" height="50" rx="8" fill="currentColor" opacity="0.8"/>
                    <rect x="35" y="45" width="20" height="15" rx="3" fill="white"/>
                    <rect x="65" y="45" width="20" height="15" rx="3" fill="white"/>
                    <circle cx="45" cy="52" r="3" fill="currentColor"/>
                    <circle cx="75" cy="52" r="3" fill="currentColor"/>
                    <rect x="50" y="70" width="20" height="8" rx="4" fill="white"/>
                    <rect x="25" y="35" width="10" height="20" rx="5" fill="currentColor" opacity="0.6"/>
                    <rect x="85" y="35" width="10" height="20" rx="5" fill="currentColor" opacity="0.6"/>
                    <rect x="45" y="90" width="30" height="8" rx="4" fill="currentColor" opacity="0.6"/>
                  </svg>
                  {/* Sparkle effect */}
                  <div className="absolute -top-2 -right-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" className="text-yellow-400">
                      <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 404 Text */}
              <div className="text-6xl md:text-7xl font-bold text-blue-600 mb-4">
                404
              </div>

              {/* Oops Text */}
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                אופס..
              </div>

              {/* Description */}
              <div className="space-y-2 text-gray-600 text-lg">
                <p>שלחנו את העמוד הזה לארכיון עבודה</p>
                <p>כנראה עברתי לכאן חדש :)</p>
              </div>

              {/* Back Button */}
              <div className="pt-6">
                <Link to={createPageUrl("Dashboard")}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg h-12 min-w-[120px]">
                    חזרה
                  </Button>
                </Link>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}