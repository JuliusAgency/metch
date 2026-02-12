import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, CV } from '@/api/entities';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import Step1 from '@/components/preference-questionnaire/Step1';
import Step2 from '@/components/preference-questionnaire/Step2';
import InfoPopup from '@/components/ui/info-popup';

import StepIndicator from '@/components/ui/StepIndicator';
import { Info, ChevronRight, Menu } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import VectorLogo from '@/assets/Vector.svg';
import { invalidateInsightsCache } from '@/services/insightsService';

const AVAILABILITY_MAPPING = {
  'immediate': 'מיידית',
  'two_weeks': 'שבוע עד שבועיים',
  'one_month': 'חודש עד חודשיים',
  'negotiable': 'גמיש/ה'
};

const REVERSE_AVAILABILITY_MAPPING = Object.fromEntries(
  Object.entries(AVAILABILITY_MAPPING).map(([k, v]) => [v, k])
);

// Based on matchScore.js expecting 'full_time', 'part_time'
const JOB_TYPE_MAPPING = {
  'full_time': 'מלאה',
  'part_time': 'חלקית',
  'shifts': 'משמרות',
  'flexible': 'גמיש/ה'
};

const REVERSE_JOB_TYPE_MAPPING = Object.fromEntries(
  Object.entries(JOB_TYPE_MAPPING).map(([k, v]) => [v, k])
);

import { useUser } from '@/contexts/UserContext';

