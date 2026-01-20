import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';

// Figma design assets
const imgHugeiconsAiMagic = "http://localhost:3845/assets/289919713a3bb46a7fa4929734053736f1a07e8a.svg";

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
    <div className="bg-gradient-to-b from-[#dbedf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4" data-name="אימות מייל הרשמה" data-node-id="418:1596">
      {/* Background Card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl h-full max-h-[90vh]" data-node-id="678:3185" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto" data-node-id="678:3187">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-4" data-name="menu מחפש עבודה" data-node-id="678:3188">
            <div className="flex items-center space-x-2" data-name="logo metch" data-node-id="678:3192">
              <img alt="" className="w-8 h-8" src={imgHugeiconsAiMagic} data-name="hugeicons:ai-magic" data-node-id="678:3194" />
              <p className="font-['Poppins:Regular',_sans-serif] text-2xl text-black font-medium" data-node-id="678:3193">
                Metch
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8" data-node-id="597:1981">

          {/* Title */}
          <div className="text-center" data-name="Title" data-node-id="418:1620">
            <h1 className="font-['Rubik:Bold',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d]" dir="auto" data-node-id="418:1621">
              אימות מייל הרשמה
            </h1>
          </div>

          {/* Instructions */}
          <div className="text-center" data-name="Text" data-node-id="418:1659">
            <p className="font-['Rubik:Regular',_sans-serif] font-normal text-lg text-[#32343d]" dir="auto" data-node-id="418:1660">
              בדקו את המייל שלכם והמשיכו דרך הקישור שנשלח
            </p>
          </div>

          {/* Resend Email Button */}
          <div className="text-center" data-node-id="418:1671">
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="font-['Assistant:Bold',_sans-serif] font-bold text-[14px] text-[#2987cd] hover:underline disabled:opacity-50"
              dir="auto"
            >
              <span className="font-['Rubik:Regular',_sans-serif] font-normal text-[#32343d]">{`לא קיבלת את הקוד? `}</span>
              <span className="font-['Rubik:Bold',_sans-serif]">שלח שוב</span>
            </button>
          </div>


          {/* Back to Login Link */}
          <div className="text-center">
            <Link to="/Login" className="font-['Rubik:Regular',_sans-serif] text-[#2987cd] text-sm hover:underline" dir="auto">
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
