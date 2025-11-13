import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CV } from '@/api/entities';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import CVStepper from '@/components/cv_generator/CVStepper';
import Step1PersonalDetails from '@/components/cv_generator/Step1_PersonalDetails';
import Step2WorkExperience from '@/components/cv_generator/Step2_WorkExperience';
import Step3Education from '@/components/cv_generator/Step3_Education';
import Step4Certifications from '@/components/cv_generator/Step4_Certifications';
import Step5Skills from '@/components/cv_generator/Step5_Skills';
import Step6Summary from '@/components/cv_generator/Step6_Summary';
import Step7Preview from '@/components/cv_generator/Step7_Preview';
import UploadCV from '@/components/cv_generator/UploadCV';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { useRequireUserType } from '@/hooks/use-require-user-type';

const STEPS = ["פרטים אישיים", "ניסיון תעסוקתי", "השכלה", "הסמכות", "כישורים", "תמצית", "תצוגה מקדימה"];

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const ensureObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? { ...parsed } : {};
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeCvRecord = (record = {}) => ({
  ...record,
  personal_details: ensureObject(record.personal_details),
  work_experience: ensureArray(record.work_experience),
  education: ensureArray(record.education),
  certifications: ensureArray(record.certifications),
  skills: ensureArray(record.skills)
});

