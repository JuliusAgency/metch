import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import cvCreateIcon from '@/assets/cv_create_icon.png';
import cvExistsIcon from '@/assets/cv_exists_icon.png';
import astronautWindow from '@/assets/astronaut_window.png';
import globeGrid from '@/assets/globe_grid.png';
import VectorLogo from '@/assets/Vector.svg';
import metchStar from '@/assets/metch_star.png';
import CVChoiceModal from '@/components/CVChoiceModal';


// Figma design assets - Desktop
const img00113000X30003 = "http://localhost:3845/assets/0c77918b0496d6d12dc8f3e62185bd5639b2a24f.png";

// Figma design assets - Mobile
const imgGroupMobile = "http://localhost:3845/assets/33b47c1d671048067fe8e063fbd90bdf50240b5d.svg";
const imgVector89Mobile = "http://localhost:3845/assets/b5306855cc36ef92e0106dab5915b33a63013d3d.svg";
const imgVector1Mobile = "http://localhost:3845/assets/784647559f4e38b6c515ebf2115501bb77df45d1.svg";
const imgEllipse491Mobile = "http://localhost:3845/assets/951f4fcad183ed0f524f2beee6e77c7649575acc.svg";
const imgVector2Mobile = "http://localhost:3845/assets/2b56635c617aa33c3b86edc4b98b9f276f4f7411.svg";
const imgVector3Mobile = "http://localhost:3845/assets/8b213c7f4e44a5d8cc6e0ab221995fb78d6eb33c.svg";
const imgVector4Mobile = "http://localhost:3845/assets/72e4b24edacb5c8e832962169ccbbc66a7638120.svg";
const imgVector5Mobile = "http://localhost:3845/assets/d5a77e346df785c2e61c9d8ebc59ab003a8facc8.svg";
const imgVector6Mobile = "http://localhost:3845/assets/38437995b6d423593af0f3de968f7aa2dae9470d.svg";
const imgEllipse480Mobile = "http://localhost:3845/assets/89b89e723ec104e845beb68e4661ff10ed044c2b.svg";

const imgHugeiconsAiMagic = "http://localhost:3845/assets/289919713a3bb46a7fa4929734053736f1a07e8a.svg";



import { Menu } from 'lucide-react';

