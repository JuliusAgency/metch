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

        // Check if there is an access token in the URL hash (Supabase Auth)
        if (!user && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery') || window.location.hash.includes('error='))) {
          console.log("[EmailConfirmed] Hash detected, waiting for Supabase to process...");
          return;
        }

        // Check if user exists from UserContext
        if (!user) {
          console.log("[EmailConfirmed] No user in context. Checking directly via getUser()...");

          // Retry logic: Attempt to fetch user a few times before giving up
          // This handles race conditions where hash is stripped but session is initializing
          let authUser = null;
          for (let i = 0; i < 3; i++) {
            const { data } = await import('@/api/supabaseClient').then(m => m.supabase.auth.getUser());
            if (data?.user) {
              authUser = data.user;
              console.log("[EmailConfirmed] Found user via direct check on attempt", i + 1);
              break;
            }
            console.log(`[EmailConfirmed] Attempt ${i + 1}: No user found. Waiting...`);
            await new Promise(r => setTimeout(r, 1000));
          }

          if (authUser) {
            // We found a user! Wait for context to update (re-render will handle it)
            console.log("[EmailConfirmed] User found! Waiting for context update...");
            return;
          }

          console.warn("[EmailConfirmed] User not found after retries. Redirecting to Login.");
          redirectInitiatedRef.current = true;
          toast({
            title: "משתמש לא נמצא",
            description: "האימות נכשל או שהמשתמש לא מחובר. אנא התחברו מחדש.",
            variant: "destructive",
          });
          navigate('/Login');
          return;
        }

        // Check if user email is confirmed - use email_confirmed_at instead of confirmed_at

        const isEmailConfirmed = user.email_confirmed_at !== null || user.confirmed_at !== null;

        const profile = await loadUserProfile(user.id);

        // If profile exists and has a user_type, go to dashboard (or onboarding if missing critical info)
        if (profile && profile.user_type) {
          redirectInitiatedRef.current = true;

          if (profile.user_type === 'employer' && !profile.is_onboarding_completed && (!profile.company_name || !profile.company_name.trim())) {
            console.log("[EmailConfirmed Guard] Redirecting employer to onboarding - missing company info");
            navigate('/CompanyProfileCompletion');
          } else {
            console.log("[EmailConfirmed Guard] Redirecting to Dashboard");
            navigate('/Dashboard');
          }
          return;
        }

        // If profile exists but no user_type, go to UserTypeSelection
        if (profile && !profile.user_type) {
          redirectInitiatedRef.current = true;
          console.log("[EmailConfirmed Guard] Redirecting to UserTypeSelection");
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

              // Force sign out to clear stale session
              const { supabase } = await import('@/api/supabaseClient');
              await supabase.auth.signOut();

              toast({
                title: "שגיאה ביצירת פרופיל",
                description: "לא ניתן ליצור פרופיל משתמש. ייתכן והחשבון נמחק או שהתפוגג. אנא נסו להירשם מחדש.",
                variant: "destructive",
              });
              navigate('/Register');
            }
          } catch (profileError) {
            console.error('Error creating profile:', profileError);
            redirectInitiatedRef.current = true;

            // Force sign out
            const { supabase } = await import('@/api/supabaseClient');
            await supabase.auth.signOut();

            toast({
              title: "שגיאה ביצירת פרופיל",
              description: `אירעה שגיאה בעת יצירת הפרופיל: ${profileError.message || 'שגיאה לא ידועה'}. אנא נסו להירשם מחדש.`,
              variant: "destructive",
            });
            navigate('/Register');
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

  if (loading || userLoading) {
    return (
      <div className="min-h-screen page-gradient flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // This should not render as we redirect in useEffect
  return null;
};

export default EmailConfirmed;
