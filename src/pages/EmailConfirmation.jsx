import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';



const EmailConfirmation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const email = location.state?.email;

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "שגיאה",
        description: "כתובת המייל לא נמצאה. אנא נסו להירשם שוב.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const emailRedirectTo = `${window.location.origin}/EmailConfirmed`;
      console.log('Resending email to:', email, 'Redirecting to:', emailRedirectTo);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: emailRedirectTo
        }
      });

      if (error) throw error;

      toast({
        title: "קוד נשלח שוב!",
        description: "בדקו את תיבת המייל שלכם",
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "שגיאה בשליחת קוד",
        description: error.message || "אירעה שגיאה בעת שליחת הקוד",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-gradient-to-b from-[#dbedf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4">
      {/* Main Card Component - Merged Background and Content */}
      <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl min-h-[80vh] flex flex-col justify-center items-center p-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-5 px-10">
              <div className="flex items-center">
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

          {/* Content */}
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="font-['Rubik',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d]" dir="auto">
                אימות מייל הרשמה
              </h1>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="font-['Rubik',_sans-serif] font-normal text-lg text-[#32343d]" dir="auto">
                בדקו את המייל שלכם והמשיכו דרך הקישור שנשלח
              </p>
            </div>

            {/* Resend Email Button */}
            <div className="text-center">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="font-['Rubik',_sans-serif] text-[14px] text-[#2987cd] hover:underline disabled:opacity-50"
                dir="auto"
              >
                <span className="font-normal text-[#32343d]">{`לא קיבלת את הקוד? `}</span>
                <span className="font-bold">שלח שוב</span>
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link to="/Login" className="font-['Rubik',_sans-serif] text-[#2987cd] text-sm hover:underline" dir="auto">
                חזרה להתחברות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
