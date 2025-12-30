import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import Step1 from '@/components/preference-questionnaire/Step1';
import Step2 from '@/components/preference-questionnaire/Step2';
import ProgressBar from '@/components/preference-questionnaire/ProgressBar';
import { Info } from 'lucide-react';

const AVAILABILITY_MAPPING = {
  'immediate': 'מיידי',
  'two_weeks': 'שבוע עד שבועיים',
  'one_month': 'חודש עד חודשיים',
  'negotiable': 'גמישה'
};

const REVERSE_AVAILABILITY_MAPPING = Object.fromEntries(
  Object.entries(AVAILABILITY_MAPPING).map(([k, v]) => [v, k])
);

// Based on matchScore.js expecting 'full_time', 'part_time'
const JOB_TYPE_MAPPING = {
  'full_time': 'מלאה',
  'part_time': 'חלקית',
  'shifts': 'משמרות',
  'flexible': 'גמישה'
};

const REVERSE_JOB_TYPE_MAPPING = Object.fromEntries(
  Object.entries(JOB_TYPE_MAPPING).map(([k, v]) => [v, k])
);

import { useUser } from '@/contexts/UserContext';

export default function PreferenceQuestionnaire() {
  useRequireUserType();
  const { updateProfile } = useUser();

  const [step, setStep] = useState(1);
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
        const loadedAvailability = AVAILABILITY_MAPPING[user.availability] || user.availability || '';

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
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        character_traits: preferences.traits,
        specialization: preferences.field,
      };

      // Use context updateProfile to ensure global state is updated immediately
      // This prevents the Dashboard from seeing stale data (missing specialization)
      await updateProfile(updateData);

      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // In case of error (e.g. schema mismatch), we might still want to navigate or show distinct error
      // navigate(createPageUrl('Profile')); // Uncomment to force navigate on error if needed
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[80vh]">
          <CardContent className="p-8 md:p-12 flex flex-col items-center">

            <ProgressBar currentStep={step} />

            {step === 1 && (
              <Step1
                preferences={preferences}
                setPreferences={setPreferences}
                onNext={handleNext}
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


            <div className="mt-auto pt-10 w-full flex items-center justify-center gap-3 border-t border-gray-50">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-gray-500 text-sm">
                ההתאמה נעשית בהתבסס על קורות החיים, גם אם שאלון ההעדפה לא מדוייק
              </span>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
