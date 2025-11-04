import {
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
} from 'lucide-react';

const ProfileSocials = ({ facebook_url, instagram_url, linkedin_url, twitter_url }) => (
    <div className="flex items-center gap-4 pt-6">
        {facebook_url && <a href={facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Facebook className="w-6 h-6 text-gray-600" /></a>}
        {instagram_url && <a href={instagram_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Instagram className="w-6 h-6 text-gray-600" /></a>}
        {linkedin_url && <a href={linkedin_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Linkedin className="w-6 h-6 text-gray-600" /></a>}
        {twitter_url && <a href={twitter_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Twitter className="w-6 h-6 text-gray-600" /></a>}
    </div>
);

export default ProfileSocials;