
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import CompanyDetailsStep from "@/components/company_profile/CompanyDetailsStep";
import PackageSelectionStep from "@/components/company_profile/PackageSelectionStep";
import PaymentStep from "@/components/company_profile/PaymentStep";
import CompanyProfileFinalStep from "@/components/company_profile/CompanyProfileFinalStep";
import CompletionStep from "@/components/company_profile/CompletionStep";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useUser } from "@/contexts/UserContext";
import { MetchApi } from "@/api/metchApi";
import { toast } from "sonner";

const STEPS = ["פרטי חברה", "בחירת חבילה", "תשלום", "השלמת פרופיל", "סיום"];

export default function CompanyProfileCompletion() {
  useRequireUserType(); // Ensure user has selected a user type
  const { updateProfile } = useUser();
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    company_name: "",
    company_type: "business",
    field_of_activity: "",
    main_address: "",
    cv_reception_email: "",
    company_phone: "",
    full_name: "",
    phone: "",
    is_phone_verified: false,
    bio: "",
    social_links: {}
  });

  const [packageData, setPackageData] = useState({
    type: 'per_job',
    quantity: 1,
    price: 600
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
    idNumber: "",
    vatNumber: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        if (user.is_onboarding_completed) {
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }
        setCompanyData(prev => ({
          ...prev,
          company_name: user.company_name || "",
          company_type: user.company_type || "business",
          field_of_activity: user.field_of_activity || "",
          main_address: user.main_address || "",
          cv_reception_email: user.cv_reception_email || user.email,
          company_phone: user.company_phone || "",
          full_name: user.full_name || "",
          phone: user.phone || "",
          is_phone_verified: user.is_phone_verified || false,
          bio: user.bio || "",
          social_links: {
            website: user.portfolio_url || "",
            facebook: user.facebook_url || "",
            instagram: user.instagram_url || "",
            linkedin: user.linkedin_url || "",
            twitter: user.twitter_url || "",
            tiktok: ""
          }
        }));
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Prevent browser back navigation
  useEffect(() => {
    // Push a new state to history to create a "buffer" that traps the back button
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = (event) => {
      // Prevent leaving the page
      window.history.pushState(null, "", window.location.pathname);

      setStep((currentStep) => {
        // Only allow going back from Step 2 to Step 1 (matching UI behavior)
        if (currentStep === 2) {
          return 1;
        }

        // For all other steps (1, 3, 4, 5), block back navigation
        // Step 1: Start
        // Step 3: Payment (No back allowed)
        // Step 4: Profile Completion (Don't go back to payment)
        // Step 5: Finish
        toast.error("לא ניתן לחזור אחורה בשלב זה");
        return currentStep;
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove office_phone and social_links (handle separately)
      // eslint-disable-next-line no-unused-vars
      const { office_phone, social_links, ...dataToSave } = companyData;

      // Map social_links back to DB columns
      if (social_links) {
        dataToSave.portfolio_url = social_links.website || null;
        dataToSave.facebook_url = social_links.facebook || null;
        dataToSave.instagram_url = social_links.instagram || null;
        dataToSave.linkedin_url = social_links.linkedin || null;
        dataToSave.twitter_url = social_links.twitter || null;
      }

      await updateProfile(dataToSave);
      return true;
    } catch (error) {
      console.error("Failed to save company data", error);
      toast.error("שגיאה בשמירת הנתונים: " + (error.message || "נא לנסות שנית"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {


      if (!companyData.company_name || !companyData.company_name.trim()) {
        toast.error("אנא מלא את שם החברה");
        return;
      }

      if (!companyData.is_phone_verified) {
        toast.error("חובה לאמת את מספר הטלפון בווצאפ כדי להמשיך");
        return;
      }

      const saved = await handleSave();
      if (!saved) return;
    }

    // Payment Step (Step 3) - from HEAD
    if (step === 3) {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
        toast.error("נא למלא את כל פרטי התשלום");
        return;
      }

      setSaving(true);
      try {
        await MetchApi.createTransaction({
          Amount: packageData.price,
          CardNumber: paymentData.cardNumber,
          CardExpirationMMYY: paymentData.expiryDate.replace('/', ''), // Assuming format MM/YY -> MMYY
          CVV2: paymentData.cvv,
          CardOwnerName: paymentData.holderName,
          CardOwnerIdentityNumber: paymentData.idNumber,
          NumberOfPayments: 1
        });
        toast.success("התשלום בוצע בהצלחה!");
      } catch (error) {
        console.error("Payment failed:", error);
        toast.error("התשלום נכשל: " + error.message);
        setSaving(false);
        return; // Stop if payment fails
      } finally {
        setSaving(false);
      }
    }

    // Step 4 is the new Final Profile Step - save before moving to Completion
    if (step === 4) {
      const saved = await handleSave();
      if (!saved) return;
    }

    if (step < STEPS.length) {
      setStep(prev => prev + 1);
    } else {
      // Final step action
      await updateProfile({ is_onboarding_completed: true });
      navigate(`${createPageUrl('Dashboard')}?onboarding=complete`, { replace: true });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <CompanyDetailsStep companyData={companyData} setCompanyData={setCompanyData} />;
      case 2:
        return <PackageSelectionStep packageData={packageData} setPackageData={setPackageData} onBack={prevStep} />;
      case 3:
        return <PaymentStep paymentData={paymentData} setPaymentData={setPaymentData} />;
      case 4:
        return <CompanyProfileFinalStep companyData={companyData} setCompanyData={setCompanyData} onFinish={nextStep} />;
      case 5:
        return <CompletionStep hideSecondaryButton={true} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8" dir="rtl">
      <div>
        <div className="max-w-4xl mx-auto">


          <div className={`my-6 ${step === 4 ? 'min-h-0' : 'min-h-[300px]'}`}>
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {step !== 4 && (
            <div className={`flex ${step === 1 || step === 3 ? 'justify-center' : 'justify-between'} items-center mt-12`}>
              {step > 1 && step !== 3 && (
                <Button
                  variant="outline"
                  className="px-6 py-3 rounded-full font-bold text-lg disabled:opacity-50"
                  onClick={prevStep}
                  disabled={saving}
                >
                  חזור
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              )}
              {(() => {
                const isStep1Valid = step === 1 && (
                  companyData.company_name?.trim() &&
                  companyData.full_name?.trim() &&
                  companyData.cv_reception_email?.trim() &&
                  companyData.company_phone?.trim() &&
                  companyData.is_phone_verified
                );

                const isCustomPackage = packageData.quantity >= 10;

                if (step === 2 && isCustomPackage) {
                  return null;
                }

                return (
                  <Button
                    className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg disabled:opacity-50 transition-transform duration-300 ${step === 1 || step === 3 ? 'px-14 py-4 text-xl transform hover:scale-105' : 'px-12 py-3 text-lg'}`}
                    onClick={nextStep}
                    disabled={saving || (step === 1 && !isStep1Valid)}
                  >
                    {saving ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : (step === 3 ? 'לתשלום' : step === STEPS.length ? 'מעבר לדאשבורד' : 'המשך')}
                    {!saving && <ArrowLeft className="w-5 h-5 ml-2" />}
                  </Button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
