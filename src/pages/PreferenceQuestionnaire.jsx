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

export default function PreferenceQuestionnaire() {
  useRequireUserType();

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

  const handleNext = () => {
    setStep(2);
    // Scroll to top?
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({
        preference_field: preferences.field,
        preference_job_type: preferences.job_type,
        preference_availability: preferences.availability,
        preference_location: preferences.location,
        preference_profession: preferences.profession_search,
        preference_traits: preferences.traits, // Assuming the backend can handle array or we might need to join().
      });


      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error("Failed to save preferences:", error);
      navigate(createPageUrl('Profile'));
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

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
