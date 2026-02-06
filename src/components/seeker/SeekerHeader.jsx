import { Link } from "react-router-dom";
import { ChevronRight, Building2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";

const SeekerHeader = ({ company, job, returnUrl }) => {
  const fallbackUrl = job ? `${createPageUrl("Dashboard")}#job-${job.id}` : createPageUrl("Dashboard");
  const targetUrl = returnUrl || fallbackUrl;

  return (
    <>
      {/* DESKTOP BACKGROUND ONLY */}
      <div
        className="hidden md:block absolute top-0 left-0 right-0 h-32"
        style={{
          backgroundImage: `url(${settingsHeaderBg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: '-1',
        }}
      />

      {/* Back button visible on both mobile and desktop */}
      <Link
        to={targetUrl}
        className="hidden md:flex absolute top-[-65px] md:top-4 right-2 md:right-4 w-9 h-9 bg-white rounded-full items-center justify-center shadow-md hover:bg-gray-50 transition-colors z-[60]"
      >
        <ChevronRight className="w-5 h-5 text-blue-500" />
      </Link>
      <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white mx-auto mt-0 md:-mt-4 mb-4 relative z-10">
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
