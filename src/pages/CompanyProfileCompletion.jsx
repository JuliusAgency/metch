
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import CompanyDetailsStep from "@/components/company_profile/CompanyDetailsStep";
import PackageSelectionStep from "@/components/company_profile/PackageSelectionStep";
import PaymentStep from "@/components/company_profile/PaymentStep";
import CompletionStep from "@/components/company_profile/CompletionStep";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useUser } from "@/contexts/UserContext";

const STEPS = ["פרטי חברה", "בחירת חבילה", "תשלום", "סיום"];

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
    phone: ""
  });
  const [packageData, setPackageData] = useState({
    type: 'per_job',
    quantity: 1,
    price: 499
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
    idNumber: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    // Check if returning from Settings with success
    const params = new URLSearchParams(location.search);
    if (params.get('status') === 'success') {
      setStep(4);
    }
  }, [location]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCompanyData(prev => ({
          ...prev,
          company_name: user.company_name || "",
          company_type: user.company_type || "business",
          field_of_activity: user.field_of_activity || "",
          main_address: user.main_address || "",
          cv_reception_email: user.cv_reception_email || user.email,
          company_phone: user.company_phone || "",
          full_name: user.full_name || "",
          phone: user.phone || ""
        }));
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(companyData);
      return true;
    } catch (error) {
      console.error("Failed to save company data", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const saved = await handleSave();
      if (!saved) return;
    }

    // Step 3 is Payment. After Payment, go to Settings (Onboarding mode)
    if (step === 3) {
      navigate(`${createPageUrl('Settings')}?onboarding=company_details`);
      return;
    }

    if (step < STEPS.length) {
      setStep(prev => prev + 1);
    } else {
      // Final step action (fallback if not redirected)
      navigate(`${createPageUrl('Dashboard')}?onboarding=complete`);
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
        return <CompletionStep hideSecondaryButton={true} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">
          <div className="max-w-4xl mx-auto">


            <div className="my-10 min-h-[300px]">
              {renderStepContent()}
            </div>

            <div className={`flex ${step === 1 ? 'justify-center' : 'justify-between'} items-center mt-12`}>
              {step > 1 && (
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
              <Button
                className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg disabled:opacity-50 transition-transform duration-300 ${step === 1 ? 'px-14 py-4 text-xl transform hover:scale-105' : 'px-12 py-3 text-lg'}`}
                onClick={nextStep}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (step === STEPS.length ? 'מעבר לדאשבורד' : 'המשך')}
                {!saving && <ArrowLeft className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
