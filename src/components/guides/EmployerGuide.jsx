
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GUIDE_STEPS = [
  {
    id: 1,
    title: "ברוכים הבאים למעסיקים!",
    content: "נעזור לכם למצוא את המועמדים הטובים ביותר לחברה שלכם. בוא נתחיל בסיור מהיר",
    target: null,
    position: "center"
  },
  {
    id: 2,
    title: "פרסום משרה חדשה",
    content: "כאן תוכלו ליצור ולפרסם משרות חדשות. המערכת תדריך אתכם דרך התהליך צעד אחר צעד",
    target: ".create-job-card",
    position: "bottom"
  },
  {
    id: 3,
    title: "נתוני הביצועים שלכם",
    content: "כאן תוכלו לראות כמה צפיות קיבלו המשרות, כמה מועמדויות הגיעו וכמה משרות פעילות יש לכם",
    target: ".employer-stats",
    position: "bottom"
  },
  {
    id: 4,
    title: "התראות ועדכונים",
    content: "התראות על מועמדויות חדשות, צפיות במשרות ועדכונים חשובים מופיעות כאן",
    target: ".notification-carousel",
    position: "top"
  },
  {
    id: 5,
    title: "מועמדים זמינים",
    content: "כאן תוכלו לראות מועמדים זמינים במאגר שלנו ולצפות בפרופילים שלהם",
    target: ".candidate-list",
    position: "top"
  },
  {
    id: 6,
    title: "סיימנו!",
    content: "עכשיו אתם מכירים את הדף הראשי. מוכנים להתחיל לחפש את המועמדים הבאים?",
    target: null,
    position: "center"
  }
];

export default function EmployerGuide({ isActive, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [guidePosition, setGuidePosition] = useState({ top: 0, left: 0, transform: '' });
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const step = GUIDE_STEPS[currentStep];
    
    // On mobile, we don't position relative to elements, we always center
    // and do not highlight elements.
    if (isMobile) {
      // Clear any existing highlights
      document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight');
      });
      // For mobile, the guide will always be centered via Tailwind classes,
      // so no need to calculate guidePosition here.
      setGuidePosition({ top: 0, left: 0, transform: '' }); // Reset for clarity
      return; // Stop here for mobile
    }

    // Desktop positioning logic
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const cardWidth = 320; // Fixed for desktop
        const cardHeight = 200; // Fixed for desktop
        
        let top, left, transform = '';
        
        switch (step.position) {
          case 'bottom':
            top = rect.bottom + scrollTop + 20;
            left = rect.left + scrollLeft + (rect.width / 2);
            transform = 'translateX(-50%)';
            break;
          case 'top':
            top = rect.top + scrollTop - cardHeight - 20;
            left = rect.left + scrollLeft + (rect.width / 2);
            transform = 'translateX(-50%)';
            break;
          case 'right':
            top = rect.top + scrollTop + (rect.height / 2);
            left = rect.right + scrollLeft + 20;
            transform = 'translateY(-50%)';
            break;
          case 'left':
            top = rect.top + scrollTop + (rect.height / 2);
            left = rect.left + scrollLeft - cardWidth - 20;
            transform = 'translateY(-50%)';
            break;
          default: // Fallback to 'left' for unhandled positions if target exists
            top = rect.top + scrollTop + (rect.height / 2);
            left = rect.left + scrollLeft - cardWidth - 20;
            transform = 'translateY(-50%)';
        }
        
        // Ensure the guide stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20; // Fixed for desktop
        
        // Adjust left position
        if (left < padding) {
          left = padding;
          if (transform.includes('translateY')) { // Preserve translateY if it was set
            // No change to transform
          } else if (transform.includes('translateX')) { // If it was translateX, reset
            transform = ''; // Or adjust based on new left
          }
        } else if (left + cardWidth > viewportWidth - padding) {
          left = viewportWidth - cardWidth - padding;
          if (transform.includes('translateY')) { // Preserve translateY if it was set
            // No change to transform
          } else if (transform.includes('translateX')) { // If it was translateX, reset
            transform = ''; // Or adjust based on new left
          }
        }
        
        // Adjust top position
        if (top < padding) {
          top = padding;
          if (transform.includes('translateX')) { // Preserve translateX if it was set
            // No change to transform
          } else if (transform.includes('translateY')) { // If it was translateY, reset
            transform = ''; // Or adjust based on new top
          }
        } else if (top + cardHeight > viewportHeight - padding) {
          top = viewportHeight - cardHeight - padding;
          if (transform.includes('translateX')) { // Preserve translateX if it was set
            // No change to transform
          } else if (transform.includes('translateY')) { // If it was translateY, reset
            transform = ''; // Or adjust based on new top
          }
        }
        
        setGuidePosition({ top, left, transform });
        
        element.classList.add('guide-highlight');
        return () => element.classList.remove('guide-highlight');
      }
    }
  }, [currentStep, isActive, isMobile]);

  const nextStep = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive) return null;

  const step = GUIDE_STEPS[currentStep];
  // On mobile, the guide should always be centered and handle its own height/overflow.
  // The `isCenter` variable will be true for 'center' steps on desktop, and for ALL steps on mobile.
  const isCenter = step.position === "center" || isMobile; 

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" />
      
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed z-[101] ${
            // For centered steps (or any step on mobile), use flexbox to center and allow vertical scrolling.
            isCenter 
              ? 'inset-0 flex items-center justify-center' // Changed: Use flexbox for robust centering on mobile
              : ''
          } ${isMobile ? 'px-4' : ''}`}
          // Only apply dynamic positioning styles if not centered (i.e., desktop and not a 'center' step)
          style={!isCenter ? { 
            top: `${guidePosition.top}px`, 
            left: `${guidePosition.left}px`,
            transform: guidePosition.transform
          } : {}}
          dir="rtl"
        >
          <Card className={`bg-white shadow-2xl rounded-2xl border-2 border-blue-200 ${
            isMobile 
              ? 'w-[calc(100vw-2rem)] max-w-sm mx-auto max-h-[90vh] overflow-y-auto' // Added max-h and overflow for mobile
              : 'w-80'
          }`}>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className={`rounded-full hover:bg-gray-100 ${
                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                  }`}
                >
                  <X className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                </Button>
                <div className="flex items-center gap-2">
                  <Lightbulb className={`text-yellow-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {currentStep + 1} מתוך {GUIDE_STEPS.length}
                  </span>
                </div>
              </div>
              
              <h3 className={`font-bold text-gray-900 mb-3 ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>
                {step.title}
              </h3>
              <p className={`text-gray-600 mb-6 leading-relaxed ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>
                {step.content}
              </p>
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-4'}`}
                >
                  <ArrowRight className={`ml-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  הקודם
                </Button>
                
                <div className="flex gap-1">
                  {GUIDE_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-full ${
                        isMobile ? 'w-2 h-2' : 'w-2 h-2'
                      } ${
                        index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={nextStep}
                  className={`bg-blue-600 hover:bg-blue-700 rounded-full ${
                    isMobile ? 'px-3 py-2 text-sm' : 'px-4'
                  }`}
                >
                  {currentStep === GUIDE_STEPS.length - 1 ? 'סיום' : 'הבא'}
                  <ArrowLeft className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Guide Styles */}
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 99;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 12px !important;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3) !important;
          }
        }
      `}</style>
    </>
  );
}
