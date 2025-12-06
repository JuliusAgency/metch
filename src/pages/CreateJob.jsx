import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Job } from '@/api/entities';
import { User } from '@/api/entities'; // Added User import
import Stepper from '@/components/job_creation/Stepper';
import Step1Details from '@/components/job_creation/Step1Details';
import Step2Screening from '@/components/job_creation/Step2Screening';
import Step3Company from '@/components/job_creation/Step3Company';
import Step4Packages from '@/components/job_creation/Step4Packages';
import Step5Preview from '@/components/job_creation/Step5Preview';
import Success from '@/components/job_creation/Success';
import { EmployerAnalytics } from "@/components/EmployerAnalytics"; // Added EmployerAnalytics import
import { useRequireUserType } from "@/hooks/use-require-user-type";

const STEPS = ["פרטי המשרה", "פרטי החברה", "שאלון סינון", "חבילות", "תצוגה מקדימה"];

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
  const [step, setStep] = useState(1);
  const [jobData, setJobData] = useState(initialJobData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const loadJobForEditing = async () => {
      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');
      if (jobId) {
        setIsEditing(true);
        try {
          const results = await Job.filter({ id: jobId });
          if (results.length > 0) {
            setJobData(results[0]);
          } else {
            console.error("Job not found for editing");
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
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get user data first to ensure created_by fields are set
      const userData = await User.me();

      // Prepare job data with created_by fields
      const jobDataToSave = {
        ...jobData,
        created_by: userData.email,
        created_by_id: userData.id
      };

      let createdOrUpdatedJob;

      if (isEditing) {
        // For updates, preserve created_by if it already exists, otherwise set it
        const updatedJobData = {
          ...jobDataToSave,
          // Preserve original created_by if editing someone else's job (shouldn't happen, but safety check)
          created_by: jobData.created_by || userData.email,
          created_by_id: jobData.created_by_id || userData.id
        };
        createdOrUpdatedJob = await Job.update(jobData.id, updatedJobData);

        // Track job edit
        await EmployerAnalytics.trackJobEdit(userData.email, createdOrUpdatedJob);
      } else {
        // For new jobs, always set created_by fields
        createdOrUpdatedJob = await Job.create(jobDataToSave);

        // Track job creation
        await EmployerAnalytics.trackJobCreate(userData.email, createdOrUpdatedJob);

        // If job is being published (not draft), track publish action too
        if (jobDataToSave.status === 'active') { // Assuming 'active' means published
          await EmployerAnalytics.trackJobPublish(userData.email, createdOrUpdatedJob);
        }
      }

      setLastCreatedJob(createdOrUpdatedJob);
      setIsSubmitted(true);
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} job:`, error);
      // Here you might want to show an error to the user
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

  const handleDuplicate = () => {
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
      return <Success onReset={handleReset} onDuplicate={handleDuplicate} />;
    }

    switch (step) {
      case 1: return <Step1Details jobData={jobData} setJobData={setJobData} />;
      case 2: return <Step3Company jobData={jobData} setJobData={setJobData} />;
      case 3: return <Step2Screening jobData={jobData} setJobData={setJobData} />;
      case 4: return <Step4Packages />;
      case 5: return <Step5Preview jobData={jobData} setJobData={setJobData} />;
      default: return <Step1Details jobData={jobData} setJobData={setJobData} />;
    }
  };

  const isFinalStep = step === STEPS.length;

  if (loadingJob) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-[50vh]" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const isStepValid = () => {
    if (step === 1) {
      return (
        jobData.title &&
        jobData.category &&
        jobData.start_date &&
        jobData.employment_type
      );
    }
    return true;
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">

          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'עריכת משרה' : 'יצירת משרה חדשה'}</h1>
          </div>

          {!isSubmitted && <Stepper currentStep={step} steps={STEPS} />}

          <AnimatePresence mode="wait">
            <motion.div
              key={isSubmitted ? 'success' : step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="my-8"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {!isSubmitted && (
            <div className="flex justify-between items-center mt-12">
              <Button
                variant="outline"
                className="px-6 py-3 rounded-full font-bold text-lg"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
              >
                חזור
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-full font-bold text-lg shadow-lg"
                onClick={nextStep}
                disabled={isSubmitting || !isStepValid()}
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isFinalStep ? (isEditing ? 'עדכן משרה' : 'סיום ופרסום') : 'המשך')}
                {!isSubmitting && <ArrowLeft className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
