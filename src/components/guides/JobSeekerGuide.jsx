
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GUIDE_STEPS = [
  {
    id: 1,
    title: "ברוכים הבאים לדשבורד של METCH",
    content: "סקירה קצרה של הדשבורד שלנו",
    target: null,
    position: "center"
  },
  {
    id: 2,
    title: "הסטטיסטיקות שלך",
    content: "כאן ניתן לראות כמה משרות רלוונטיות יש, כמה מועמדויות הגשת וכמה צפו בקו״ח שלך",
    target: ".stats-grid",
    position: "bottom"
  },
  {
    id: 3,
    title: "התראות חדשות",
    content: "התראות על משרות חדשות, תגובות למועמדויות וצפיות בפרופיל שלך מופיעות כאן",
    target: ".notification-carousel",
    position: "bottom"
  },
  {
    id: 4,
    title: "חיפוש משרות",
    content: "שדה החיפוש כאן נועד לעזור לך למצוא משרות שמאצ' התאימה במיוחד עבורך",
    target: ".job-search-input",
    position: "bottom-screen"
  },
  {
    id: 5,
    title: "משרות מותאמות אישית",
    content: "המערכת מציגה לך משרות מותאמות אישית במיוחד עבורך, יש ללחוץ על כפתור כדי לראות פרטים נוספים",
    target: ".job-list",
    position: "top-screen",
    gap: 200
  },
  {
    id: 6,
    title: "סיימנו",
    content: "עכשיו אנחנו מכירים את הדף הראשי, יאללה מתחילים :)",
    target: null,
    position: "center"
  }
];

export default function JobSeekerGuide({ isActive, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [guidePosition, setGuidePosition] = useState({ top: 0, left: 0, transform: '' });
  const [targetRect, setTargetRect] = useState(null);
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

  const updatePosition = () => {
    const step = GUIDE_STEPS[currentStep];
    if (!step.target || isMobile) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 20;
      const cardWidth = 320;
      const cardHeight = 300;

      let top, left, transform = '';

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + (step.gap || 20);
          left = rect.left + (rect.width / 2);
          transform = 'translateX(-50%)';
          break;
        case 'top':
          top = rect.top - (step.gap || 700);
          left = rect.left + (rect.width / 2);
          transform = 'translate(-50%, -100%)';
          break;
        case 'right':
          top = rect.top + (rect.height / 2);
          left = rect.right + 20;
          transform = 'translateY(-50%)';
          break;
        case 'left':
          top = rect.top + (rect.height / 2);
          left = rect.left - 20;
          transform = 'translate(-100%, -50%)';
          break;
        case 'bottom-screen':
          top = viewportHeight - cardHeight - 40;
          left = rect.left + (rect.width / 2) + 190; // Shifted further right (+70px)
          transform = 'translateX(-50%)';
          break;
        case 'top-screen':
          top = step.gap || 200;
          left = rect.left + (rect.width / 2);
          transform = 'translateX(-50%)';
          break;
        default:
          top = rect.top + (rect.height / 2);
          left = rect.left - 20;
          transform = 'translate(-100%, -50%)';
      }

      // Fallback for 'top' position
      const isOffTop = step.position === 'top' && (rect.top - cardHeight - (step.gap || 700) < 0);
      if (isOffTop) {
        if (viewportHeight - rect.bottom > rect.top + 100) {
          top = rect.bottom + 20;
          transform = 'translateX(-50%)';
        } else {
          top = cardHeight + padding;
          transform = 'translate(-50%, -100%)';
        }
      }

      // Sanity checks
      if (left < padding) left = padding;
      if (left + cardWidth > viewportWidth - padding) left = viewportWidth - cardWidth - padding;

      const cardBottom = transform.includes('-100%') ? top : top + cardHeight;
      if (cardBottom > viewportHeight - padding) {
        top = viewportHeight - padding - (cardBottom - top);
      }

      setGuidePosition({ top, left, transform });
      setTargetRect(rect);
      element.classList.add('guide-highlight');
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (!isActive) {
      document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
      return;
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
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
  const isCenter = step.position === "center" || isMobile; // Guide is always centered on mobile

  return createPortal(
    <>
      {/* Cutout Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {targetRect ? (
          <>
            {/* Top mask */}
            <div
              className="absolute top-0 left-0 right-0 bg-slate-900/40 backdrop-blur-[0.5px]"
              style={{ height: `${targetRect.top - 8}px` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-slate-900/40 backdrop-blur-[0.5px]"
              style={{ top: `${targetRect.bottom + 8}px` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-slate-900/40 backdrop-blur-[0.5px]"
              style={{ top: `${targetRect.top - 8}px`, bottom: `${window.innerHeight - targetRect.bottom - 8}px`, width: `${targetRect.left - 8}px` }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-slate-900/40 backdrop-blur-[0.5px]"
              style={{ top: `${targetRect.top - 8}px`, bottom: `${window.innerHeight - targetRect.bottom - 8}px`, left: `${targetRect.right + 8}px` }}
            />
          </>
        ) : (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[0.5px]" />
        )}
      </div>

      {/* Guide Card */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed z-[120] ${isCenter // If isCenter is true (which it is for all mobile cases)
            ? 'inset-0 flex items-center justify-center'
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
          <Card className={`bg-white shadow-2xl rounded-2xl border-2 border-blue-200 ${isMobile ? 'w-[calc(100vw-2rem)] max-w-sm mx-auto' : 'w-80'
            }`}>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className={`rounded-full hover:bg-gray-100 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'
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

              <h3 className={`font-bold text-gray-900 mb-3 ${isMobile ? 'text-base' : 'text-lg'
                }`}>
                {step.title}
              </h3>
              <p className={`text-gray-600 mb-6 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'
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
                      className={`rounded-full ${isMobile ? 'w-2 h-2' : 'w-2 h-2'
                        } ${index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextStep}
                  className={`bg-blue-600 hover:bg-blue-700 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-4'
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
          position: relative !important;
          z-index: 110 !important;
          border-radius: 8px !important;
        }
      `}</style>
    </>,
    document.body
  );
}
