import {
    Facebook,
    Instagram,
    Linkedin,
} from 'lucide-react';

const XIcon = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const ProfileSocials = ({ facebook_url, instagram_url, linkedin_url, twitter_url }) => (
    <div className="flex items-center justify-center gap-4 pt-4 pb-2" dir="rtl">
        {[
            { url: facebook_url, Icon: Facebook, label: "Facebook" },
            { url: instagram_url, Icon: Instagram, label: "Instagram" },
            { url: linkedin_url, Icon: Linkedin, label: "LinkedIn" },
            { url: twitter_url, Icon: XIcon, label: "X" }
        ].map(({ url, Icon, label }, index) => (
            <a
                key={index}
                href={url || "#"}
                target={url ? "_blank" : undefined}
                rel={url ? "noopener noreferrer" : undefined}
                className={`w-14 h-14 flex items-center justify-center rounded-full border-[1.5px] transition-colors ${url ? 'border-[#2987cd] text-[#2987cd] hover:bg-blue-50' : 'border-[#2987cd] text-[#2987cd] opacity-30 cursor-default'}`}
                aria-label={label}
                onClick={e => !url && e.preventDefault()}
            >
                <Icon className="w-7 h-7" strokeWidth={1.5} />
            </a>
        ))}
    </div>
);

export default ProfileSocials;