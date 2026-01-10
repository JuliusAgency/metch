import React, { useState, useEffect, useCallback } from 'react';
import { CV } from '@/api/entities';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import CVStepper from '@/components/cv_generator/CVStepper';
import Step1PersonalDetails from '@/components/cv_generator/Step1_PersonalDetails';
import Step2WorkExperience from '@/components/cv_generator/Step2_WorkExperience';
import Step3Education from '@/components/cv_generator/Step3_Education';
import Step4Certifications from '@/components/cv_generator/Step4_Certifications';

import Step6Summary from '@/components/cv_generator/Step6_Summary';
import Step7Preview from '@/components/cv_generator/Step7_Preview';
import UploadCV from '@/components/cv_generator/UploadCV';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import cvCreateIcon from '@/assets/cv_create_icon.png';
import cvExistsIcon from '@/assets/cv_exists_icon.png';

const STEPS = ["פרטים אישיים", "ניסיון תעסוקתי", "השכלה", "הסמכות", "תמצית", "תצוגה מקדימה"];

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

const ChoiceCard = ({ title, description, imageSrc, onClick, isSelected }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`cursor-pointer bg-white rounded-3xl p-8 text-right border-2 transition-all duration-300 h-full shadow-sm hover:shadow-xl ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-50'}`}>

    <div className="flex justify-between items-center gap-6">
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-blue-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-base leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <img src={imageSrc} alt={title} className="w-24 h-24 object-contain" />
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
  const [searchParams] = useSearchParams();

  const handleStep1ValidityChange = useCallback((isValid) => {
    setIsStep1Valid(isValid);
  }, []);

  // Save draft to localStorage whenever cvData or step changes
  useEffect(() => {
    if (!user?.email || step < 1) return;

    const draftKey = `cv_draft_${user.email}`;
    const draftData = {
      cvData,
      step,
      userId: user.id, // Bind draft to specific user ID
      timestamp: Date.now()
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [cvData, step, user]);

  const validatePersonalDetails = (details) => {
    if (!details) return false;
    const { full_name, phone, address, birth_date, gender } = details;

    const hasFullName = full_name && full_name.trim().split(' ').length >= 2;
    const hasPhone = phone && phone.trim().length > 0;
    const hasAddress = address && address.trim().length > 0;
    const hasBirthDate = birth_date && birth_date.trim().length > 0;
    const hasGender = gender && gender.trim().length > 0;

    return hasFullName && hasPhone && hasAddress && hasBirthDate && hasGender;
  };

  // Handle URL Choice Param - STRICT PRIORITY
  useEffect(() => {
    const choiceParam = searchParams.get('choice');
    if (choiceParam === 'upload') {
      setChoice('upload');
      setStep(-1);
    } else if (choiceParam === 'create') {
      setChoice('create');
      // Only set step to 1 if we are not already on a deeper step (e.g. via draft)
      // But if user explicitly asks for create via URL, we might want to start fresh or continue?
      // Let's assume URL 'create' means start flow.
      setStep((prev) => (prev > 0 ? prev : 1));
    }
  }, [searchParams]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        // Check for local draft first
        const draftKey = `cv_draft_${userData.email}`;
        const savedDraft = localStorage.getItem(draftKey);

        const urlChoice = searchParams.get('choice'); // Check param directly here

        if (savedDraft) {
          try {
            const { cvData: draftCvData, step: draftStep, userId: draftUserId } = JSON.parse(savedDraft);

            // Validate draft owner
            let isDraftValid = true;
            if (!draftUserId || draftUserId !== userData.id) {
              localStorage.removeItem(draftKey);
              isDraftValid = false;
            }

            if (isDraftValid && draftCvData) {
              const normalizedData = normalizeCvRecord(draftCvData);
              setCvData(normalizedData);

              // Restore step ONLY if URL choice is NOT present
              if (!urlChoice) {
                setStep(draftStep || 1);
              }

              const isValid = validatePersonalDetails(normalizedData.personal_details);
              setIsStep1Valid(isValid);

              const existingCvs = await CV.filter({ user_email: userData.email });
              if (existingCvs.length > 0) {
                setCvId(existingCvs[0].id);
              }
              return;
            }
          } catch (e) {
            console.error("Error parsing draft:", e);
            localStorage.removeItem(draftKey);
          }
        }

        // Fallback to DB if no draft
        const existingCvs = await CV.filter({ user_email: userData.email });
        if (existingCvs.length > 0) {
          const normalizedData = normalizeCvRecord(existingCvs[0]);
          setCvData(normalizedData);
          setCvId(existingCvs[0].id);

          const isValid = validatePersonalDetails(normalizedData.personal_details);
          setIsStep1Valid(isValid);

          // Restore step ONLY if URL choice is NOT present
          if (!urlChoice) {
            setStep(1);
          }
        } else {
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

    // Call load function
    loadInitialData();
  }, [searchParams]); // Keep searchParams dep to reload if URL changes

  const [isDirty, setIsDirty] = useState(false);

  const handleDirtyChange = useCallback((dirty) => {
    setIsDirty(dirty);
  }, []);

  const confirmUnsavedChanges = () => {
    if (!isDirty) return true;
    return window.confirm("יש לך שינויים שלא נשמרו. אם תמשיך, השינויים יאבדו. האם להמשיך?");
  };

  // Warn on page refresh/close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const { toast } = useToast();

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

    // Check for unsaved changes before proceeding
    if (!confirmUnsavedChanges()) return;
    setIsDirty(false); // Reset dirty state if proceeding

    setSaving(true);
    try {
      // Ensure we have user email - use from user state or cvData personal_details
      const userEmail = user?.email || cvData?.personal_details?.email;

      if (!userEmail) {
        console.error("Cannot save CV: user email is not available");
        toast({
          title: "שגיאה בשמירה",
          description: "לא ניתן לשמור את קורות החיים: אימייל משתמש חסר. נא לרענן את הדף.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      let payload = { ...cvData };
      if (step === STEPS.length) {
        if (!payload.file_name || !payload.file_name.trim()) {
          toast({
            title: "שם קובץ חסר",
            description: "אנא בחר שם לקובץ קורות החיים שלך לפני השמירה.",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
      }

      let savedCv;
      if (cvId) {
        savedCv = await CV.update(cvId, payload);
      } else {
        savedCv = await CV.create({ ...payload, user_email: userEmail });
        setCvId(savedCv.id);
      }


      // If this is the last step, navigate to Profile
      if (step === STEPS.length) {
        toast({
          title: "קורות החיים נשמרו בהצלחה",
          description: "הועברת לדף הפרופיל שלך לצפייה ועריכה."
        });

        if (userEmail) {
          localStorage.removeItem(`cv_draft_${userEmail}`);
        }

        // Small delay to let the toast be seen/state update
        setTimeout(() => {
          // Check if we are in onboarding mode
          const isOnboarding = searchParams.get('onboarding') === 'true';
          navigate(`/PreferenceQuestionnaire${isOnboarding ? '?onboarding=true' : ''}`);
        }, 500);
        return;
      }

      // Sync personal details to UserProfile whenever we save
      if (cvData.personal_details) {
        try {
          const { full_name, phone, address } = cvData.personal_details;
          await User.updateMyUserData({
            ...(full_name && { full_name }),
            ...(phone && { phone }),
            ...(address && { preferred_location: address }),
          });
        } catch (err) {
          console.error("Failed to update user profile with CV details", err);
        }
      }

      // If not last step, just save and move fast
      if (step < STEPS.length) {
        setStep((prev) => prev + 1);
      }

    } catch (error) {
      console.error("Error saving CV:", error);
      toast({
        title: "שגיאה בשמירה",
        description: "אירעה שגיאה בעת שמירת השינויים. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStepSelect = (index) => {
    if (!isStep1Valid && index > 0) {
      return;
    }
    // Check for unsaved changes before switching steps
    if (!confirmUnsavedChanges()) return;
    setIsDirty(false);
    setStep(index + 1);
  };

  const handleBack = () => {
    // Check for unsaved changes before going back
    if (!confirmUnsavedChanges()) return;
    setIsDirty(false);

    if (step > 1) {
      setStep((prev) => prev - 1);
    } else if (step === 1 || step === -1 || step === 0) {
      // If we have a choice param, go back to selection page
      if (searchParams.get('choice')) {
        navigate('/UserTypeSelection');
      } else {
        setStep(0); // Regular fallback
        setChoice(null);
      }
    }
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleUploadComplete = () => {
    // Clear draft
    if (user?.email) {
      localStorage.removeItem(`cv_draft_${user.email}`);
    }
    // After upload, user is done with this flow, navigate to profile
    const isOnboarding = searchParams.get('onboarding') === 'true';
    navigate(createPageUrl(`PreferenceQuestionnaire${isOnboarding ? '?onboarding=true' : ''}`));
  };

  const renderStep = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div></div>;
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

            <div className="mb-12">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">נרשמת בהצלחה</h1>
              <h2 className="text-4xl font-extrabold text-blue-500 mb-6">המאצ' המושלם מחכה לך</h2>
              <p className="text-gray-500 text-lg">רק עוד כמה צעדים ואנחנו נמצא בשבילך את העבודה<br />שהכי מתאימה לדרישות שלך</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 px-4">
              <ChoiceCard
                title="צרו לי קורות חיים"
                description="אל דאגה, נבנה יחד איתך קורות חיים שיעזרו לך למצוא את מאצ' מדויק - בעזרת הבינה המלאכותית שלנו ובחינם לגמרי."
                imageSrc={cvCreateIcon}
                onClick={() => setChoice('create')}
                isSelected={choice === 'create'} />

              <ChoiceCard
                title="יש לי קורות חיים"
                description="זה אומר שתוכל להעלות את הקובץ ולקבל הצעות עבודה מדויקות כבר עכשיו!"
                imageSrc={cvExistsIcon}
                onClick={() => setChoice('upload')}
                isSelected={choice === 'upload'} />

            </div>
          </motion.div>);

      case 1: return <Step1PersonalDetails data={cvData.personal_details} setData={(d) => setCvData((prev) => ({ ...prev, personal_details: d(prev.personal_details) }))} user={user} onValidityChange={handleStep1ValidityChange} />;
      case 2: return <Step2WorkExperience data={cvData.work_experience || []} setData={(updater) => setCvData((prev) => ({ ...prev, work_experience: updater(prev.work_experience || []) }))} onDirtyChange={handleDirtyChange} />;
      case 3: return <Step3Education data={cvData.education || []} setData={(updater) => setCvData((prev) => ({ ...prev, education: updater(prev.education || []) }))} onDirtyChange={handleDirtyChange} />;
      case 4: return <Step4Certifications data={cvData.certifications || []} setData={(updater) => setCvData((prev) => ({ ...prev, certifications: updater(prev.certifications || []) }))} onDirtyChange={handleDirtyChange} />;
      case 5: return <Step6Summary data={cvData.summary || ''} setData={(d) => setCvData((prev) => ({ ...prev, summary: d }))} />;
      case 6: return <Step7Preview cvData={cvData} setData={(d) => setCvData(prev => ({ ...prev, ...d }))} onEdit={handleEdit} />;
      default: return null;
    }
  };

  const disabledStepIndexes = !isStep1Valid
    ? STEPS.map((_, idx) => (idx > 0 ? idx : null)).filter((idx) => idx !== null)
    : [];

  const isNextDisabled = saving || (step === 0 && !choice) || (step === 1 && !isStep1Valid) || (step === STEPS.length && (!cvData.file_name || !cvData.file_name.trim()));

  return (
    <div className="p-4 md:p-8 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto bg-gradient-to-b from-[#E0F3FF] via-white to-white rounded-[2rem] shadow-xl p-8 md:p-14">
        {step > 0 && (
          <CVStepper
            currentStep={step - 1}
            steps={STEPS}
            onStepSelect={handleStepSelect}
            disabledSteps={disabledStepIndexes}
          />
        )}

        <div className="my-10 min-h-[400px] flex flex-col justify-center">
          {renderStep()}
        </div>

        <div className={`flex ${step === 0 ? 'justify-center' : 'justify-between'} items-center mt-auto`}>
          {(step > 1 || step === -1 || step === 1) && (
            <Button variant="outline" onClick={handleBack} disabled={saving} className="px-8 py-3 rounded-full font-semibold text-lg h-auto border-2 hover:bg-gray-50">
              <ArrowRight className="w-5 h-5 ml-2" />
              חזור
            </Button>
          )}
          {step !== -1 && step < STEPS.length + 1 && (
            <Button
              onClick={handleNext}
              disabled={isNextDisabled}
              className="px-16 py-3 rounded-full font-bold text-lg h-auto bg-[#2589D8] hover:bg-[#1e7bc4] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {saving ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : (step === 0 ? 'המשך' : (step === STEPS.length ? 'שמור וסיים' : 'הבא'))}
              {!saving && step !== 0 && <ArrowLeft className="w-5 h-5 mr-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>);

}
