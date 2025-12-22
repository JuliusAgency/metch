import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

// Figma design assets
const imgHugeiconsAiMagic = "http://localhost:3845/assets/289919713a3bb46a7fa4929734053736f1a07e8a.svg";

const EmailConfirmed = () => {
  const [loading, setLoading] = useState(true);
  const toastShownRef = useRef(false);
  const redirectInitiatedRef = useRef(false);
  const { user, loading: userLoading, createUserProfile, loadUserProfile } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent multiple executions
    if (redirectInitiatedRef.current) {
      return;
    }

    const checkUserConfirmation = async () => {
      try {
        // Wait for user context to load
        if (userLoading) {
          return;
        }

        // Check if there is an access token hash but user is not loaded yet
        if (!user && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery') || window.location.hash.includes('error='))) {
          // Let Supabase process the hash
          return;
        }

        // Check if user exists from UserContext (which uses Supabase session)
        if (!user) {
          // Double check if we truly don't have a session
          const { data: { session } } = await import('@/api/supabaseClient').then(m => m.supabase.auth.getSession());

          if (session?.user) {
            // We have a user, wait for context to update or proceed with this user
            // Context update should trigger re-run
            return;
          }

          redirectInitiatedRef.current = true;
          toast({
            title: "משתמש לא נמצא",
            description: "אנא התחברו מחדש",
            variant: "destructive",
          });
          navigate('/Login');
          return;
        }

        // Check if user email is confirmed - use email_confirmed_at instead of confirmed_at

        const isEmailConfirmed = user.email_confirmed_at !== null || user.confirmed_at !== null;

        const profile = await loadUserProfile(user.id);

        // If profile exists and has a user_type, go to dashboard
        if (profile && profile.user_type) {

          redirectInitiatedRef.current = true;
          navigate('/Dashboard');
          return;
        }

        // If profile exists but no user_type, go to UserTypeSelection
        if (profile && !profile.user_type) {

          redirectInitiatedRef.current = true;
          navigate('/UserTypeSelection');
          return;
        }

        if (isEmailConfirmed) {
          // Create user profile with no user_type
          try {

            const profile = await createUserProfile(user.id);

            if (profile) {

              // Show toast only when creating initial profile
              if (!toastShownRef.current) {
                toast({
                  title: "אימייל אומת בהצלחה!",
                  description: "ברוכים הבאים למאצי",
                });
                toastShownRef.current = true;
              }

              // Always redirect to user type selection page
              redirectInitiatedRef.current = true;
              navigate('/UserTypeSelection');
            } else {
              console.error('createUserProfile returned null/undefined');
              redirectInitiatedRef.current = true;
              toast({
                title: "שגיאה ביצירת פרופיל",
                description: "לא ניתן ליצור פרופיל משתמש. אנא נסו שוב או פנו לתמיכה.",
                variant: "destructive",
              });
              navigate('/Login');
            }
          } catch (profileError) {
            console.error('Error creating profile:', profileError);
            redirectInitiatedRef.current = true;
            toast({
              title: "שגיאה ביצירת פרופיל",
              description: `אירעה שגיאה בעת יצירת הפרופיל: ${profileError.message || 'שגיאה לא ידועה'}`,
              variant: "destructive",
            });
            navigate('/Login');
          }
        } else {
          redirectInitiatedRef.current = true;
          toast({
            title: "אימייל לא אומת",
            description: "אנא בדקו את המייל שלכם ואימתו את החשבון",
            variant: "destructive",
          });
          navigate('/EmailConfirmation');
        }
      } catch (error) {
        console.error('Error checking user confirmation:', error);
        redirectInitiatedRef.current = true;
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעת בדיקת האימות",
          variant: "destructive",
        });
        navigate('/Login');
      } finally {
        setLoading(false);
      }
    };

    checkUserConfirmation();
    // Remove loadUserProfile and createUserProfile from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, navigate, toast]);

  // Show loading state while checking
  if (loading || userLoading) {
    return (
      <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4">
        {/* Background Card */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl h-full max-h-[90vh]" />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-4">
              <div className="flex items-center space-x-2">
                <img alt="" className="w-8 h-8" src={imgHugeiconsAiMagic} />
                <p className="font-['Poppins:Regular',_sans-serif] text-2xl text-black font-medium">
                  Metch
                </p>
              </div>
            </div>
          </div>

          {/* Loading Message */}
          <div className="space-y-4">
            <h1 className="font-['Rubik:Bold',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d]">
              מכין פרופיל...
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2987cd]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not render as we redirect in useEffect
  return null;
};

export default EmailConfirmed;
