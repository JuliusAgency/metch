import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Figma design assets
const imgHugeiconsAiMagic = "http://localhost:3845/assets/289919713a3bb46a7fa4929734053736f1a07e8a.svg";
const imgGoogleFrame = "http://localhost:3845/assets/0f1d434e137c102686b8bcfec0eb15d9b43e8a2a.svg";

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useUser();
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...signUpData } = formData;
      await signUp({
        email: signUpData.email,
        password: signUpData.password,
        created_at: new Date().toISOString()
      });

      toast({
        variant: "success",
        title: "הרכישה בוצעה בהצלחה",
        description: "פריט הוכנסה למערכת הרכישות הראשית",
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
    <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4" data-name="הרשמה" data-node-id="418:1048">
      {/* Background Card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl h-full max-h-[90vh]" data-node-id="418:1479" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto" data-node-id="648:3063">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-4" data-name="menu מחפש עבודה" data-node-id="646:2599">
            <div className="flex items-center space-x-2" data-name="logo metch" data-node-id="646:2603">
              <img alt="" className="w-8 h-8" src={imgHugeiconsAiMagic} data-name="hugeicons:ai-magic" data-node-id="646:2605" />
              <p className="font-['Poppins:Regular',_sans-serif] text-2xl text-black font-medium" data-node-id="646:2604">
                Metch
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-8" data-name="Fields" data-node-id="418:1501">

          {/* Title */}
          <div className="text-center" data-name="Title" data-node-id="418:1502">
            <h1 className="font-['Rubik:Bold',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d] mb-2" dir="auto" data-node-id="418:1503">
              ברוכים הבאים למאצ׳ 👋
            </h1>
            <p className="font-['Rubik:Regular',_sans-serif] text-xl text-[#32343d]" dir="auto" data-node-id="418:1504">
              רק כמה פרטים – ואפשר להתחיל
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-name="Fields" data-node-id="418:1505">

            {/* Email Field */}
            <div className="relative" data-name="Field" data-node-id="418:1506">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]" data-name="Line" data-node-id="I418:1506;1122:1826"></div>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2"
                placeholder="כתובת מייל"
                dir="rtl"
              />
            </div>

            {/* Password Field */}
            <div className="relative" data-name="Field" data-node-id="418:1507">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]" data-name="Line" data-node-id="418:1511"></div>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  // Open eye (password visible)
                  <svg className="w-5 h-5 text-[#6a6a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  // Closed eye (password hidden)
                  <svg className="w-5 h-5 text-[#6a6a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10"
                placeholder="צור סיסמה"
                dir="rtl"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="relative" data-name="Field" data-node-id="418:1512">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]" data-name="Line" data-node-id="418:1516"></div>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  // Open eye (password visible)
                  <svg className="w-5 h-5 text-[#6a6a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  // Closed eye (password hidden)
                  <svg className="w-5 h-5 text-[#6a6a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </div>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10"
                placeholder="אימות סיסמה"
                dir="rtl"
              />
            </div>
          </form>

          {/* Register Button */}
          <div className="pt-4" data-name="Inform" data-node-id="418:1480">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#2987cd] hover:bg-[#2987cd]/90 text-white rounded-full h-12 text-lg font-bold"
              data-name="Button"
              data-node-id="418:1481"
            >
              <div className="flex items-center space-x-3" data-name="Inside" data-node-id="418:1482">
                <span className="font-['Rubik:Bold',_sans-serif] font-bold text-lg" dir="auto" data-node-id="418:1485">
                  הרשמה
                </span>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>
          </div>

          {/* Separator and Google Button */}
          <div className="space-y-4" data-node-id="418:1486">
            <div className="flex items-center justify-center" data-name="line" data-node-id="418:1487">
              <div className="flex-1 h-px bg-[#6a6a6a]"></div>
              <span className="px-4 text-[#6a6a6a] text-sm" dir="auto" data-node-id="418:1489">
                או הרשמו באמצעות
              </span>
              <div className="flex-1 h-px bg-[#6a6a6a]"></div>
            </div>
            <Button
              type="button"
              disabled={loading}
              variant="outline"
              className="w-full bg-white border-[#e3e3ea] hover:bg-gray-50 rounded-full h-12 text-lg"
              data-name="Button"
              data-node-id="418:1492"
            >
              <div className="flex items-center space-x-3">
                <img alt="" className="w-5 h-5" src={imgGoogleFrame} data-name="Frame" data-node-id="418:1493" />
                <span className="font-['Inter:Regular',_sans-serif] text-lg text-[#32343d]" data-node-id="418:1499">
                  Google
                </span>
              </div>
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center" data-node-id="418:1500">
            <p className="text-[#32343d] text-base" dir="auto">
              <span className="font-['Rubik:Regular',_sans-serif]">כבר רשומים? </span>
              <Link to="/Login" className="font-['Rubik:Bold',_sans-serif] font-bold text-[#2987cd] hover:underline">
                התחברו כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;