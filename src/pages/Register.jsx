import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';


// Figma design assets
const imgGoogleFrame = "http://localhost:3845/assets/0f1d434e137c102686b8bcfec0eb15d9b43e8a2a.svg";

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, checkUserExists } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "שגיאה באימות סיסמה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "סיסמה חלשה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return false;
    }

    if (!termsAccepted) {
      toast({
        title: "חובה לאשר תנאי שימוש",
        description: "אנא אשרו את תנאי השימוש ומדיניות הפרטיות להמשך",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user already exists
      const exists = await checkUserExists(formData.email);

      if (exists) {
        toast({
          variant: "warning",
          title: "משתמש כבר קיים",
          description: "כתובת המייל כבר רשומה במערכת. אנא התחברו במקום. במקרה ששכחת סיסמה לחץ על 'שכחתי סיסמה'",
          duration: 5000,
          action: (
            <Link to="/Login" className="text-white underline font-bold">
              התחברות
            </Link>
          ),
        });

        // Redirect to Login after a short delay
        setTimeout(() => {
          navigate('/Login');
        }, 3000);

        return; // Stop execution
      }

      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...signUpData } = formData;
      await signUp({
        email: signUpData.email,
        password: signUpData.password,
        marketing_consent: marketingConsent,
        terms_accepted: true,
        created_at: new Date().toISOString()
      });

      // Clear any local storage drafts for this email to ensure a fresh start
      try {
        localStorage.removeItem(`cv_draft_${signUpData.email}`);
        localStorage.removeItem(`jobseeker_guide_${signUpData.email}`);
      } catch (e) {
        console.error("Failed to clear local storage:", e);
      }

      toast({
        variant: "success",
        title: "נרשמת בהצלחה!",
        description: "כמעט סיימנו, שלחנו לך קישור אימות למייל.",
      });

      navigate('/EmailConfirmation', { state: { email: signUpData.email } });
    } catch (error) {
      // Check if user already exists - Supabase returns specific error messages
      if (error.message && (
        error.message.includes('already registered') ||
        error.message.includes('User already registered') ||
        error.message.includes('email address is already registered') ||
        error.message.includes('duplicate key value')
      )) {
        toast({
          variant: "warning",
          title: "משתמש כבר קיים",
          description: "כתובת המייל כבר רשומה במערכת. אנא התחברו במקום",
          action: (
            <Link to="/Login" className="text-white underline">
              התחברות
            </Link>
          ),
        });
      } else {
        toast({
          variant: "warning",
          title: "שגיאה בהרשמה",
          description: error.message || "אירעה שגיאה בעת ההרשמה",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#dbedf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4">

      {/* Main Card Component - Merged Background and Content */}
      <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-[750px] p-12">

        <div className="w-full max-w-md mx-auto">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-5 px-10">
              <div className="flex items-center gap-1">
                <p className="font-['Poppins',_sans-serif] text-2xl text-black font-normal">
                  Metch
                </p>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 15 15"
                  fill="none"
                  className="w-5 h-5 mr-1 text-black"
                >
                  <path
                    d="M7.375 0.5L6.86821 1.86911C6.20429 3.66446 5.87232 4.56214 5.21723 5.21723C4.56214 5.87232 3.66446 6.20429 1.86911 6.86821L0.5 7.375L1.86911 7.88179C3.66446 8.54571 4.56214 8.87866 5.21723 9.53277C5.87232 10.1869 6.20429 11.0855 6.86821 12.8809L7.375 14.25L7.88179 12.8809C8.54571 11.0855 8.87866 10.1879 9.53277 9.53277C10.1869 8.87768 11.0855 8.54571 12.8809 7.88179L14.25 7.375L12.8809 6.86821C11.0855 6.20429 10.1879 5.87232 9.53277 5.21723C8.87768 4.56214 8.54571 3.66446 7.88179 1.86911L7.375 0.5Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-8">

            {/* Title */}
            <div className="text-center">
              <h1 className="font-['Rubik',_sans-serif] font-bold text-2xl md:text-3xl text-[#32343d] mb-2" dir="auto">
                ברוכים הבאים למאצ׳ 👋
              </h1>
              <p className="font-['Rubik',_sans-serif] font-normal text-xl text-[#32343d]" dir="auto">
                רק כמה פרטים – ומתחילים
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email Field */}
              <div className="relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]"></div>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 focus-visible:ring-0 shadow-none px-0"
                  placeholder="כתובת מייל"
                  dir="rtl"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]"></div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 p-2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <Eye className="w-5 h-5 text-[#6a6a6a]" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-[#6a6a6a]" />
                  )}
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10 focus-visible:ring-0 shadow-none px-0"
                  placeholder="יצירת סיסמה"
                  dir="rtl"
                />
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]"></div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 p-2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <Eye className="w-5 h-5 text-[#6a6a6a]" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-[#6a6a6a]" />
                  )}
                </div>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10 focus-visible:ring-0 shadow-none px-0"
                  placeholder="אימות סיסמה"
                  dir="rtl"
                />
              </div>

              {/* Terms and Marketing Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2 space-x-reverse" dir="rtl">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                    className="mt-1 border-[#6a6a6a] data-[state=checked]:bg-[#2987cd] data-[state=checked]:border-[#2987cd]"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-['Rubik',_sans-serif] font-normal leading-normal text-[#32343d] mr-2 cursor-pointer"
                  >
                    קראתי ואני מסכים/ה <a href="https://metch.co.il/%d7%aa%d7%a0%d7%90%d7%99-%d7%a9%d7%99%d7%9e%d7%95%d7%a9/" target="_blank" rel="noopener noreferrer" className="underline text-[#2987cd] font-bold">לתנאי השימוש</a> ו<a href="https://metch.co.il/מדיניות-הפרטיות/" target="_blank" rel="noopener noreferrer" className="underline text-[#2987cd] font-bold">למדיניות הפרטיות</a> של Metch
                  </label>
                </div>

                <div className="flex items-start space-x-2 space-x-reverse" dir="rtl">
                  <Checkbox
                    id="marketing"
                    checked={marketingConsent}
                    onCheckedChange={setMarketingConsent}
                    className="mt-1 border-[#6a6a6a] data-[state=checked]:bg-[#2987cd] data-[state=checked]:border-[#2987cd]"
                  />
                  <div className="mr-2 space-y-1">
                    <label
                      htmlFor="marketing"
                      className="text-sm font-['Rubik',_sans-serif] font-normal leading-normal text-[#32343d] cursor-pointer"
                    >
                      אני מעוניין/ת לקבל עדכונים, חדשות וטיפים בתחום התעסוקה, הצעות מיוחדות ודיוור שיווקי מ-Metch באמצעות דואר אלקטרוני ו/או הודעות SMS וWhatsapp
                    </label>
                    <p className="text-xs font-['Rubik',_sans-serif] text-[#6a6a6a]">
                      ניתן לבטל את ההסכמה בכל עת דרך עמוד ההגדרות או בלחיצה על "הסר מרשימת תפוצה" בכל דיוור.
                    </p>
                  </div>
                </div>
              </div>

              {/* Register Button */}
              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-1/2 mx-auto bg-[#2987cd] hover:bg-[#2987cd]/90 text-white rounded-full h-12 text-lg font-bold"
                >
                  <div className="flex items-center justify-center space-x-3 w-full">
                    <span className="font-['Rubik:Bold',_sans-serif] font-bold text-lg ml-2 mr-3" dir="auto">
                      הרשמו
                    </span>
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </div>
                </Button>
              </div>

            </form>

            {/* Separator and Google Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-px bg-gray-300"></div>
                <span className="px-4 text-[#6a6a6a] text-sm whitespace-nowrap" dir="auto">
                  או הרשמה באמצעות
                </span>
                <div className="w-16 h-px bg-gray-300"></div>
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await signInWithGoogle();
                    } catch (error) {
                      toast({
                        title: "שגיאה בהרשמה עם Google",
                        description: error.message,
                        variant: "destructive",
                      });
                      setLoading(false);
                    }
                  }}
                  variant="outline"
                  className="w-1/2 mx-auto bg-white border-[#e3e3ea] hover:bg-gray-50 rounded-full h-12 text-lg"
                >
                  <div className="flex items-center justify-center space-x-3 w-full" dir="ltr">
                    <img alt="" className="w-5 h-5" src="https://www.svgrepo.com/show/475656/google-color.svg" />
                    <span className="font-['Inter:Regular',_sans-serif] text-lg text-[#32343d]">
                      Google
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-[#32343d] text-base" dir="auto">
                <span className="font-['Rubik',_sans-serif] font-normal">כבר רשומים? </span>
                <Link to="/Login" className="font-['Rubik',_sans-serif] font-bold text-[#2987cd] hover:underline">
                  התחברו
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Register;