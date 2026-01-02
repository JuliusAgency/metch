
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { UploadCloud, Globe, Facebook, Instagram, Linkedin, Twitter, Plus, X, Copy } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function CompanyProfileFinalStep({ companyData, setCompanyData, ...props }) {
    const { updateProfile } = useUser();
    const [logoPreview, setLogoPreview] = useState(companyData?.logo_url || null);
    const [activeSocial, setActiveSocial] = useState(null);
    const [socialLinks, setSocialLinks] = useState(companyData?.social_links || {});

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

    const socialIcons = [
        { id: 'website', icon: Globe, label: 'אתר' },
        { id: 'facebook', icon: Facebook, label: 'פייסבוק' },
        { id: 'instagram', icon: Instagram, label: 'אינסטגרם' },
        { id: 'linkedin', icon: Linkedin, label: 'לינקדאין' },
        { id: 'twitter', icon: Twitter, label: 'טוויטר' },
    ];

    return (
        <div className="max-w-lg mx-auto text-center" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
            >
                {/* Logo Upload - Round */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className={`w-36 h-36 rounded-full flex items-center justify-center overflow-hidden cursor-pointer relative z-10 transition-transform duration-300 hover:scale-105`}>
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
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Titles */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-[#000080]">השלם את הפרופיל שלך</h1>
                    <p className="text-black text-lg font-medium">הפרופיל המלא משפר את סיכויי ההשמה</p>
                </div>

                {/* Social Icons & Input */}
                <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
                    <div className="flex justify-center gap-4">
                        {socialIcons.map((social) => {
                            const Icon = social.icon;
                            const hasValue = socialLinks[social.id] && socialLinks[social.id].length > 0;
                            const isActive = activeSocial === social.id;

                            return (
                                <button
                                    key={social.id}
                                    type="button"
                                    onClick={() => toggleSocialInput(social.id)}
                                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 
                                        ${hasValue ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                            isActive ? 'border-blue-500 text-blue-500 ring-2 ring-blue-100' : 'border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Social Input - Placed Below */}
                    <div className="w-full h-12">
                        {activeSocial ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative"
                            >
                                <Input
                                    placeholder={`הזן קישור ל${socialIcons.find(s => s.id === activeSocial)?.label}...`}
                                    value={socialLinks[activeSocial] || ''}
                                    onChange={(e) => handleSocialLinkChange(activeSocial, e.target.value)}
                                    className="pr-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-right shadow-sm bg-blue-50/30"
                                    dir="ltr"
                                    autoFocus
                                />
                                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-blue-500">
                                    {React.createElement(socialIcons.find(s => s.id === activeSocial)?.icon, { size: 18 })}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-between px-4 h-12 text-gray-500 border border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Copy className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <span className="text-base font-medium text-gray-600 ml-auto mr-0">הוסף קישור</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-right max-w-sm mx-auto w-full">
                    <label className="text-sm font-medium text-gray-700 mr-1">תיאור החברה</label>
                    <Textarea
                        name="company_description"
                        value={companyData.company_description || ""}
                        onChange={handleInputChange}
                        placeholder="ספר/י קצת על החברה, התרבות הארגונית ומה מייחד אתכם..."
                        className="min-h-[100px] rounded-2xl resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Finish Button - Only button on this screen */}
                <div className="pt-4 max-w-sm mx-auto w-full">
                    <Button
                        onClick={props.onFinish}
                        className="w-full h-12 rounded-full bg-[#2987CD] hover:bg-[#206FA8] text-white font-bold text-xl shadow-md transition-all duration-200"
                    >
                        סיום
                    </Button>
                </div>

            </motion.div>
        </div>
    );
}
