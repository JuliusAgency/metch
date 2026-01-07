import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

// Figma design assets
const imgGoogleFrame = "https://www.svgrepo.com/show/475656/google-color.svg";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user, loading: authLoading } = useUser();
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
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin" />
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
    <div className="bg-gradient-to-b from-[#dbedf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4">

      {/* Main Card Component - Merged Background and Content */}
      <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-[750px] p-12">

        <div className="w-full max-w-md mx-auto">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-5 px-10">
              <div className="flex items-center">
                <p className="font-['Poppins',_sans-serif] text-xl text-black font-light">
                  Metch
                </p>
                <img src="/sparkle_logo.png" alt="Sparkle" className="w-6 h-6 object-contain" />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-8">

            {/* Title */}
            <div className="text-center">
              <h1 className="font-['Secular_One',_sans-serif] text-3xl md:text-4xl text-[#32343d]" dir="auto">
                התחברות
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email Field */}
              <div className="relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]"></div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2 pl-10 focus-visible:ring-0 shadow-none px-0"
                  placeholder="סיסמה"
                  dir="rtl"
                />
              </div>

              {/* Forgot Password Link - Moved here */}
              <div className="text-right">
                <Link to="/forgot-password" className="font-['Rubik',_sans-serif] font-normal text-[#2987cd] text-sm hover:underline" dir="auto">
                  שכחתם סיסמה?
                </Link>
              </div>

              {/* Login Button */}
              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-1/2 mx-auto bg-[#2987cd] hover:bg-[#2987cd]/90 text-white rounded-full h-12 text-lg font-bold "
                >
                  <div className="flex items-center justify-center space-x-3 w-full">
                    <span className="font-['Secular_One',_sans-serif] text-lg ml-2" dir="auto">
                      התחברות
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
                <span className="px-4 text-[#6a6a6a] text-sm" dir="auto">
                  או הרשמו באמצעות
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
                        title: "שגיאה בהתחברות עם Google",
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
                    <img alt="" className="w-5 h-5" src={imgGoogleFrame} />
                    <span className="font-['Inter:Regular',_sans-serif] text-lg text-[#32343d]">
                      Google
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-[#32343d] text-base" dir="auto">
                <Link to="/Register" className="font-['Secular_One',_sans-serif] text-[#2987cd] hover:underline">
                  הרשמו
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;