
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GUIDE_STEPS = [
  {
    id: 1,
    title: "ברוך הבא ל-Metch!",
    content: "אנחנו נעזור לך למצוא את המשרה המושלמת. בוא נתחיל בסיור קצר",
    target: null,
    position: "center"
  },
  {
    id: 2,
    title: "הסטטיסטיקות שלך",
    content: "כאן תוכל לראות כמה משרות רלוונטיות יש, כמה מועמדויות הגשת וכמה צפו בקורות החיים שלך",
    target: ".stats-grid",
    position: "bottom"
  },
  {
    id: 3,
    title: "התראות חדשות",
    content: "התראות על משרות חדשות, תגובות למועמדויות וצפיות בפרופיל שלך מופיעות כאן",
    target: ".notification-carousel",
    position: "top"
  },
  {
    id: 4,
    title: "חיפוש משרות",
    content: "השתמש בשדה החיפוש כדי למצוא משרות ספציפיות לפי תפקיד, חברה או מילות מפתח",
    target: ".job-search-input",
    position: "top"
  },
  {
    id: 5,
    title: "משרות מותאמות אישית",
    content: "המערכת מציגה לך משרות שמתאימות לפרופיל שלך. לחץ על 'לצפייה' כדי לראות פרטים נוספים",
    target: ".job-list",
    position: "top"
  },
  {
    id: 6,
    title: "סיימנו!",
    content: "עכשיו אתה מכיר את הדף הראשי. מוכן להתחיל לחפש את המשרה הבאה שלך?",
    target: null,
    position: "center"
  }
];

export default function JobSeekerGuide({ isActive, onComplete, onSkip }) {
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
    if (!isActive) {
      // When guide is inactive, ensure all highlights are removed.
      document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight');
      });
      return;
    }

    // Always clear highlights from previous step before potentially adding a new one.
    document.querySelectorAll('.guide-highlight').forEach(el => {
      el.classList.remove('guide-highlight');
    });

    const step = GUIDE_STEPS[currentStep];
    
    // On mobile, we don't position relative to elements, we always center
    if (isMobile) {
      // Highlighting is not desired on mobile, so we return after clearing.
      return;
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
          default:
            // Default position for desktop if target exists but position isn't specified
            top = rect.top + scrollTop + (rect.height / 2);
            left = rect.left + scrollLeft - cardWidth - 20;
            transform = 'translateY(-50%)';
        }
        
        // Ensure the guide stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20; // Fixed for desktop
        
        if (left < padding) {
          left = padding;
          transform = 'translateY(-50%)'; // Recalculate transform if position changes
        } else if (left + cardWidth > viewportWidth - padding) {
          left = viewportWidth - cardWidth - padding;
          transform = 'translateY(-50%)'; // Recalculate transform if position changes
        }
        
        if (top < padding) {
          top = padding;
          transform = transform.includes('translateX') ? 'translateX(-50%)' : '';
        } else if (top + cardHeight > viewportHeight - padding) {
          top = viewportHeight - cardHeight - padding;
          transform = transform.includes('translateX') ? 'translateX(-50%)' : '';
        }
        
        setGuidePosition({ top, left, transform });
        
        // Add highlight to target element
        element.classList.add('guide-highlight');
        // No explicit cleanup return needed here as all highlights are cleared at the start of the effect.
      }
    }
  }, [currentStep, isActive, isMobile]); // Dependencies are correct.

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
  const isCenter = step.position === "center" || isMobile; // Guide is always centered on mobile

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" />
      
      {/* Guide Card */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed z-[101] ${
            isCenter // If isCenter is true (which it is for all mobile cases)
              ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
              : ''
          } ${isMobile ? 'px-4' : ''}`}
          style={!isCenter // Apply dynamic position only if NOT centered (i.e., desktop and not "center" position)
            ? { 
                top: `${guidePosition.top}px`, 
                left: `${guidePosition.left}px`,
                transform: guidePosition.transform
              } 
            : {} // Otherwise, let Tailwind classes handle centering
          }
          dir="rtl"
        >
          <Card className={`bg-white shadow-2xl rounded-2xl border-2 border-blue-200 ${
            isMobile ? 'w-[calc(100vw-2rem)] max-w-sm mx-auto' : 'w-80'
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

      {/* Guide Styles - these apply only to desktop elements as mobile highlighting is disabled */}
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 99;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important; /* Fixed to desktop value */
          border-radius: 12px !important; /* Fixed to desktop value */
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important; /* Fixed to desktop value */
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3) !important; /* Fixed to desktop value */
          }
        }
      `}</style>
    </>
  );
}
