
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { UploadCloud, Globe, Facebook, Instagram, Linkedin, Plus, X, Copy } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { UnsavedChangesDialog } from "@/components/dialogs/UnsavedChangesDialog";

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

export default function CompanyProfileFinalStep({ companyData, setCompanyData, ...props }) {
    const { updateProfile } = useUser();
    const [logoPreview, setLogoPreview] = useState(companyData?.logo_url || null);
    const [activeSocial, setActiveSocial] = useState(null);
    const [socialLinks, setSocialLinks] = useState(companyData?.social_links || {});

    // Validation state
    const [showValidationDialog, setShowValidationDialog] = useState(false);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload this file to storage here
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
            setCompanyData(prev => ({ ...prev, logo_file: file }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialLinkChange = (socialId, value) => {
        const updatedLinks = { ...socialLinks, [socialId]: value };
        setSocialLinks(updatedLinks);
        setCompanyData(prev => ({ ...prev, social_links: updatedLinks }));
    };

    const toggleSocialInput = (id) => {
        if (activeSocial === id) {
            setActiveSocial(null);
        } else {
            setActiveSocial(id);
        }
    };

    const handleFinishClick = () => {
        // Check if profile is incomplete (no description AND no social links)
        const hasDescription = companyData.company_description && companyData.company_description.trim().length > 0;
        const hasSocialLinks = Object.values(socialLinks).some(link => link && link.trim().length > 0);

        if (!hasDescription && !hasSocialLinks) {
            setShowValidationDialog(true);
        } else {
            props.onFinish();
        }
    };

    const socialIcons = [
        { id: 'website', icon: Globe, label: 'אתר' },
        { id: 'facebook', icon: Facebook, label: 'פייסבוק' },
        { id: 'instagram', icon: Instagram, label: 'אינסטגרם' },
        { id: 'linkedin', icon: Linkedin, label: 'לינקדאין' },
        { id: 'twitter', icon: XIcon, label: 'X' },
        { id: 'tiktok', icon: TikTokIcon, label: 'טיקטוק' },
    ];

    return (
        <div className="max-w-md mx-auto text-center" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
            >
                {/* Logo Upload - Round (Smaller: w-28) */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden cursor-pointer relative z-10 transition-transform duration-300 hover:scale-105`}>
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover border-4 border-white shadow-lg rounded-full" />
                            ) : (
                                <img
                                    src="/assets/images/company-logo-placeholder.png"
                                    alt="Upload Logo"
                                    className="w-full h-full object-contain"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={handleLogoChange}
                            />
                        </div>
                        {logoPreview && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setLogoPreview(null);
                                    setCompanyData(prev => ({ ...prev, logo_file: null }));
                                }}
                                className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md border hover:bg-gray-100 z-30"
                            >
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Titles (Smaller Text/Margin) */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#000080]">השלם את הפרופיל שלך</h1>
                    <p className="text-black text-base font-medium">הפרופיל המלא משפר את סיכויי ההשמה</p>
                </div>

                {/* Social Icons & Input (Tighter Gap) */}
                <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                    <div className="flex justify-center gap-3">
                        {socialIcons.map((social) => {
                            const Icon = social.icon;
                            const hasValue = socialLinks[social.id] && socialLinks[social.id].length > 0;
                            const isActive = activeSocial === social.id;

                            return (
                                <button
                                    key={social.id}
                                    type="button"
                                    onClick={() => toggleSocialInput(social.id)}
                                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 
                                        ${hasValue ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                            isActive ? 'border-blue-500 text-blue-500 ring-2 ring-blue-100' : 'border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Social Input - Placed Below */}
                    <div className="w-full h-10">
                        {activeSocial ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative"
                            >
                                <Input
                                    placeholder={`הזן קישור ל-${socialIcons.find(s => s.id === activeSocial)?.label}...`}
                                    value={socialLinks[activeSocial] || ''}
                                    onChange={(e) => handleSocialLinkChange(activeSocial, e.target.value)}
                                    className="pr-10 h-10 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-right shadow-sm bg-blue-50/30 text-sm"
                                    dir="ltr"
                                    autoFocus
                                />
                                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-blue-500">
                                    {React.createElement(socialIcons.find(s => s.id === activeSocial)?.icon, { size: 16 })}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-between px-3 h-10 text-gray-500 border border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-600 ml-auto mr-0">הוסף קישור</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description (Reduced Height) */}
                <div className="space-y-1 text-right max-w-sm mx-auto w-full">
                    <label className="text-xs font-medium text-gray-700 mr-1">תיאור החברה</label>
                    <Textarea
                        name="company_description"
                        value={companyData.company_description || ""}
                        onChange={handleInputChange}
                        placeholder="ספר/י קצת על החברה..."
                        className="min-h-[80px] rounded-xl resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                </div>

                {/* Finish Button - Compact */}
                <div className="pt-2 max-w-sm mx-auto w-full">
                    <Button
                        onClick={handleFinishClick}
                        className="w-full h-10 rounded-full bg-[#2987CD] hover:bg-[#206FA8] text-white font-bold text-lg shadow-md transition-all duration-200"
                    >
                        סיום
                    </Button>
                </div>

            </motion.div>

            {/* Validation Dialog */}
            <UnsavedChangesDialog
                open={showValidationDialog}
                onOpenChange={setShowValidationDialog}
                onConfirm={() => setShowValidationDialog(false)} // Blue button: "To Profile Completion" -> Stay
                onCancel={() => {
                    setShowValidationDialog(false);
                    props.onFinish(); // White button: "Finish" -> Proceed
                }}
            />
        </div>
    );
}