const UserTypeSelection = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCVChoiceModal, setShowCVChoiceModal] = useState(false);
  const { user, updateProfile, loading: userLoading, loadUserProfile } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to dashboard if user already has a user_type
  useEffect(() => {
    // Only redirect if we are not currently in the process of selecting a type (e.g. showing modal)
    // and if the user already had a type when loading (not just set now)
    if (!userLoading && user && user.user_type && !selectedType && !loading) {
      if (user.is_onboarding_completed) {
        navigate('/Dashboard');
      } else {
        // Enforce onboarding flow
        if (user.user_type === 'employer') {
          navigate('/CompanyProfileCompletion');
        } else if (user.user_type === 'job_seeker') {
          // If user is job seeker but incomplete, force them to choose CV method again
          setShowCVChoiceModal(true);
        }
      }
    }
  }, [user, userLoading, navigate, selectedType, loading]);

  const handleTypeSelection = async (userType) => {
    if (loading) return;

    setSelectedType(userType);
    setLoading(true);

    try {
      // 1. Update user profile with selected type
      await updateProfile({ user_type: userType });

      // 2. Refresh user profile in context to ensure latest state
      if (user?.id) {
        await loadUserProfile(user.id);
      }

      // Best-effort reset of career_stage to null
      try {
        await updateProfile({ career_stage: null });
      } catch (resetError) {
        console.warn("Failed to reset career_stage, proceeding anyway:", resetError);
      }

      toast({
        title: "סוג משתמש נבחר בהצלחה!",
        description: "ברוכים הבאים למאצי",
      });

      // Navigate based on user type
      if (userType === 'job_seeker') {
        if (user?.email) {
          localStorage.removeItem(`jobseeker_guide_${user.email}`);
        }
        setShowCVChoiceModal(true);
      } else {
        navigate('/CompanyProfileCompletion');
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת בחירת סוג המשתמש",
        variant: "destructive",
      });
      // Reset selection on error
      setSelectedType(null);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking user data
  if (userLoading && !user) {
    return (
      <div className="bg-[#f0f9ff] h-screen w-screen flex items-center justify-center">
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#dbecf3] to-white md:bg-none md:bg-[#f0f9ff] flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center p-0 md:p-4 relative overflow-hidden" dir="rtl">

      {/* Globe Background - Desktop Only */}
      <div className="hidden md:block absolute bottom-[-5vh] left-[-5vh] w-[77vh] h-[77vh] pointer-events-none z-20">
        <img
          src={globeGrid}
          alt="Globe Grid"
          className="w-full h-full object-contain object-bottom-left opacity-90"
          style={{
            filter: 'brightness(0) saturate(100%) invert(56%) sepia(65%) saturate(2469%) hue-rotate(184deg) brightness(96%) contrast(91%)'
          }}
        />
      </div>



      {/* Main Card */}
      <div className="bg-transparent md:bg-white md:rounded-[40px] shadow-none md:shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full md:w-[99%] max-w-[1800px] h-auto md:h-[85vh] min-h-[auto] md:min-h-[600px] relative z-10 flex flex-col md:flex-row overflow-visible md:overflow-hidden border-none md:border border-white mt-0 md:mt-0 pt-10 md:pt-0">

        {/* Right Side: Content (Visual Right in RTL, First in DOM) */}
        <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-start md:justify-center px-0 md:px-16 lg:px-24 mb-0 md:mb-0 items-center flex-grow">

          {/* Card Wrapper for Mobile Content - Extended to Bottom */}
          <div className="bg-white rounded-t-[30px] rounded-b-none shadow-[0_-5px_20px_rgba(0,0,0,0.03)] p-6 pt-10 md:p-0 md:bg-transparent md:shadow-none md:rounded-none w-[92%] md:w-full max-w-none md:max-w-md mx-auto space-y-8 md:space-y-12 flex-grow md:flex-grow-0 min-h-[calc(100vh-120px)] md:min-h-0 flex flex-col relative overflow-hidden">

            {/* Headlines */}
            <div className="space-y-2 md:space-y-4 text-center z-10 relative">
              <h1 className="text-[28px] md:text-[40px] font-bold text-[#1a1f36] leading-tight">
                איך תשתמש במאצ׳?
              </h1>
              <p className="text-base md:text-xl text-gray-500 font-normal">
                יש לבחור את האפשרות המתאימה עבורך
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-4 md:space-y-5 w-[97%] max-w-[350px] mx-auto z-30 relative">
              <button
                onClick={() => handleTypeSelection('job_seeker')}
                disabled={loading}
                className={`w-full py-3 md:py-4 px-6 rounded-full text-lg md:text-xl font-bold transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg
                  ${selectedType === 'job_seeker'
                    ? 'bg-[#2987cd] text-white ring-4 ring-blue-200'
                    : 'bg-[#2987cd] text-white hover:bg-[#1f6ba8]'
                  } ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                אני מחפש עבודה
              </button>

              <button
                onClick={() => handleTypeSelection('employer')}
                disabled={loading}
                className={`w-full py-3 md:py-4 px-6 rounded-full text-lg md:text-xl font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md border border-gray-200 shadow-sm
                  ${selectedType === 'employer'
                    ? 'bg-gray-50 text-[#1a1f36] ring-4 ring-gray-200'
                    : 'bg-white text-[#1a1f36] hover:bg-gray-50'
                  } ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                אני מפרסם משרה
              </button>
            </div>

            {/* Mobile Astronaut Image - Inside Card at Bottom */}
            <div className="md:hidden absolute bottom-[14%] left-0 right-0 w-full h-[50%] flex items-end justify-center pointer-events-none z-30">
              <img
                src={astronautWindow}
                alt="Astronaut"
                className="w-[75%] h-full object-contain object-bottom"
              />
            </div>

          </div>

          {/* Mobile Globe - Outside Card to Allow Overflow */}
          <div className="md:hidden absolute bottom-[-10vh] left-[-18vh] w-[50vh] h-[50vh] pointer-events-none z-50">
            <img
              src={globeGrid}
              alt="Globe Grid"
              className="w-full h-full object-contain object-bottom-left opacity-90"
              style={{
                filter: 'brightness(0) saturate(100%) invert(56%) sepia(65%) saturate(2469%) hue-rotate(184deg) brightness(96%) contrast(91%)'
              }}
            />
          </div>
        </div>

        {/* Left Side: Illustration (Desktop Only) */}
        <div className="hidden md:flex w-full md:w-1/2 h-[40vh] md:h-full relative items-end md:items-center justify-center bg-transparent md:bg-white mt-auto md:mt-0">
          {/* Astronaut Image - Scaled Up and Positioned */}
          <div className="w-[85%] h-[85%] relative flex items-center justify-center md:-translate-y-10 md:translate-x-12">
            <img
              src={astronautWindow}
              alt="Astronaut"
              className="w-full h-full object-contain object-bottom md:object-center"
            />
          </div>
        </div>

      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium text-lg">מעדכון פרופיל...</p>
          </div>
        </div>
      )}

      {/* CV Choice Modal */}
      <CVChoiceModal
        isOpen={showCVChoiceModal}
        loading={loading}
        onSelect={(choice) => {
          navigate(`/CVGenerator?choice=${choice}&onboarding=true`);
        }}
      />
    </div>
  );
};

export default UserTypeSelection;
