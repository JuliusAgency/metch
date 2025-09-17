

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  User,
  Settings,
  Bell,
  MessageSquareText,
  Home,
  Sparkle,
  Headphones,
  CreditCard,
  Briefcase,
  TrendingUp,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, switchUserType } = useUser();

  const handleSwitchUserType = async () => {
    await switchUserType();
    // Navigate to dashboard to show the correct view
    navigate(createPageUrl("Dashboard"));
  };

  if (loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isJobSeeker = user?.user_type === 'job_seeker';

  return (
    <div className="min-h-screen page-gradient" dir="rtl">
      <style>
        {`
          :root {
            --primary-blue: #007BFF;
            --success-green: #28A745;
            --warning-yellow: #FFC107;
            --page-gradient: linear-gradient(180deg, #DBECF3 12.35%, #FFFFFF 32.34%, #FFFFFF 100%);
          }
          
          * {
            font-family: 'Assistant', 'Heebo', -apple-system, system-ui, sans-serif;
          }
          
          .page-gradient {
            background: var(--page-gradient);
          }
          
          .navbar-custom {
            background-color: transparent;
            backdrop-filter: blur(10px);
          }
        `}
      </style>

      {/* Debug Button - Outside Navbar */}
      <div className="fixed top-4 left-4 z-[60]">
        <Button 
          onClick={handleSwitchUserType}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105"
        >
          DEMO: {isJobSeeker ? '👤 מחפש עבודה' : '🏢 מעסיק'}
        </Button>
      </div>

      {/* Navbar Wrapper */}
      <div className="pt-6 sticky top-0 z-50">
        <header className="navbar-custom w-[85vw] mx-auto rounded-full shadow-lg border border-white/20">
          <div className="flex flex-row-reverse items-center justify-between px-8 py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Sparkle className="w-6 h-6 text-gray-800" />
              <h1 className="text-gray-800 text-base font-light">Metch</h1>
            </div>

            {/* Icons - Different for Job Seekers vs Employers */}
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-4 py-3 text-base">
                <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                  {currentPageName === 'Dashboard' && <span className="font-medium text-gray-700">דף הבית</span>}
                  <Home className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              {/* Job Seeker Specific Navigation */}
              {isJobSeeker && (
                <>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-4 py-3 text-base">
                    <Link to={createPageUrl("JobSearch")} className="flex items-center gap-2">
                      {currentPageName === 'JobSearch' && <span className="font-medium text-gray-700">חיפוש משרות</span>}
                      <Search className="w-6 h-6 text-gray-700" />
                    </Link>
                  </Button>
                  <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
                </>
              )}
              
              {/* Employer Specific Navigation */}
              {!isJobSeeker && (
                <>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-4 py-3 text-base">
                    <Link to={createPageUrl("JobManagement")} className="flex items-center gap-2">
                      {currentPageName === 'JobManagement' && <span className="font-medium text-gray-700">ניהול משרות</span>}
                      <Briefcase className="w-6 h-6 text-gray-700" />
                    </Link>
                  </Button>
                  <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
                </>
              )}
              
              {/* Profile link - different for each user type */}
              <Button asChild variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <Link to={createPageUrl(isJobSeeker ? "Profile" : "CompanyProfileCompletion")}>
                  <User className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-4 py-3 text-base">
                <Link to={createPageUrl("Notifications")} className="flex items-center gap-2">
                  {currentPageName === 'Notifications' && <span className="font-medium text-gray-700">התראות</span>}
                  <Bell className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <CreditCard className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              {/* Settings icon - always links to the generic Settings page */}
              <Button asChild variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <Link to={createPageUrl("Settings")}>
                  <Settings className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-4 py-3 text-base">
                <Link to={createPageUrl(isJobSeeker ? "MessagesSeeker" : "Messages")} className="flex items-center gap-2">
                  {(currentPageName === 'Messages' || currentPageName === 'MessagesSeeker') && <span className="font-medium text-gray-700">הודעות</span>}
                  <MessageSquareText className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
              <div className="h-8 w-px bg-slate-400/50 mx-2"></div>
              
              <Button asChild variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <Link to={createPageUrl("Contact")}>
                  <Headphones className="w-6 h-6 text-gray-700" />
                </Link>
              </Button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