export default function PreferenceQuestionnaire() {
  useRequireUserType();
  const { updateProfile } = useUser();

  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1', 10);
  const [step, setStep] = useState(initialStep);
  const [preferences, setPreferences] = useState({
    field: '',
    profession_search: '',
    location: '',
    job_type: '',
    availability: '',
    traits: []
  });

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await User.me();

        // Traits
        let traits = [];
        if (Array.isArray(user.character_traits)) {
          traits = user.character_traits;
        } else if (typeof user.character_traits === 'string') {
          try {
            const parsed = JSON.parse(user.character_traits);
            traits = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error("Failed to parse character_traits:", e);
            traits = [];
          }
        }

        // Job Type (Handle Array or String & Map to Hebrew)
        let loadedJobType = '';
        const dbJobType = Array.isArray(user.preferred_job_types) && user.preferred_job_types.length > 0
          ? user.preferred_job_types[0]
          : (typeof user.preferred_job_types === 'string' ? user.preferred_job_types : '');

        loadedJobType = JOB_TYPE_MAPPING[dbJobType] || dbJobType || '';

        // Availability (Map to Hebrew)
        // Availability (Keep as English/DB value)
        const loadedAvailability = user.availability || '';

        // FALLBACK: If traits are empty in UserProfile, try to load from CV
        if (traits.length === 0) {
          try {
            const cvs = await CV.filter({ user_email: user.email });
            if (cvs && cvs.length > 0) {
              // Find the one with skills
              const cvWithSkills = cvs.find(c => Array.isArray(c.skills) && c.skills.length > 0) || cvs[0];
              const fullCv = await CV.get(cvWithSkills.id);
              if (Array.isArray(fullCv.skills) && fullCv.skills.length > 0) {
                traits = fullCv.skills;
              }
            }
          } catch (cvErr) {
            console.error("Failed to load fallback traits from CV:", cvErr);
          }
        }

        setPreferences({
          field: user.specialization || '',
          profession_search: user.profession || '',
          location: user.preferred_location || '',
          job_type: loadedJobType,
          availability: loadedAvailability,
          traits: traits
        });
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const handleNext = () => {
    // If we are on step 1, always go to step 2 first (even in onboarding)
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If we are on step 2 (or generally ready to save)
    handleSave();
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for DB
      const dbAvailability = REVERSE_AVAILABILITY_MAPPING[preferences.availability] || preferences.availability;

      const dbJobType = REVERSE_JOB_TYPE_MAPPING[preferences.job_type] || preferences.job_type;
      const dbJobTypesArray = dbJobType ? [dbJobType] : [];

      const updateData = {
        profession: preferences.profession_search,
        preferred_location: preferences.location,
        preferred_job_types: dbJobTypesArray,
        availability: dbAvailability,
        character_traits: preferences.traits.map(t => t.replace(' #2', '')),
        specialization: preferences.field
      };

      const updatedProfile = await updateProfile(updateData);

      // Invalidate insights cache so they refresh with new preferences
      if (updatedProfile?.id) {
        invalidateInsightsCache(updatedProfile.id);
      }

      const returnTo = searchParams.get('returnTo');
      const isOnboarding = searchParams.get('onboarding') === 'true';
      const choice = searchParams.get('choice');

      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (isOnboarding && choice === 'upload') {
        // Special flow for "I have CV" onboarding: always go back to CVGenerator for upload step
        navigate(createPageUrl('CVGenerator?choice=upload&step=-1&onboarding=true'), { replace: true });
      } else if (isOnboarding) {
        // Final onboarding step
        navigate(createPageUrl('JobSeekerProfileCompletion?onboarding=true'), { replace: true });
      } else {
        // Just go to dashboard normally
        navigate(createPageUrl('Dashboard'), { replace: true });
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "שגיאה בשמירה",
        description: `שגיאה: ${error.message || "אירעה שגיאה בעת שמירת ההעדפות"}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const choice = searchParams.get('choice');
  const isOnboarding = searchParams.get('onboarding') === 'true';

  // Show functional mobile header only when coming from CV flow (choice=upload)
  // Hide it during initial onboarding to let Layout's decorative header show
  const showMobileHeader = choice === 'upload';

  return (
    <div className="h-full relative" dir="rtl">
      {/* Mobile Background Gradient - Only Top 25% */}
      <div className="absolute top-0 left-0 right-0 h-[15vh] bg-gradient-to-b from-[#dbecf3] to-transparent md:hidden opacity-100 pointer-events-none z-0" />

      {/* Mobile Header - Pill Shape - Only show when coming from CV flow */}
      {showMobileHeader && (
        <div className="w-full px-2 pt-1 pb-2 md:hidden sticky top-0 z-10">
          <div className="bg-[#e0eef5]/90 backdrop-blur-md border border-white/40 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
            <button className="text-[#001d3d] p-1">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1">
              <p className="font-['Poppins',_sans-serif] text-2xl text-[#001d3d] font-light pt-0.5 tracking-tight">Metch</p>
              <img src={VectorLogo} alt="Metch Logo" className="w-3.5 h-3.5 object-contain" />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (step > 1) {
            handleBack();
          } else {
            const backTo = searchParams.get('backTo');
            const returnTo = searchParams.get('returnTo');
            const choice = searchParams.get('choice');
            const isOnboarding = searchParams.get('onboarding') === 'true';

            if (backTo) {
              navigate(backTo);
            } else if (isOnboarding && choice === 'upload') {
              // Go back to CVGenerator Step 1
              navigate(createPageUrl('CVGenerator?choice=upload&step=1&onboarding=true'));
            } else if (returnTo) {
              navigate(returnTo);
            } else {
              navigate(-1);
            }
          }
        }}
        className="hidden md:flex absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full items-center justify-center transition-colors z-[60] shadow-sm"
        aria-label="חזור"
      >
        <ChevronRight className="w-6 h-6 text-gray-600" />
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full relative overflow-y-auto z-[1]"
      >
        <div className="p-4 md:p-12 flex flex-col items-center w-full max-w-4xl mx-auto mt-4 md:mt-0">

          <h1 className="text-3xl font-bold text-gray-800 mb-2 md:hidden">ההעדפות שלך</h1>

          <StepIndicator
            totalSteps={isOnboarding ? (searchParams.get('choice') === 'upload' ? 5 : 2) : 2}
            currentStep={isOnboarding && searchParams.get('choice') === 'upload' ? (step === 1 ? 2 : 3) : step}
          />

          <div className="w-full bg-white md:bg-transparent rounded-3xl p-6 md:p-0 shadow-[0_2px_12px_rgba(0,0,0,0.1)] md:shadow-none border border-gray-100 md:border-none mt-8 md:mt-0">
            {step === 1 && (
              <Step1
                preferences={preferences}
                setPreferences={setPreferences}
                onNext={handleNext}
                saving={saving}
                isOnboarding={isOnboarding}
              />
            )}

            {step === 2 && (
              <Step2
                preferences={preferences}
                setPreferences={setPreferences}
                onSave={handleSave}
                onBack={handleBack}
                saving={saving}
              />
            )}

            {/* Terms / Info Block (Inside Card) */}
            {(step === 1 || step === 2) && (
              <div className="hidden lg:flex items-start gap-2 text-gray-500 text-xs text-right mt-6">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <p>ההתאמה נעשית בהתבסס על קורות החיים, גם אם שאלון ההעדפה לא מדוייק</p>
              </div>
            )}
          </div>

          {/* Mobile "Continue" Button for Step 1 */}
          {step === 1 && (
            <div className="w-full mt-10 md:hidden">
              <Button
                onClick={handleNext}
                disabled={saving || !preferences.location || !preferences.profession_search || !preferences.job_type || !preferences.availability}
                className={`w-full h-14 rounded-full text-lg font-bold shadow-sm transition-all
                  ${(preferences.location && preferences.profession_search && preferences.job_type && preferences.availability)
                    ? 'bg-[#2987cd] hover:bg-[#1f6ba8] text-white shadow-blue-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {saving ? "שומר..." : "הבא"}
              </Button>
            </div>
          )}

          {/* Mobile "Continue" Button for Step 2 */}
          {step === 2 && (
            <div className="w-full mt-10 md:hidden">
              <Button
                onClick={handleSave}
                disabled={saving || (preferences.traits || []).length !== 3}
                className={`w-full h-14 rounded-full text-lg font-bold shadow-sm transition-all
                  ${(preferences.traits || []).length === 3
                    ? 'bg-[#2987cd] hover:bg-[#1f6ba8] text-white shadow-blue-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {saving ? "שומר..." : "שמור והמשך"}
              </Button>
            </div>
          )}


          {/* Footer spacer if needed, or remove completely */}
          <div className="md:hidden h-6" />

        </div>
      </motion.div>
    </div>
  );
}
