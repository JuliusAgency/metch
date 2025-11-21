import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Lottie from 'lottie-react';
import confettiAnimation from '../../../Confetti banner.json';

export default function Success({ onReset, onDuplicate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="max-w-xl mx-auto text-center py-12"
      dir="rtl"
    >
      {/* Success Icon */}
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Lottie Confetti Animation */}
      <div className="relative mb-4">
        <div className="absolute inset-x-0 top-0 -mt-8 flex justify-center pointer-events-none">
          <Lottie
            animationData={confettiAnimation}
            loop={false}
            style={{ width: '400px', height: '200px' }}
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 relative z-10">משרה פורסמה בהצלחה</h1>
      </div>
      <p className="text-gray-600 text-lg mb-8">
        תחילת פרסום באפליקטיביט {format(new Date(), 'dd.MM.yy')}
      </p>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={onReset}
          className="px-8 py-3 h-auto text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          יצירת משרה חדשה
        </Button>
        <Button
          onClick={onDuplicate}
          variant="outline"
          className="px-8 py-3 h-auto text-lg rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          שכפול משרה
        </Button>
      </div>
    </motion.div>
  );
}