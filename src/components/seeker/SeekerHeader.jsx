import { Link } from "react-router-dom";
import { ChevronRight, Building2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const SeekerHeader = ({ company, job, returnUrl }) => {
  const fallbackUrl = job ? `${createPageUrl("Dashboard")}#job-${job.id}` : createPageUrl("Dashboard");
  const targetUrl = returnUrl || fallbackUrl;

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          backgroundImage: `url(${settingsHeaderBg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: '-1',
        }}
      />

      <Link
        to={targetUrl}
        className="absolute top-4 right-4 w-9 h-9 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-[60]"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" />
      </Link>
      <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white mx-auto -mt-4 mb-2">
        {job?.company === "Google" ? (
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-8 h-8" />
        ) : (
          <Building2 className="w-8 h-8 text-gray-600" />
        )}
      </div>
    </>
  );
};

export default SeekerHeader;
