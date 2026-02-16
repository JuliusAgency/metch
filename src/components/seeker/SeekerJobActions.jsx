import { Globe, Linkedin, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const SeekerJobActions = ({ handleApply, applying, isUnavailable, hasExistingApplication, handleReject, hasScreeningQuestions, socialLinks }) => {
    const getButtonText = () => {
        if (hasExistingApplication) return 'מועמדות הוגשה כבר';
        if (isUnavailable) return 'משרה לא זמינה';
        if (applying) return 'שולח...';
        if (hasScreeningQuestions) return 'המשך לשאלון סינון';
        return 'הגשת מועמדות';
    };

    const isDisabled = applying || isUnavailable || hasExistingApplication;

    const hasAnyLink = socialLinks && Object.values(socialLinks).some(link => link);

    return (
        <div className="flex flex-col items-center justify-center mt-6 md:mt-10 mb-8 space-y-6">

            {/* Social Links Section */}
            {hasAnyLink && (
                <div className="flex items-center justify-center gap-4 md:gap-6 mb-2">
                    {socialLinks.twitter && (
                        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                            {/* X (Twitter) Icon */}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                            </svg>
                        </a>
                    )}
                    {socialLinks.linkedin && (
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                            <Linkedin className="w-5 h-5 md:w-6 md:h-6" />
                        </a>
                    )}
                    {socialLinks.instagram && (
                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                            <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                        </a>
                    )}
                    {socialLinks.facebook && (
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                            <Facebook className="w-5 h-5 md:w-6 md:h-6" />
                        </a>
                    )}
                    {socialLinks.website && (
                        <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                            <Globe className="w-5 h-5 md:w-6 md:h-6" />
                        </a>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center">
                {!isUnavailable && !hasExistingApplication && (
                    <Button
                        onClick={handleReject}
                        variant="outline"
                        className="w-full sm:w-auto px-12 py-3 rounded-full border-gray-300 bg-white text-gray-700 font-medium text-lg h-auto hover:bg-gray-50"
                    >
                        לא מעוניין
                    </Button>
                )}

                <Button
                    onClick={handleApply}
                    disabled={isDisabled}
                    className={`w-full sm:w-auto px-12 py-3 rounded-full font-bold text-lg h-auto ${isDisabled
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all'
                        }`}
                >
                    {getButtonText()}
                </Button>
            </div>
        </div>
    );
};

export default SeekerJobActions;