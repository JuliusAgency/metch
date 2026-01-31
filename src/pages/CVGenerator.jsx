import React, { useState, useEffect, useCallback } from 'react';
import { CV } from '@/api/entities';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
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
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Loader2, Menu } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import cvCreateIcon from '@/assets/cv_create_icon.png';
import cvExistsIcon from '@/assets/cv_exists_icon.png';
import CVChoiceModal from '@/components/CVChoiceModal';
import globeGrid from '@/assets/globe_grid.png';
import StepIndicator from '@/components/ui/StepIndicator';
import VectorLogo from '@/assets/Vector.svg';

const STEPS = ["פרטים אישיים", "ניסיון תעסוקתי", "השכלה", "הסמכות", "כישורים", "תמצית", "תצוגה מקדימה"];
const STEPS_MOBILE = ["פרטים", "ניסיון", "השכלה", "הסמכות", "כישורים", "תמצית", "תצוגה מקדימה"];

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

const mergeProfileToCv = (cvData, userData) => {
  console.log("[CVGenerator] Merging Profile to CV", { userData, cvData });
  if (!userData) return cvData;
  const normalized = normalizeCvRecord(cvData);

  // Helper to ensure date is in YYYY-MM-DD format for date inputs
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr !== 'string') return '';
    const formatted = dateStr.split('T')[0];
    console.log("[CVGenerator] Formatting Date:", { original: dateStr, formatted });
    return formatted;
  };

  const birthDate = formatDate(userData.date_of_birth) || normalized.personal_details.birth_date || '';
  console.log("[CVGenerator] Final Birth Date Choice:", birthDate);

  return {
    ...normalized,
    personal_details: {
      ...normalized.personal_details,
      full_name: userData.full_name || normalized.personal_details.full_name || '',
      email: userData.email || normalized.personal_details.email || '',
      phone: userData.phone || normalized.personal_details.phone || '',
      gender: userData.gender || normalized.personal_details.gender || '',
      birth_date: birthDate
    }
  };
};

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
  const [showSkipDisclaimer, setShowSkipDisclaimer] = useState(false); // New state for skip disclaimer
  const [uploadSuccess, setUploadSuccess] = useState(false); // New state to track if CV was uploaded but user hasn't clicked continue
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
    const stepParam = searchParams.get('step');

    if (choiceParam === 'upload') {
      setChoice('upload');
      if (stepParam) {
        setStep(parseInt(stepParam, 10));
      } else {
        setStep((prev) => (prev > 0 ? prev : 1));
      }
    } else if (choiceParam === 'create') {
      setChoice('create');
      // Only set step to 1 if we are not already on a deeper step (e.g. via draft)
      // But if user explicitly asks for create via URL, we might want to start fresh or continue?
      // Let's assume URL 'create' means start flow.
      if (stepParam) {
        setStep(parseInt(stepParam, 10));
      } else {
        setStep((prev) => (prev > 0 ? prev : 1));
      }
    } else if (stepParam) {
      setStep(parseInt(stepParam, 10));
      if (stepParam === '0') {
        setChoice(null);
      }
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
              console.log("[CVGenerator] Loading Draft for user:", userData.email);
              const mergedData = mergeProfileToCv(draftCvData, userData);
              setCvData(mergedData);

              // Restore step ONLY if URL choice is NOT present
              if (!urlChoice) {
                // If URL specifically asks for step 0 (e.g. back button), respect it.
                if (searchParams.get('step') === '0') {
                  setStep(0);
                  setChoice(null);
                } else {
                  setStep(draftStep || 1);
                }
              }

              const isValid = validatePersonalDetails(mergedData.personal_details);
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
          console.log("[CVGenerator] Loading existing CV from DB");
          const mergedData = mergeProfileToCv(existingCvs[0], userData);
          setCvData(mergedData);
          setCvId(existingCvs[0].id);

          const isValid = validatePersonalDetails(mergedData.personal_details);
          setIsStep1Valid(isValid);

          // Restore step ONLY if URL choice is NOT present
          if (!urlChoice) {
            // If URL specifically asks for step 0 (e.g. back button), respect it.
            if (searchParams.get('step') === '0') {
              setStep(0);
              setChoice(null);
            } else {
              setStep(1);
            }
          }
        } else {
          setCvData(mergeProfileToCv({}, userData));
        }
      } catch (error) {
        console.error("Error loading initial data", error);
      } finally {
        setLoading(false);
      }
    };

    // Call load function
    loadInitialData();
  }, []); // Only run on mount. URL changes are handled by the other useEffect.

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
    if (step === -1) {
      handleUploadComplete(false);
      return;
    }

    if (step === 0) {
      if (choice === 'upload') {
        // Go to Personal Details step first
        setStep(1);
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
          description: "לא ניתן לשמירהאת קורות החיים: אימייל משתמש חסר. נא לרענן את הדף.",
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

          // Correct navigation for existing users
          if (!isOnboarding && user?.is_onboarding_completed) {
            navigate(createPageUrl('Profile'));
            return;
          }

          const returnTo = isOnboarding ? '' : '/Profile';
          const target = `PreferenceQuestionnaire?onboarding=${isOnboarding}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`;
          navigate(createPageUrl(target));
        }, 500);
        return;
      }

      // Sync personal details to UserProfile whenever we save
      if (cvData.personal_details) {
        try {
          const { full_name, phone, address, gender, birth_date } = cvData.personal_details;
          await User.updateMyUserData({
            ...(full_name && { full_name }),
            ...(phone && { phone }),
            ...(address && { preferred_location: address }),
            ...(gender && { gender }),
            ...(birth_date && { date_of_birth: birth_date }),
          });
        } catch (err) {
          console.error("Failed to update user profile with CV details", err);
        }
      }

      // If not last step, just save and move fast
      if (step < STEPS.length) {
        // FORK: If choice is 'upload' and we just finished Step 1 (Personal Details),
        // go to Preference Questionnaire instead of Step 2
        if (choice === 'upload' && step === 1) {
          const isOnboarding = searchParams.get('onboarding') === 'true';
          const target = `PreferenceQuestionnaire?onboarding=${isOnboarding}&choice=upload`;
          navigate(createPageUrl(target));
          return;
        }

        setStep((prev) => prev + 1);
        const isOnboarding = searchParams.get('onboarding') === 'true';
        navigate(`/CVGenerator?choice=${choice}&step=${step + 1}${isOnboarding ? '&onboarding=true' : ''}`);
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
    // If upload success, user can technically go back but state is weird. 
    // Let's assume Back just resets uploadSuccess? Or goes back to previous step.
    // If user presses Back after upload, maybe they want to re-upload.
    // So reset success state.
    if (uploadSuccess) {
      setUploadSuccess(false);
      return;
    }

    // If showing skip disclaimer, just go back to upload screen
    if (showSkipDisclaimer) {
      setShowSkipDisclaimer(false);
      return;
    }

    // Check for unsaved changes before going back
    if (!confirmUnsavedChanges()) return;
    setIsDirty(false);

    if (step > 1) {
      setStep((prev) => prev - 1);
    } else if (step === 1 || step === -1 || step === 0) {
      if (step === -1 && choice === 'upload') {
        const isOnboarding = searchParams.get('onboarding') === 'true';
        const target = `PreferenceQuestionnaire?step=2&onboarding=${isOnboarding}&choice=upload`;
        navigate(createPageUrl(target), { replace: true });
        return;
      }
      // If we have a choice param, we used to go back to selection page /UserTypeSelection.
      // BUT UserTypeSelection might redirect to Dashboard if onboarding is done.
      // So instead, we stay in CVGenerator and show Step 0 (Choice Cards).
      const isOnboarding = searchParams.get('onboarding') === 'true';

      // Correct navigation for existing users
      if (!isOnboarding && user?.is_onboarding_completed) {
        navigate(createPageUrl('Profile'));
        return;
      }

      // FORCE STATE UPDATE IMMEDIATELY
      setStep(0);
      setChoice(null);

      navigate(`/CVGenerator?step=0${isOnboarding ? '&onboarding=true' : ''}`);
    }
    // Perform cleanup of disclaimer state if navigating back
    setShowSkipDisclaimer(false);
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleUploadComplete = (isSkip = false) => {
    // Clear draft
    if (user?.email) {
      localStorage.removeItem(`cv_draft_${user.email}`);
    }
    // After upload, user is done with this flow, navigate to profile
    // NEW FLOW: Personal -> Pref -> Upload -> JobSeekerProfileCompletion -> Career Stage -> Dashboard
    // BYPASS: If skip, go straight to Dashboard
    const isOnboarding = searchParams.get('onboarding') === 'true' || localStorage.getItem('onboarding_active') === 'true';
    if (isOnboarding) {
      navigate('/JobSeekerProfileCompletion?onboarding=true', { replace: true });
    } else {
      navigate('/Profile');
    }
  };

  const handleSkip = () => {
    if (!showSkipDisclaimer) {
      setShowSkipDisclaimer(true);
    } else {
      handleUploadComplete(true);
    }
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setShowSkipDisclaimer(false);
  };

  const handleUploadDelete = () => {
    setUploadSuccess(false);
  };

  const renderStep = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div></div>;
    }

    switch (step) {
      case -1:
        return <UploadCV
          user={user}
          onUploadSuccess={handleUploadSuccess}
          onDelete={handleUploadDelete}
          onSkip={handleSkip}
          showSkipDisclaimer={showSkipDisclaimer}
        />;


      case 1: return <Step1PersonalDetails data={cvData.personal_details} setData={(d) => setCvData((prev) => ({ ...prev, personal_details: d(prev.personal_details) }))} user={user} onValidityChange={handleStep1ValidityChange} />;
      case 2: return <Step2WorkExperience data={cvData.work_experience || []} setData={(updater) => setCvData((prev) => ({ ...prev, work_experience: updater(prev.work_experience || []) }))} onDirtyChange={handleDirtyChange} />;
      case 3: return <Step3Education data={cvData.education || []} setData={(updater) => setCvData((prev) => ({ ...prev, education: updater(prev.education || []) }))} onDirtyChange={handleDirtyChange} />;
      case 4: return <Step4Certifications data={cvData.certifications || []} setData={(updater) => setCvData((prev) => ({ ...prev, certifications: updater(prev.certifications || []) }))} onDirtyChange={handleDirtyChange} />;
      case 5: return <Step5Skills data={cvData.skills || []} setData={(updater) => setCvData((prev) => ({ ...prev, skills: typeof updater === 'function' ? updater(prev.skills || []) : updater }))} />;
      case 6: return <Step6Summary data={cvData.summary || ''} setData={(d) => setCvData((prev) => ({ ...prev, summary: d }))} />;
      case 7: return <Step7Preview cvData={cvData} setData={(d) => setCvData(prev => ({ ...prev, ...d }))} onEdit={handleEdit} />;
      default: return null;
    }
  };

  const disabledStepIndexes = !isStep1Valid
    ? STEPS.map((_, idx) => (idx > 0 ? idx : null)).filter((idx) => idx !== null)
    : [];

  const isNextDisabled = saving || (step === 0 && !choice) || (step === 1 && !isStep1Valid) || (step === STEPS.length && (!cvData.file_name || !cvData.file_name.trim()));

  // Handle choice selection from Modal
  const handleChoiceSelect = (selectedChoice) => {
    setChoice(selectedChoice);
    const isOnboarding = searchParams.get('onboarding') === 'true';

    // Navigate to create a history entry for Step 1
    navigate(`/CVGenerator?choice=${selectedChoice}&step=1${isOnboarding ? '&onboarding=true' : ''}`);

    setStep(1);
  };

  // If step is 0 (Choice), render the Modal view over Globe bg like UserTypeSelection
  if (step === 0) {
    return (
      <div className="min-h-screen w-full bg-[#f0f9ff] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        {/* Globe Background - Bottom Left */}
        <div className="absolute bottom-[-5vh] left-[-5vh] w-[77vh] h-[77vh] pointer-events-none z-20">
          <img
            src={globeGrid}
            alt="Globe Grid"
            className="w-full h-full object-contain object-bottom-left opacity-90"
            style={{
              filter: 'brightness(0) saturate(100%) invert(56%) sepia(65%) saturate(2469%) hue-rotate(184deg) brightness(96%) contrast(91%)'
            }}
          />
        </div>

        <CVChoiceModal
          isOpen={true}
          onSelect={handleChoiceSelect}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${choice === 'upload' ? 'p-0 pt-4' : 'p-0 md:p-8'} relative bg-gradient-to-b from-[#dbecf3] to-white via-white via-[20%]`} dir="rtl">
      {/* Mobile Background Gradient - Only Top 25% (Optional additional overlay or removed if main bg is enough) */}
      <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#dbecf3] to-transparent md:hidden opacity-100 pointer-events-none" />

      {/* Mobile Header - Pill Shape */}
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

      <div className={`w-full md:max-w-6xl md:mx-auto md:rounded-[2rem] md:p-14 transition-transform origin-top relative z-[1] ${choice === 'upload' ? 'md:bg-white md:shadow-none scale-90' : 'md:bg-white md:shadow-none !bg-transparent !shadow-none !border-none !p-0 !m-0 !max-w-none !w-full !rounded-none'}`}>
        {step !== 0 && choice === 'create' && (
          <CVStepper
            currentStep={step - 1}
            steps={STEPS}
            mobileSteps={STEPS_MOBILE}
            onStepSelect={(index) => handleStepSelect(index)}
            disabledSteps={disabledStepIndexes.map(idx => idx - 1)}
          />
        )}

        {step !== 0 && choice === 'upload' && (
          <StepIndicator
            totalSteps={5}
            currentStep={step === 1 ? 1 : (step === -1 ? 4 : 0)}
          />
        )}



        <div className="my-10 min-h-[400px] flex flex-col justify-center">
          {renderStep()}
        </div>

        <div className={`flex ${step === 0 ? 'justify-center' : 'justify-center gap-4'} items-center mt-auto pb-8`}>
          {(step > 1 || step === -1 || step === 1) && (
            <Button variant="outline" onClick={handleBack} disabled={saving} className="w-[140px] md:w-auto px-0 md:px-8 py-2 md:py-3 rounded-full font-medium md:font-semibold text-base md:text-lg h-auto border-2 bg-white hover:bg-gray-50 flex justify-center items-center">
              <ArrowRight className="hidden md:block w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
              <span className="md:hidden">הקודם</span>
              <span className="hidden md:inline">חזור</span>
            </Button>
          )}
          {step === -1 ? (
            <Button
              variant={uploadSuccess ? "default" : "outline"}
              onClick={uploadSuccess ? () => handleUploadComplete(false) : handleSkip}
              className={`px-8 py-3 rounded-full font-semibold text-lg h-auto border-2 transition-all ${uploadSuccess
                ? 'bg-[#2589D8] hover:bg-[#1e7bc4] text-white shadow-lg hover:shadow-xl border-transparent'
                : (showSkipDisclaimer ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-300' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400')
                }`}
            >
              {uploadSuccess ? "המשך" : (showSkipDisclaimer ? "המשך" : "דילוג על השלב הזה")}
              <ArrowLeft className="hidden md:block w-5 h-5 mr-2" />
            </Button>
          ) : (step < STEPS.length + 1 && (
            <Button
              onClick={handleNext}
              disabled={isNextDisabled}
              className="w-[140px] md:w-auto px-0 md:px-16 py-2 md:py-3 rounded-full font-medium md:font-bold text-base md:text-lg h-auto bg-[#2589D8] hover:bg-[#1e7bc4] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex justify-center items-center"
            >
              {saving ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : (
                step === 0 ? 'הבא' : (
                  step === STEPS.length ? 'שמור והמשך' : (
                    <>
                      <span className="md:hidden">
                        {step === 1 ? 'המשך לניסיון' : (step === 2 ? 'המשך להשכלה' : (step === 3 ? 'המשך להסמכות' : (step === 4 ? 'המשך לכישורים' : (step === 5 ? 'המשך לתמצית' : (step === 6 ? 'המשך לקו"ח' : 'הבא')))))}
                      </span>
                      <span className="hidden md:inline">הבא</span>
                    </>
                  )
                )
              )}
              {!saving && step !== 0 && <ArrowLeft className="hidden md:block w-5 h-5 mr-2" />}
            </Button>
          ))}
        </div>
      </div>
    </div >);

}
