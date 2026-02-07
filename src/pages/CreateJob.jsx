import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Job } from '@/api/entities';
import { User } from '@/api/entities'; // Added User import
import Stepper from '@/components/job_creation/Stepper';
import Step1Details from '@/components/job_creation/Step1Details';
import Step2Screening from '@/components/job_creation/Step2Screening';
import Step3Company from '@/components/job_creation/Step3Company';
import Step4Packages from '@/components/job_creation/Step4Packages';
// Removed Step4Packages import
import Step5Preview from '@/components/job_creation/Step5Preview';
import Success from '@/components/job_creation/Success';
import { EmployerAnalytics } from "@/components/EmployerAnalytics"; // Added EmployerAnalytics import
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import NoCreditsDialog from "@/components/dialogs/NoCreditsDialog";


const STEPS = ["פרטי המשרה", "פרטי החברה", "שאלון סינון", "תצוגה מקדימה"]; // Removed "חבילות"

const initialJobData = {
  title: "",
  company: "Your Company",
  description: "",
  location: "",
  category: "",
  status: "draft",
  employment_type: "",
  start_date: "",
  structured_requirements: [{ value: "", type: "required" }],
  structured_education: [{ value: "", type: "required" }],
  structured_certifications: [{ value: "", type: "required" }],
  screening_questions: [],
  company_perks: [],
  success_factors: [],
  attachments: []
};

