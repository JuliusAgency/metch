import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

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

const UserTypeSelection = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTypeSelection = async (userType) => {
    if (loading) return;
    
    setSelectedType(userType);
    setLoading(true);

    try {
      // Update user profile with selected type
      await updateProfile({ user_type: userType });
      
      toast({
        title: "סוג משתמש נבחר בהצלחה!",
        description: "ברוכים הבאים למאצי",
      });

      // Navigate to dashboard
      navigate('/Dashboard');
    } catch (error) {
      console.error('Error updating user type:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת בחירת סוג המשתמש",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] h-screen w-screen relative overflow-hidden">
      {/* Desktop Design - Responsive Implementation */}
      <div className="hidden lg:block">
        {/* Main Content Container - Responsive */}
        <div id="desktop-container" className='w-full h-full overflow-hidden'>
            <div id="card-container" className='absolute bottom-0 left-1/2 translate-x-[-50%] w-[95vw] h-[90vh] bg-[rgba(255,255,255,0.5)] rounded-t-[40px]  shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] '>
              {/* Desktop User Type Selection Content */}
              <div className="absolute right-[60px] top-1/2 translate-y-[-50%] flex flex-col gap-[38px] items-start w-[401px]">
                {/* Title */}
                <div className="flex flex-col gap-[15px] items-center w-full">
                  <p className="font-['Rubik:Bold',_sans-serif] font-bold leading-[1.3] text-[#32343d] text-[46px] text-center w-[477px]">
                    איך תשתמש במאצ׳?
                  </p>
                </div>
                
                {/* Subtitle */}
                <p className="font-['Rubik:Regular',_sans-serif] font-normal leading-[1.6] text-[#32343d] text-[23px] text-center">
                  יש לבחור את האפשרות המתאימה עבורך
                </p>
                
                {/* Buttons */}
                <div className="flex flex-col gap-[32px] items-start w-[387px]">
                  <button
                    onClick={() => handleTypeSelection('job_seeker')}
                    disabled={loading}
                    className={`bg-[#2987cd] border-[1.227px] border-solid border-white box-border flex gap-[12px] h-[65px] items-center justify-center p-[17px] relative rounded-[74px] w-full transition-all duration-200 ${
                      selectedType === 'job_seeker' 
                        ? 'bg-[#2987cd]' 
                        : 'bg-[#2987cd] hover:bg-[#1f6ba8]'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <p className="font-['Rubik:Bold',_sans-serif] font-bold leading-[normal] text-[26px] text-center text-white">
                      אני מחפש עבודה
                    </p>
                  </button>
                  <button
                    onClick={() => handleTypeSelection('employer')}
                    disabled={loading}
                    className={`bg-white border-[1.227px] border-[#d9d9d9] border-solid box-border flex gap-[12px] h-[65px] items-center justify-center p-[17px] relative rounded-[74px] w-full transition-all duration-200 ${
                      selectedType === 'employer' 
                        ? 'bg-[#2987cd] border-white' 
                        : 'bg-white border-[#d9d9d9] hover:bg-[#f5f5f5]'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <p className={`font-['Rubik:Regular',_sans-serif] font-normal leading-[normal] text-[26px] text-center ${
                      selectedType === 'employer' ? 'text-white' : 'text-[#162b6b]'
                    }`}>
                      אני מפרסם משרה
                    </p>
                  </button>
                </div>
              </div>
            </div>


            <div id="decorative-element" className='absolute bottom-[-20vh] left-[-25vw] w-[100vw] h-[100vh]'>
                <img alt="" src={"/astronaut.svg"} className='w-full h-full' />
            </div>
        </div>
      </div>

      {/* Mobile Design - Responsive Implementation */}
      <div className="block sm:hidden">

        {/* Main Card - Responsive */}
        <div className="absolute h-[709px] sm:h-[808px] left-1/2 top-[50px] sm:top-[60px] translate-x-[-50%] w-[347px] sm:w-[395px]">
          <div className="absolute bg-[rgba(255,255,255,0.5)] h-[709px] sm:h-[808px] left-1/2 rounded-[16px] sm:rounded-[18px] shadow-[0px_0px_7px_0px_rgba(0,0,0,0.2)] sm:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.2)] top-0 translate-x-[-50%] w-[347px] sm:w-[395px]" />
          
          {/* Mobile Decorative Elements */}
          <div className="absolute flex inset-[44.01%_3.91%_15.79%_3.75%] items-center justify-center">
            <div className="flex-none h-[253.327px] rotate-[353.475deg] w-[293.549px]">
              <div className="relative size-full">
                <div className="absolute inset-[-0.14%_-0.12%]">
                  <img alt="" className="block max-w-none size-full" src={imgGroupMobile} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute h-[250px] left-[64px] top-[381px] w-[265px]">
            <div className="absolute inset-[-0.69%_-0.26%_-0.45%_-0.36%]">
              <img alt="" className="block max-w-none size-full" src={imgVector89Mobile} />
            </div>
          </div>
          <div className="absolute flex inset-[53.71%_2.2%_32.56%_81.58%] items-center justify-center">
            <div className="flex-none h-[92.708px] rotate-[353.475deg] w-[46.05px]">
              <div className="relative size-full">
                <img alt="" className="block max-w-none size-full" src={imgVector1Mobile} />
              </div>
            </div>
          </div>
          <div className="absolute left-[169px] size-[14px] top-[411px]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse491Mobile} />
          </div>
          <div className="absolute flex inset-[81.66%_51.54%_10.52%_40.91%] items-center justify-center">
            <div className="flex-none h-[53.488px] rotate-[353.475deg] w-[20.238px]">
              <div className="relative size-full">
                <img alt="" className="block max-w-none size-full" src={imgVector2Mobile} />
              </div>
            </div>
          </div>
          <div className="absolute flex inset-[66.43%_68.05%_30.2%_17.95%] items-center justify-center">
            <div className="flex-none h-[18.698px] rotate-[353.475deg] w-[46.771px]">
              <div className="relative size-full">
                <img alt="" className="block max-w-none size-full" src={imgVector3Mobile} />
              </div>
            </div>
          </div>
          <div className="absolute h-[34.079px] left-[53px] top-[370px] w-[48.591px]">
            <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.2714276909828186)+(var(--transform-inner-height)*0.9624587893486023)))] items-center justify-center left-[24.3px] top-0 translate-x-[-50%] w-[calc(1px*((var(--transform-inner-height)*0.2714276909828186)+(var(--transform-inner-width)*0.9624587893486023)))]" style={{ "--transform-inner-width": "38.59375", "--transform-inner-height": "22.671875" }}>
              <div className="flex-none rotate-[344.251deg]">
                <p className="font-['Poppins:Regular',_sans-serif] leading-[1.6] not-italic relative text-[#2987cd] text-[14.172px] text-center text-nowrap whitespace-pre">
                  Metch
                </p>
              </div>
            </div>
          </div>
          <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.0033094892278313637)+(var(--transform-inner-height)*0.9999945759773254)))] items-center justify-center left-[44.44px] top-[390.44px] w-[calc(1px*((var(--transform-inner-height)*0.0033094892278313637)+(var(--transform-inner-width)*0.9999945759773254)))]" style={{ "--transform-inner-width": "9", "--transform-inner-height": "9" }}>
            <div className="flex-none rotate-[0.19deg]">
              <div className="relative size-[9px]">
                <div className="absolute inset-[-5.556%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector4Mobile} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute flex inset-[46.5%_25.55%_51.61%_70.6%] items-center justify-center">
            <div className="flex-none rotate-[353.475deg] size-[12.075px]">
              <div className="relative size-full">
                <div className="absolute inset-[-2.92%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector5Mobile} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute flex inset-[71.44%_76.6%_22.51%_17.83%] items-center justify-center">
            <div className="flex-none h-[41.476px] rotate-[353.475deg] w-[14.728px]">
              <div className="relative size-full">
                <img alt="" className="block max-w-none size-full" src={imgVector6Mobile} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Title - Responsive */}
        <div className="absolute flex flex-col gap-[12px] sm:gap-[14px] items-center left-1/2 top-[100px] sm:top-[115px] translate-x-[-50%] w-[335px] sm:w-[381px]">
          <p className="font-bold text-[26px] sm:text-[30px] text-center text-[#32343d] w-full">
            איך תשתמש במאצ׳?
          </p>
        </div>

        {/* Mobile Subtitle - Responsive */}
        <p className="absolute font-normal text-[18px] sm:text-[20px] text-center text-[#32343d] left-1/2 top-[140px] sm:top-[160px] translate-x-[-50%] w-[315px] sm:w-[359px]">
          יש לבחור את האפשרות המתאימה עבורך
        </p>

        {/* Mobile Buttons - Responsive */}
        <div className="absolute flex flex-col gap-[26px] sm:gap-[30px] items-start left-1/2 top-[180px] sm:top-[205px] translate-x-[-50%] w-[315px] sm:w-[359px]">
          <button
            onClick={() => handleTypeSelection('job_seeker')}
            disabled={loading}
            className={`border border-solid border-white box-border flex gap-[10px] sm:gap-[11px] h-[53px] sm:h-[60px] items-center justify-center p-[14px] sm:p-[16px] relative rounded-[60px] sm:rounded-[68px] w-full transition-all duration-200 ${
              selectedType === 'job_seeker' 
                ? 'bg-[#2987cd]' 
                : 'bg-[#2987cd] hover:bg-[#1f6ba8]'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <p className="font-bold text-[22px] sm:text-[25px] text-center text-white">
              אני מחפש עבודה
            </p>
          </button>
          <button
            onClick={() => handleTypeSelection('employer')}
            disabled={loading}
            className={`border border-[#d9d9d9] border-solid box-border flex gap-[10px] sm:gap-[11px] h-[53px] sm:h-[60px] items-center justify-center p-[14px] sm:p-[16px] relative rounded-[60px] sm:rounded-[68px] w-full transition-all duration-200 ${
              selectedType === 'employer' 
                ? 'bg-[#2987cd] border-white' 
                : 'bg-white border-[#d9d9d9] hover:bg-[#f5f5f5]'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <p className={`font-normal text-[22px] sm:text-[25px] text-center ${
              selectedType === 'employer' ? 'text-white' : 'text-[#162b6b]'
            }`}>
              אני מפרסם משרה
            </p>
          </button>
        </div>

        {/* Mobile Decorative Circle - Responsive */}
        <div className="absolute left-[-67px] sm:left-[-76px] size-[256px] sm:size-[292px] top-[600px] sm:top-[685px]">
          <img alt="" className="block max-w-none size-full" src={imgEllipse480Mobile} />
        </div>

        {/* Mobile Person Image - Responsive */}
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.5000000596046448)+(var(--transform-inner-height)*0.8660253882408142)))] items-center justify-center left-[calc(50%-135.803px)] sm:left-[calc(50%-154.6px)] top-[520px] sm:top-[590px] translate-x-[-50%] w-[calc(1px*((var(--transform-inner-height)*0.5000000596046448)+(var(--transform-inner-width)*0.8660253882408142)))]" style={{ "--transform-inner-width": "308.171875", "--transform-inner-height": "307.015625" }}>
          <div className="flex-none rotate-[150deg]">
            <div className="h-[307.017px] sm:h-[349.8px] relative w-[308.173px] sm:w-[351.1px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[132.75%] left-[-17.79%] max-w-none top-[-15.07%] w-[134.58%]" src={img00113000X30003} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2987cd]"></div>
            <p className="text-[#32343d] font-medium">מעדכן פרופיל...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTypeSelection;
