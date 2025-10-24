import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

// Figma design assets
const imgHugeiconsAiMagic = "http://localhost:3845/assets/289919713a3bb46a7fa4929734053736f1a07e8a.svg";

const EmailConfirmed = () => {
  const [loading, setLoading] = useState(true);
  const toastShownRef = useRef(false);
  const { user, loading: userLoading, createUserProfile, loadUserProfile } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserConfirmation = async () => {
      try {
        // Wait for user context to load
        if (userLoading) return;

        // Check if user exists in localStorage or context
        const storedUser = localStorage.getItem('user');
        const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

        if (!currentUser) {
          toast({
            title: "משתמש לא נמצא",
            description: "אנא התחברו מחדש",
            variant: "destructive",
          });
          navigate('/Login');
          return;
        }

        // Check if user email is confirmed
        console.log('currentUser', currentUser);
        const isEmailConfirmed = currentUser.confirmed_at !== null;

        const profile = await loadUserProfile(currentUser.id);

        if (profile) {
          navigate('/UserTypeSelection');
          return;
        }

        if (isEmailConfirmed ) {
          // Create user profile with no user_type
          try {
            console.log('Attempting to create profile for user:', currentUser.id);
            const profile = await createUserProfile(currentUser.id);
            
            if (profile) {
              console.log('Profile created successfully:', profile);
              // Show toast only when creating initial profile
              if (!toastShownRef.current) {
                toast({
                  title: "אימייל אומת בהצלחה!",
                  description: "ברוכים הבאים למאצי",
                });
                toastShownRef.current = true;
              }
              
              // Always redirect to user type selection page
              navigate('/UserTypeSelection');
            } else {
              console.error('createUserProfile returned null/undefined');
              toast({
                title: "שגיאה ביצירת פרופיל",
                description: "לא ניתן ליצור פרופיל משתמש. אנא נסו שוב או פנו לתמיכה.",
                variant: "destructive",
              });
              navigate('/Login');
            }
          } catch (profileError) {
            console.error('Error creating profile:', profileError);
            toast({
              title: "שגיאה ביצירת פרופיל",
              description: `אירעה שגיאה בעת יצירת הפרופיל: ${profileError.message || 'שגיאה לא ידועה'}`,
              variant: "destructive",
            });
            navigate('/Login');
          }
        } else {
          toast({
            title: "אימייל לא אומת",
            description: "אנא בדקו את המייל שלכם ואימתו את החשבון",
            variant: "destructive",
          });
          navigate('/EmailConfirmation');
        }
      } catch (error) {
        console.error('Error checking user confirmation:', error);
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
  }, [user, userLoading, navigate, createUserProfile, toast, loadUserProfile]);

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