export default function CreateJob() {
  useRequireUserType(); // Ensure user has selected a user type
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [jobData, setJobData] = useState(initialJobData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);
  const { user, updateProfile } = useUser();
  const { toast } = useToast();
  const [isScreeningSaved, setIsScreeningSaved] = useState(false);

  const handleSkipOnboarding = async () => {
    if (user && !user.is_onboarding_completed) {
      try {
        await updateProfile({ is_onboarding_completed: true });
      } catch (error) {
        console.error("Failed to mark onboarding as completed:", error);
      }
    }
    navigate(createPageUrl("Dashboard"), { replace: true });
  };

  useEffect(() => {
    setIsScreeningSaved(false);
  }, [jobData.screening_questions]);

  useEffect(() => {
    const loadJobForEditing = async () => {
      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');

      const safeParseJSON = (data, defaultValue) => {
        if (!data) return defaultValue;
        if (typeof data !== 'string') return data;
        try {
          let parsed = data;
          // Handle Postgres hex format (starts with \x)
          if (parsed.startsWith('\\x')) {
            const hex = parsed.slice(2);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            parsed = str;
          }
          return JSON.parse(parsed);
        } catch (e) {
          console.warn('Failed to parse JSON field:', e);
          return defaultValue;
        }
      };

      if (jobId) {
        try {
          const results = await Job.filter({ id: jobId });
          if (results.length > 0) {
            console.log("Job loaded for editing:", results[0]);
            setIsEditing(true);

            const jobDataFromDB = results[0];

            // Merge with initialJobData to ensure all fields exist (like arrays)
            setJobData({
              ...initialJobData,
              ...jobDataFromDB,
              // Ensure structured fields are arrays if they come back as strings or null
              structured_requirements: safeParseJSON(jobDataFromDB.structured_requirements, initialJobData.structured_requirements),
              structured_education: safeParseJSON(jobDataFromDB.structured_education, initialJobData.structured_education),
              structured_certifications: safeParseJSON(jobDataFromDB.structured_certifications, initialJobData.structured_certifications),
              screening_questions: safeParseJSON(jobDataFromDB.screening_questions, initialJobData.screening_questions),
              company_perks: safeParseJSON(jobDataFromDB.company_perks, initialJobData.company_perks),
              success_factors: safeParseJSON(jobDataFromDB.success_factors, initialJobData.success_factors),
            });
            // If editing and has questions, assume saved
            const questions = safeParseJSON(jobDataFromDB.screening_questions, []);
            if (questions && questions.length > 0) {
              setIsScreeningSaved(true);
            }
          } else {
            console.error("Job not found for editing with ID:", jobId);
            // Optional: Redirect or show error message
          }
        } catch (error) {
          console.error("Error loading job for editing:", error);
        }
      }
      setLoadingJob(false);
    };
    loadJobForEditing();
  }, [location.search]);

  const nextStep = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userData = await User.me();
      // Use fresh data from server for reliability
      // Check both locations as structure might vary
      const credits = userData.job_credits || userData?.profile?.job_credits || 0;

      let targetStatus = 'active';
      let showPaymentPrompt = false;

      // force 'draft' if no credits, UNLESS we are resuming a paused job (which is already paid for)
      console.log('DEBUG: Job Submission - Credits:', credits, 'Status:', jobData.status);

      if (credits <= 0 && jobData.status !== 'paused') {
        targetStatus = 'draft';
        showPaymentPrompt = true;
        console.log('DEBUG: No credits, forcing draft');
      }

      const now = new Date().toISOString();

      // Prepare job data
      const jobDataToSave = {
        ...jobData,
        created_by: userData.email,
        created_by_id: userData.id,
        status: targetStatus,
        updated_date: now
      };

      let createdOrUpdatedJob;

      if (isEditing) {
        // UPDATE
        const updatedJobData = {
          ...jobDataToSave,
          created_by: jobData.created_by || userData.email,
          created_by_id: jobData.created_by_id || userData.id,
        };
        createdOrUpdatedJob = await Job.update(jobData.id, updatedJobData);
        await EmployerAnalytics.trackJobEdit(userData.email, createdOrUpdatedJob);

        // Deduct credit for any active job update (per user request), 
        // UNLESS we are resuming from "paused" (per Rule 4)
        if (targetStatus === 'active' && jobData.status !== 'paused') {
          await updateProfile({ job_credits: credits - 1 });
        }

      } else {
        // CREATE
        const newJobData = {
          ...jobDataToSave,
          created_date: now,
          updated_date: now
        };
        createdOrUpdatedJob = await Job.create(newJobData);
        await EmployerAnalytics.trackJobCreate(userData.email, createdOrUpdatedJob);

        // Deduct credit if active
        if (targetStatus === 'active') {
          await updateProfile({ job_credits: credits - 1 });
        }
      }

      // Track publish only if active
      if (targetStatus === 'active') {
        await EmployerAnalytics.trackJobPublish(userData.email, createdOrUpdatedJob);
      }

      setLastCreatedJob(createdOrUpdatedJob);
      setIsSubmitted(true);

      if (showPaymentPrompt) {
        setShowNoCreditsModal(true);
      }

    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} job:`, error);
      toast({
        title: "שגיאה בשמירת המשרה",
        description: "אנא נסה שנית מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJobData(initialJobData);
    setStep(1);
    setIsSubmitted(false);
    setLastCreatedJob(null);
  };

  const handleDuplicate = async () => {
    const credits = user?.profile?.job_credits || 0;
    if (credits <= 0) {
      toast({
        title: "אין יתרת משרות ליצירת עותק",
        description: "נגמרה חבילת המשרות שלך. ניתן לרכוש משרות נוספות בעמוד התשלומים.",
        variant: "destructive",
        action: <Button variant="outline" className="text-black border-white hover:bg-white/90" onClick={() => navigate('/payments')}>לרכישה</Button>
      });
      return;
    }

    const duplicatedData = { ...lastCreatedJob, title: `${lastCreatedJob.title} (עותק)` };
    delete duplicatedData.id;
    delete duplicatedData.created_date;
    delete duplicatedData.updated_date;

    setJobData(duplicatedData);
    setStep(1);
    setIsSubmitted(false);
    setLastCreatedJob(null);
  };

  const renderStep = () => {
    if (isSubmitted) {
      const hasCredits = (user?.job_credits > 0 || user?.profile?.job_credits > 0);
      return <Success onReset={handleReset} onDuplicate={handleDuplicate} hasCredits={hasCredits} />;
    }

    switch (step) {
      case 1: return <Step1Details jobData={jobData} setJobData={setJobData} />;
      case 2: return <Step3Company jobData={jobData} setJobData={setJobData} />;
      case 3: return <Step2Screening jobData={jobData} setJobData={setJobData} onSave={() => setIsScreeningSaved(true)} onNext={nextStep} />;
      case 4: return (
        <Step5Preview
          jobData={jobData}
          setJobData={setJobData}
          onNext={nextStep}
          onPrev={prevStep}
          isSubmitting={isSubmitting}
          isNextDisabled={isNextDisabled()}
          nextLabel={getNextButtonText()}
        />
      );
      default: return <Step1Details jobData={jobData} setJobData={setJobData} />;
    }
  };

  const isFinalStep = step === STEPS.length;

  if (loadingJob) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-[50vh]" dir="rtl">
        <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isStepValid = () => {
    if (step === 1) {
      // Step 1: Basic details
      // Note: structured_requirements are optional
      const isValid = (
        jobData.title &&
        jobData.category &&
        jobData.start_date &&
        jobData.employment_type &&
        jobData.description
      );
      return !!isValid;
    }
    if (step === 2) {
      // Step 2: Step3Company, requires exactly 3 success factors
      return jobData.success_factors && jobData.success_factors.length === 3;
    }
    return true;
  };

  const getNextButtonText = () => {
    if (isSubmitting) return <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div>;
    if (step === 3) {
      if (!jobData.screening_questions || jobData.screening_questions.length === 0) return 'דילוג';
      // If has questions
      return 'המשך';
    }
    if (isFinalStep) return isEditing ? 'עדכון משרה' : 'סיום וצפייה במשרה';
    return 'המשך';
  };

  const isNextDisabled = () => {
    if (isSubmitting) return true;
    if (!isStepValid()) return true;
    if (step === 3 && jobData.screening_questions?.length > 0 && !isScreeningSaved) return true;
    return false;
  };

  return (
    <div className="h-full px-6 py-6 md:p-8 overflow-x-hidden" dir="rtl">
      <div className={`mx-auto ${step === 4 && !isSubmitted ? 'w-full' : 'max-w-7xl'}`}>
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'עריכת משרה' : 'יצירת משרה חדשה'}</h1>
        </div>

        {!isSubmitted && <Stepper currentStep={step} steps={STEPS} />}

        <AnimatePresence mode="wait">
          <motion.div
            key={isSubmitted ? 'success' : step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="mt-1 mb-4"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {!isSubmitted && step !== 4 && (
          <div className="flex flex-col-reverse md:flex-row justify-center items-center gap-4 mt-8 pb-8 w-full">
            {!isEditing && step === 1 ? (
              <Button
                variant="outline"
                className="w-full md:w-auto px-6 md:px-8 py-3 rounded-full font-bold text-base md:text-lg border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                onClick={handleSkipOnboarding}
              >
                לפרסם מאוחר יותר
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full md:w-auto px-6 md:px-8 py-3 rounded-full font-bold text-base md:text-lg border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                חזור
              </Button>
            )}

            <Button
              className={`w-full md:w-auto text-white px-8 md:px-12 py-3 rounded-full font-bold text-base md:text-lg shadow-lg ${isFinalStep ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={nextStep}
              disabled={isNextDisabled()}
            >
              {getNextButtonText()}
              {!isSubmitting && <ArrowLeft className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        )}
      </div>
      <NoCreditsDialog
        open={showNoCreditsModal}
        onOpenChange={setShowNoCreditsModal}
        isActivation={false}
      />
    </div >
  );
}