const ChoiceCard = ({ title, description, icon: Icon, onClick, isSelected }) => (
    <motion.div
        whileHover={{ scale: 1.03 }}
        onClick={onClick}
        className={`cursor-pointer bg-white rounded-2xl p-6 text-right border-2 transition-all duration-200 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>

        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
);



export default function CVGenerator() {
  useRequireUserType(); // Ensure user has selected a user type
  const [step, setStep] = useState(0); // Start at step 0 for choice
  const [cvData, setCvData] = useState(() => normalizeCvRecord({}));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvId, setCvId] = useState(null);
  const [choice, setChoice] = useState(null); // 'upload' or 'create'
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const navigate = useNavigate();

  const handleStep1ValidityChange = useCallback((isValid) => {
    setIsStep1Valid(isValid);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const existingCvs = await CV.filter({ user_email: userData.email });
        if (existingCvs.length > 0) {
          setCvData(normalizeCvRecord(existingCvs[0]));
          setCvId(existingCvs[0].id);
        } else {
          // Prefill with user data if available
          setCvData((prev) => ({
            ...prev,
            personal_details: {
              full_name: userData.full_name || '',
              email: userData.email || '',
              phone: userData.phone || ''
            }
          }));
        }
      } catch (error) {
        console.error("Error loading initial data", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleNext = async () => {
    if (step === 0) {
      if (choice === 'upload') {
        // Go to upload step
        setStep(-1); 
      } else if (choice === 'create') {
        setStep(1);
      }
      return;
    }

    if (step === 1 && !isStep1Valid) {
      return;
    }

    setSaving(true);
    try {
      // Ensure we have user email - use from user state or cvData personal_details
      const userEmail = user?.email || cvData?.personal_details?.email;
      
      if (!userEmail) {
        console.error("Cannot save CV: user email is not available");
        alert("Unable to save CV. Please refresh the page and try again.");
        setSaving(false);
        return;
      }

      let savedCv;
      if (cvId) {
        savedCv = await CV.update(cvId, cvData);
      } else {
        savedCv = await CV.create({ ...cvData, user_email: userEmail });
        setCvId(savedCv.id);
      }
      console.log("Saved CV data:", savedCv);
    } catch (error) {
      console.error("Error saving CV:", error);
    } finally {
      setSaving(false);
    }

    if (step < STEPS.length) {
      setStep((prev) => prev + 1);
    } else {
      // Last step, navigate to profile or dashboard
      navigate(createPageUrl('Profile'));
    }
  };

  const handleStepSelect = (index) => {
    if (!isStep1Valid && index > 0) {
      return;
    }
    setStep(index + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else if (step === 1 || step === -1) {
      setStep(0); // Go back to choice
      setChoice(null);
    }
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleUploadComplete = () => {
    // After upload, user is done with this flow, navigate to profile
    navigate(createPageUrl('Profile'));
  };

  const renderStep = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    switch (step) {
      case -1:
        return <UploadCV user={user} onUploadComplete={handleUploadComplete} />;
      case 0:
        return (
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>

            <h1 className="text-3xl font-bold text-gray-900">נרשמת בהצלחה</h1>
            <h2 className="text-4xl font-extrabold text-blue-600 mb-4">המאצ' המושלם מחכה לך</h2>
            <p className="text-gray-600 mb-12">רק עוד כמה צעדים ונמצא בשבילך את העבודה שהכי מתאימה לדרישות שלך</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <ChoiceCard
                title="צרו לי קורות חיים"
                description="אל דאגה, נבנה יחד איתך קורות חיים שיעזרו לך למצוא את מאצ' מדויק - בעזרת הבינה המלאכותית שלנו ובחינם לגמרי."
                icon={Sparkles}
                onClick={() => setChoice('create')}
                isSelected={choice === 'create'} />

              <ChoiceCard
                title="יש לי קורות חיים"
                description="זה אומר שתוכל להעלות את הקובץ ולקבל הצעות עבודה מדויקות כבר עכשיו!"
                icon={FileText}
                onClick={() => setChoice('upload')}
                isSelected={choice === 'upload'} />

            </div>
          </motion.div>);

      case 1: return <Step1PersonalDetails data={cvData.personal_details} setData={(d) => setCvData((prev) => ({ ...prev, personal_details: d(prev.personal_details) }))} user={user} onValidityChange={handleStep1ValidityChange} />;
      case 2: return <Step2WorkExperience data={cvData.work_experience || []} setData={(updater) => setCvData((prev) => ({ ...prev, work_experience: updater(prev.work_experience || []) }))} />;
      case 3: return <Step3Education data={cvData.education || []} setData={(updater) => setCvData((prev) => ({ ...prev, education: updater(prev.education || []) }))} />;
      case 4: return <Step4Certifications data={cvData.certifications || []} setData={(updater) => setCvData((prev) => ({ ...prev, certifications: updater(prev.certifications || []) }))} />;
      case 5: return <Step5Skills data={cvData.skills || []} setData={(d) => setCvData((prev) => ({ ...prev, skills: d }))} />;
      case 6: return <Step6Summary data={cvData.summary || ''} setData={(d) => setCvData((prev) => ({ ...prev, summary: d }))} />;
      case 7: return <Step7Preview cvData={cvData} setData={(d) => setCvData(prev => ({...prev, ...d}))} onEdit={handleEdit} />;
      default: return null;
    }
  };

  const disabledStepIndexes = !isStep1Valid
    ? STEPS.map((_, idx) => (idx > 0 ? idx : null)).filter((idx) => idx !== null)
    : [];

  const isNextDisabled = saving || (step === 0 && !choice) || (step === 1 && !isStep1Valid);

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
        {step > 0 && (
          <CVStepper
            currentStep={step - 1}
            steps={STEPS}
            onStepSelect={handleStepSelect}
            disabledSteps={disabledStepIndexes}
          />
        )}

        <div className="my-10 min-h-[400px]">
          {renderStep()}
        </div>

        <div className={`flex ${step === 0 ? 'justify-center' : 'justify-between'} items-center`}>
          {(step > 1 || step === -1 || step === 1) && (
            <Button variant="outline" onClick={handleBack} disabled={saving} className="px-8 py-3 rounded-full font-semibold text-lg h-auto">
              <ArrowRight className="w-5 h-5 ml-2" />
              חזור
            </Button>
          )}
          {step !== -1 && step < STEPS.length + 1 && (
            <Button
              onClick={handleNext}
              disabled={isNextDisabled}
              className="px-10 py-4 rounded-full font-bold text-lg h-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (step === 0 ? 'המשך' : (step === STEPS.length ? 'שמור וסיים' : 'הבא'))}
              {!saving && step !== 0 && <ArrowLeft className="w-5 h-5 mr-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>);

}
