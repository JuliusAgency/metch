import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Figma design assets
const imgHugeiconsAiMagic = "https://www.svgrepo.com/show/530438/magic-wand.svg"; // Also fixing the other broken asset potentially
const imgGoogleFrame = "https://www.svgrepo.com/show/475656/google-color.svg";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {

    if (!authLoading && user) {
      // Check if user has a complete profile
      const userProfile = user.profile || user.user_metadata;


      // If profile is null or doesn't have user_type, redirect to EmailConfirmed
      if (!userProfile || !userProfile.user_type) {

        navigate('/EmailConfirmed');
      } else {

        navigate('/Dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn({ email, password });

      // Check if user has a profile
      const userProfile = result.user?.profile || result.user?.user_metadata;

      if (!userProfile || !userProfile.user_type) {
        // User doesn't have a complete profile, redirect to EmailConfirmed for profile setup
        navigate('/EmailConfirmed');
      } else {
        // User has a complete profile, go to dashboard
        navigate('/Dashboard');
      }
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "אירעה שגיאה בעת ההתחברות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4" data-name="התחברות" data-node-id="418:1526">
      {/* Background Card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl h-full max-h-[90vh]" data-node-id="678:3118" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto" data-node-id="678:3119">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-4" data-name="menu מחפש עבודה" data-node-id="678:3120">
            <div className="flex items-center space-x-2" data-name="logo metch" data-node-id="678:3124">
              <img alt="" className="w-8 h-8" src={imgHugeiconsAiMagic} data-name="hugeicons:ai-magic" data-node-id="678:3126" />
              <p className="font-['Poppins:Regular',_sans-serif] text-2xl text-black font-medium" data-node-id="678:3125">
                Metch
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8" data-node-id="597:1949">

          {/* Title */}
          <div className="text-center" data-name="Title" data-node-id="418:1550">
            <h1 className="font-['Rubik:Bold',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d]" dir="auto" data-node-id="418:1551">
              התחברות
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-name="Fields" data-node-id="418:1553">

            {/* Email Field */}
            <div className="relative" data-name="Field" data-node-id="418:1554">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]" data-name="Line" data-node-id="I418:1554;1122:1826"></div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2"
                placeholder="כתובת מייל"
                dir="rtl"
              />
            </div>

            {/* Password Field */}
            <div className="relative" data-name="Field" data-node-id="418:1555">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]" data-name="Line" data-node-id="418:1559"></div>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10"
                placeholder="סיסמה"
                dir="rtl"
              />
            </div>
          </form>

          {/* Login Button */}
          <div className="pt-4" data-name="Inform" data-node-id="418:1565">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#2987cd] hover:bg-[#2987cd]/90 text-white rounded-full h-12 text-lg font-bold"
              data-name="Button"
              data-node-id="418:1566"
            >
              <div className="flex items-center space-x-3" data-name="Inside" data-node-id="418:1567">
                <span className="font-['Rubik:Bold',_sans-serif] font-bold text-lg" dir="auto" data-node-id="418:1570">
                  התחברות
                </span>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>
          </div>

          {/* Separator and Google Button */}
          <div className="space-y-4" data-node-id="418:1571">
            <div className="flex items-center justify-center" data-name="line" data-node-id="418:1572">
              <div className="flex-1 h-px bg-[#6a6a6a]"></div>
              <span className="px-4 text-[#6a6a6a] text-sm" dir="auto" data-node-id="418:1574">
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
              data-node-id="418:1577"
            >
              <div className="flex items-center space-x-3">
                <img alt="" className="w-5 h-5" src={imgGoogleFrame} data-name="Frame" data-node-id="418:1578" />
                <span className="font-['Inter:Regular',_sans-serif] text-lg text-[#32343d]" data-node-id="418:1584">
                  Google
                </span>
              </div>
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center" data-node-id="418:1585">
            <p className="text-[#32343d] text-base" dir="auto">
              <span className="font-['Rubik:Regular',_sans-serif]">אין לכם חשבון? </span>
              <Link to="/Register" className="font-['Rubik:Bold',_sans-serif] font-bold text-[#2987cd] hover:underline">
                הרשמו
              </Link>
            </p>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link to="/forgot-password" className="font-['Rubik:Regular',_sans-serif] text-[#2987cd] text-sm hover:underline" dir="auto" data-node-id="418:1595">
              שכחתם סיסמה?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;