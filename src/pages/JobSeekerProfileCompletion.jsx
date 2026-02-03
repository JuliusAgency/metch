
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { UploadCloud, Globe, Facebook, Instagram, Linkedin, Plus, X, Copy, FileText, RefreshCw, Twitter, Menu, Check, Sparkles } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { User, CV } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import VectorLogo from "@/assets/Vector.svg";
import uploadPlaceholder from "@/assets/upload_profile_placeholder.png";
import { ProfileUpdatedDialog } from "@/components/dialogs/ProfileUpdatedDialog";
import StepIndicator from "@/components/ui/StepIndicator";
import profileSuccessMobile from "@/assets/popup-completed-success-v3.png";

const XIcon = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const TikTokIcon = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

export default function JobSeekerProfileCompletion() {
    const { updateProfile, user } = useUser();
    const [logoPreview, setLogoPreview] = useState(user?.profile_picture || null);
    const [activeSocial, setActiveSocial] = useState('website');
    const [socialLinks, setSocialLinks] = useState(user?.social_links || {});
    const [cvData, setCvData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cvLoading, setCvLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    // Check if onboarding is already completed
    useEffect(() => {
        const forceOnboarding = searchParams.get('onboarding') === 'true';
        if (user?.is_onboarding_completed && !forceOnboarding) {
            navigate(createPageUrl('Dashboard'), { replace: true });
        }
    }, [user, navigate, searchParams]);

    // Prevent browser back navigation
    useEffect(() => {
        // Push a new state to history to create a "buffer" that traps the back button
        window.history.pushState(null, "", window.location.pathname);

        const handlePopState = (event) => {
            // Prevent leaving the page
            window.history.pushState(null, "", window.location.pathname);
            toast({ title: "לא ניתן לחזור אחורה בשלב זה", variant: "destructive" });
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    useEffect(() => {
        const loadCV = async () => {
            try {
                const cvs = await CV.filter({ user_email: user?.email });
                if (cvs && cvs.length > 0) {
                    setCvData(cvs[0]);
                }
            } catch (error) {
                console.error("Error loading CV:", error);
            } finally {
                setCvLoading(false);
            }
        };
        if (user?.email) {
            loadCV();
        }
    }, [user]);

    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoading(true);
            try {
                // Upload logic
                const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const { publicUrl, file_url } = await UploadFile({
                    file,
                    bucket: 'public-files', // Or 'avatars' if available
                    path: `avatars/${Date.now()}-${cleanFileName}`
                });
                const finalUrl = publicUrl || file_url;

                setLogoPreview(finalUrl);
                await updateProfile({ profile_picture: finalUrl });

                toast({ title: "תמונת פרופיל עודכנה בהצלחה" });

            } catch (error) {
                console.error("Error uploading logo:", error);
                toast({ title: "שגיאה בהעלאת תמונה", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSocialLinkChange = (socialId, value) => {
        const updatedLinks = { ...socialLinks, [socialId]: value };
        setSocialLinks(updatedLinks);
        // Debounce update or update on finish? Better update on finish or blur.
        // For now, we update state, and will save on finish.
    };

    // Save social links when user leaves the input or clicks finish
    const saveSocials = async () => {
        try {
            await updateProfile({ social_links: socialLinks });
        } catch (e) {
            console.error(e);
        }
    }

    const toggleSocialInput = (id) => {
        setActiveSocial(id);
    };

    const handleFinishClick = async () => {
        setLoading(true);
        try {
            await saveSocials();
            // Mark onboarding as completed
            await updateProfile({ is_onboarding_completed: true });
            setShowSuccess(true);
        } catch (error) {
            console.error("Error saving profile:", error);
            toast({ title: "שגיאה בשמירת הפרופיל", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleReplaceCV = () => {
        // Navigate back to upload step
        const isOnboarding = searchParams.get('onboarding') === 'true';
        navigate(`/CVGenerator?choice=upload&step=-1${isOnboarding ? '&onboarding=true' : ''}`);
    };

    const socialIcons = [
        { id: 'website', icon: Globe, label: 'אתר' },
        { id: 'facebook', icon: Facebook, label: 'פייסבוק' },
        { id: 'instagram', icon: Instagram, label: 'אינסטגרם' },
        { id: 'linkedin', icon: Linkedin, label: 'לינקדאין' },
        { id: 'twitter', icon: XIcon, label: 'X' },
    ];

    return (
        <div className={`min-h-screen flex flex-col items-center pt-2 p-4 md:pt-2 relative transition-colors duration-300 ${showSuccess ? 'bg-[#dbecf3]' : 'bg-transparent'}`} dir="rtl">
            {/* Mobile Background Gradient - Only Top 25% */}
            {!showSuccess && (
                <div className="absolute top-0 left-0 right-0 h-[15vh] bg-gradient-to-b from-[#dbecf3] to-transparent md:hidden opacity-100 pointer-events-none" />
            )}

            {/* Mobile Header - Pill Shape */}
            <div className="w-full px-2 pt-1 pb-2 md:hidden sticky top-0 z-10">
                <div className="bg-[#e0eef5]/90 backdrop-blur-md border border-white/40 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
                    <button className="text-[#001d3d] p-1">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-1">
                        <p className="font-['Poppins',_sans-serif] text-2xl text-[#001d3d] font-light pt-0.5 tracking-tight">Metch</p>
                        <img src={VectorLogo} alt="Metch Logo" className="w-3.5 h-3.5 object-contain" />
                    </div>
                </div>
            </div>



            {showSuccess ? (
                <div className="flex-1 flex flex-col justify-center w-full items-center py-6 md:py-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-[98%] max-w-sm relative z-[1] flex flex-col items-center"
                    >
                        {/* The Image provided by the user */}
                        <img
                            src={profileSuccessMobile}
                            alt="הפרופיל הושלם בהצלחה"
                            className="w-full h-auto object-contain pointer-events-none"
                        />

                        {/* Invisible Clickable Area for the button in the image */}
                        <button
                            onClick={() => navigate(createPageUrl('Dashboard?onboarding=complete'), { replace: true })}
                            className="absolute bottom-[18%] w-[65%] h-[12%] bg-transparent cursor-pointer rounded-full z-10 outline-none"
                            aria-label="לעמוד הראשי"
                        />
                    </motion.div>
                </div>
            ) : (
                <>
                    {/* Mobile Header - Outside the card, Title then Progress */}
                    <div className="md:hidden w-full flex flex-col items-center mb-6 px-4">
                        <h1 className="text-2xl font-bold text-[#1e293b] mb-4">השלם את הפרופיל שלך</h1>
                        <StepIndicator totalSteps={5} currentStep={5} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[30px] md:rounded-[2rem] w-[calc(100%-1.5rem)] md:w-[95%] md:max-w-none pt-6 pb-2 px-6 md:pt-4 md:pb-12 md:px-12 text-center relative z-[1] mt-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] md:shadow-none border border-gray-100 md:border-none mx-3 md:mx-auto"
                    >
                        {/* Desktop Header - Inside, Progress then Title */}
                        <div className="hidden md:block w-full mb-8 pt-2">
                            <StepIndicator totalSteps={5} currentStep={5} />
                            <h1 className="text-3xl font-bold text-[#1e293b] mt-2">השלם את הפרופיל שלך</h1>
                        </div>

                        {/* Profile Image - More Compact */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden cursor-pointer relative">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Profile" className="w-full h-full object-cover rounded-full border-2 border-blue-100" />
                                    ) : (
                                        <img src={uploadPlaceholder} alt="Upload Profile" className="w-full h-full object-contain" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={handleLogoChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-500 mb-8 text-sm md:text-base leading-relaxed max-w-[240px] mx-auto md:max-w-none">
                            פרופיל מלא מעלה את סיכוי ההשמה
                        </p>


                        {/* Social Icons - Compact */}
                        <div className="flex justify-center gap-3 mb-6">
                            {socialIcons.map((social) => {
                                const Icon = social.icon;
                                const hasValue = socialLinks[social.id] && socialLinks[social.id].length > 0;
                                const isActive = activeSocial === social.id;

                                return (
                                    <button
                                        key={social.id}
                                        onClick={() => toggleSocialInput(social.id)}
                                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isActive ? 'border-blue-500 text-blue-500' :
                                            hasValue ? 'border-green-500 text-green-500' : 'border-gray-200 text-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Social Input - Compact */}
                        <div className="mb-6 max-w-md mx-auto relative w-full">
                            <Input
                                placeholder="הוספת קישור"
                                value={socialLinks[activeSocial] || ''}
                                onChange={(e) => handleSocialLinkChange(activeSocial, e.target.value)}
                                onBlur={saveSocials}
                                className="text-right h-10 rounded-xl bg-white border-gray-200 pl-10 text-sm shadow-sm focus:border-blue-400 transition-all"
                                dir="ltr"
                            />
                            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-500">
                                <Copy className="w-4 h-4" />
                            </div>
                        </div>


                        {/* CV Preview Card - Match Width to Social Input (max-w-md) & Compact */}
                        {cvData && (
                            <div className="mb-4 max-w-md mx-auto w-full rounded-xl p-3 flex items-center justify-between bg-white shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-red-500 p-1.5 rounded-lg">
                                        <span className="text-white font-bold text-[10px]">PDF</span>
                                    </div>
                                    <div className="text-right truncate flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate text-sm leading-tight" title={cvData.file_name}>{cvData.file_name}</p>
                                        <p className="text-gray-400 text-[10px] leading-tight">{new Date(cvData.last_modified || Date.now()).toLocaleDateString()} • {cvData.file_size_kb || 0} Kb</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs h-8 px-2" onClick={handleReplaceCV}>
                                    <RefreshCw className="w-3 h-3" />
                                    החלפת קובץ
                                </Button>
                            </div>
                        )}
                        {!cvData && !cvLoading && (
                            <div className="mb-8 max-w-md mx-auto w-full">
                                <Button variant="outline" onClick={handleReplaceCV} className="w-full text-sm h-10">
                                    לא נמצא קובץ קו"ח. לחץ להעלאה.
                                </Button>
                            </div>
                        )}




                        {/* Finish Button - Inside Card on Desktop Only */}
                        <div className="hidden md:block max-w-md mx-auto w-full mt-12 px-0">
                            <Button
                                className="w-full h-12 rounded-full text-lg font-bold bg-[#2987cd] hover:bg-[#1f6ba8] shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                                onClick={handleFinishClick}
                                disabled={loading}
                            >
                                {loading ? <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin"></div> : "סיום"}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Finish Button - Outside Card on Mobile Only */}
                    <div className="md:hidden max-w-md mx-auto w-full mt-8 px-4">
                        <Button
                            className="w-full h-12 rounded-full text-lg font-bold bg-[#2987cd] hover:bg-[#1f6ba8] shadow-lg shadow-blue-100"
                            onClick={handleFinishClick}
                            disabled={loading}
                        >
                            {loading ? <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin"></div> : "סיום"}
                        </Button>
                    </div>
                </>
            )}

        </div>
    );
}
