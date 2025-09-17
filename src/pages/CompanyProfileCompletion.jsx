
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react"; // Added Sparkles
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

// Import step components
import CompanyDetailsStep from "@/components/company_profile/CompanyDetailsStep";
import PackageSelectionStep from "@/components/company_profile/PackageSelectionStep";
import PaymentStep from "@/components/company_profile/PaymentStep";
import CompletionStep from "@/components/company_profile/CompletionStep";

const STEPS = ["בואו נתחיל", "בחירת מנוי", "תשלום", "השלמה"];

export default function CompanyProfileCompletion() {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    phone: "",
    cv_reception_email: "",
    company_phone: "",
    company_type: "",
    field_of_activity: "",
    main_address: "",
    company_logo_url: "",
    portfolio_url: "",
    linkedin_url: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    bio: "",
    selected_package: null,
    payment_info: {}
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        // Populate all fields from userData if they exist
        company_name: userData.company_name || "",
        phone: userData.phone || "",
        cv_reception_email: userData.cv_reception_email || "",
        company_phone: userData.company_phone || "",
        company_type: userData.company_type || "",
        field_of_activity: userData.field_of_activity || "",
        main_address: userData.main_address || "",
        company_logo_url: userData.company_logo_url || "",
        portfolio_url: userData.portfolio_url || "",
        linkedin_url: userData.linkedin_url || "",
        facebook_url: userData.facebook_url || "",
        instagram_url: userData.instagram_url || "",
        twitter_url: userData.twitter_url || "",
        bio: userData.bio || ""
      }));
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompletion();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompletion = async () => {
    setProcessing(true);
    try {
      await User.updateMyUserData({
        // Save all form fields
        company_name: formData.company_name,
        phone: formData.phone,
        cv_reception_email: formData.cv_reception_email,
        company_phone: formData.company_phone,
        company_type: formData.company_type,
        field_of_activity: formData.field_of_activity,
        main_address: formData.main_address,
        company_logo_url: formData.company_logo_url,
        portfolio_url: formData.portfolio_url,
        linkedin_url: formData.linkedin_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        twitter_url: formData.twitter_url,
        bio: formData.bio
      });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setProcessing(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return <CompanyDetailsStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <PackageSelectionStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <PaymentStep formData={formData} setFormData={setFormData} />;
      case 4:
        return <CompletionStep />;
      default:
        return <CompanyDetailsStep formData={formData} setFormData={setFormData} />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-[50vh]" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const isLastStep = currentStep === STEPS.length;
  const isPackageStep = currentStep === 2;

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">
          
          {/* Progress Indicator */}
          <div className="flex justify-center items-center mb-8">
            <div className="flex items-center gap-4">
              {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                
                return (
                  <React.Fragment key={stepNumber}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isActive 
                            ? 'bg-blue-600 text-white scale-110' 
                            : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {stepNumber}
                      </div>
                      <span className="text-xs text-gray-600 mt-1 text-center">{step}</span>
                    </div>
                    {stepNumber < STEPS.length && (
                      <div className="w-16 h-1 rounded-full relative">
                        <div className="absolute top-0 left-0 h-full w-full bg-gray-200 rounded-full" />
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep < STEPS.length && (
            <div className={`flex ${currentStep === 1 ? 'justify-end' : 'justify-between'} items-center mt-12`}>
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || processing}
                className={`px-6 py-3 rounded-full font-bold ${currentStep === 1 ? 'hidden' : ''}`}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                חזור
              </Button>
              <Button
                onClick={nextStep}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-full font-bold shadow-lg"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPackageStep ? (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    למאצ' המושלם
                  </>
                ) : isLastStep ? (
                  'סיום'
                ) : (
                  'המשך'
                )}
                {!processing && !isPackageStep && <ArrowLeft className="w-5 h-5 mr-2" />}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
