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
        className="absolute top-0 left-0 right-0 h-40"
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
        className="absolute top-6 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-20"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </Link>
      <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white mx-auto -mt-4 mb-4">
        {job?.company === "Google" ? (
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-10 h-10" />
        ) : (
          <Building2 className="w-10 h-10 text-gray-600" />
        )}
      </div>
    </>
  );
};

export default SeekerHeader;
