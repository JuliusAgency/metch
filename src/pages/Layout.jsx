
import React, { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { NavButton } from "@/components/layout/NavButton";
import { createPageUrl } from "@/utils";
import {
  User,
  Settings,
  Bell,
  MessageSquareText,
  Home,
  Headphones,
  CreditCard,
  Briefcase,
  TrendingUp,
  Search,
  HelpCircle,
  BarChart2,
  Menu,
  X,
  FileText,
  Sparkles,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User as UserEntity } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/UserContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, unreadCount, unreadMessagesCount } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsLogoHovered(false);
      navigate('/Login'); // Or Landing, but Login is standard
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Check for ?onboarding=true AND localStorage
  // MOVED TO TOP to avoid "Rendered more hooks than during the previous render" error
  /* eslint-disable-next-line no-unused-vars */
  const [searchParams] = useSearchParams();

  // Trigger Onboarding Mode if:
  // 1. ?onboarding=true is present
  // 2. OR we are on CVGenerator and ?choice is present (indicates initial flow from UserTypeSelection)
  const isCVGenWithChoice = currentPageName === 'CVGenerator' && searchParams.get('choice');

  if (searchParams.get('onboarding') === 'true' || isCVGenWithChoice) {
    localStorage.setItem('onboarding_active', 'true');
  }

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Pages that should not show navbar (authentication pages)
  const authPages = ['Login', 'Register', 'Landing', 'EmailConfirmation', 'UserTypeSelection', 'ForgotPassword'];
  const shouldHideNavbar = authPages.includes(currentPageName);

  if (loading && !user) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center" dir="rtl">
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If it's an auth page, render children without navbar
  if (shouldHideNavbar) {
    return (
      <div className="min-h-screen" dir="rtl">
        {children}
      </div>
    );
  }

  const isJobSeeker = user?.user_type === 'job_seeker';

  // Define navLinks array for dynamic rendering in mobile menu
  let navLinks = [];

  if (isJobSeeker) {
    // 1-7 Order for Job Seeker specified by user
    navLinks = [
      { page: "Dashboard", icon: Home, text: "דף הבית" },

      { page: "Settings", icon: User, text: "פרטים אישיים" }, // My Details
      { page: "Profile", icon: FileText, text: "קו״ח" }, // My CV
      { page: "Insights", icon: Sparkles, text: "תובנות" }, // Insights (Icon changed to Sparkles)
      { page: "MessagesSeeker", icon: MessageSquareText, text: "הודעות" },
      { page: "Notifications", icon: Bell, text: "התראות" },
      { page: "FAQ", icon: HelpCircle, text: "שאלות נפוצות" },
      { page: "Contact", icon: Headphones, text: "יצירת קשר" }
    ];
  } else {
    // Existing Employer Order
    navLinks = [
      { page: "Dashboard", icon: Home, text: "דף הבית" },
      { page: "JobManagement", icon: Briefcase, text: "משרות" },
      { page: "Statistics", icon: BarChart2, text: "סטטיסטיקות" },
      { page: "Notifications", icon: Bell, text: "התראות" },
      { page: "Payments", icon: CreditCard, text: "תשלומים" },
      { page: "Settings", icon: Settings, text: "הגדרות" },
      { page: "Messages", icon: MessageSquareText, text: "הודעות" },
      { page: "FAQ", icon: HelpCircle, text: "שאלות נפוצות" },
      { page: "Contact", icon: Headphones, text: "צור קשר" }
    ];
  }

  // MobileNavLink component to render individual links in the mobile menu
  const MobileNavLink = ({ page, icon: Icon, text, isPlaceholder }) => {
    // Determine if the current page matches this link's target for active styling
    const isActive =
      (currentPageName === page) ||
      (page === "Profile" && currentPageName === "Profile") ||
      (page === "MessagesSeeker" && currentPageName === "MessagesSeeker") ||
      (page === "Messages" && currentPageName === "Messages");

    const linkClass = `flex items-center gap-4 p-3 rounded-lg text-lg font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`;
    const iconClass = `w-7 h-7 ${isActive ? 'text-blue-600' : 'text-gray-600'}`;

    if (isPlaceholder) {
      return (
        <div key={page} className="flex items-center gap-4 p-3 rounded-lg text-lg font-medium text-gray-400 cursor-not-allowed">
          <Icon className="w-7 h-7" />
          <span>{text}</span>
        </div>
      );
    }

    return (
      <Link to={createPageUrl(page)} onClick={closeMenu} className={linkClass}>
        <Icon className={iconClass} />
        <span>{text}</span>
      </Link>
    );
  };

  // Pages that can run in "onboarding mode" (hidden header)
  const onboardingPages = ['CVGenerator', 'PreferenceQuestionnaire', 'CreateJob', 'CareerStageSelection', 'careerstageselection', 'JobSeekerProfileCompletion'];
  const isOnboardingActive = localStorage.getItem('onboarding_active') === 'true';

  // Hide header if it's an auth page OR (it's an onboarding page AND we are in onboarding mode) OR specific onboarding query param exists
  const isSettingsOnboarding = currentPageName === 'Settings' && searchParams.get('onboarding') === 'company_details';
  // Check if we are in Settings, Profile, or Notifications as a job seeker to enable mobile full-width redesign
  const isJobSeekerMobileFlow = (currentPageName === 'Settings' || currentPageName === 'Profile' || currentPageName === 'JobDetailsSeeker' || currentPageName === 'Notifications' || currentPageName === 'Messages' || currentPageName === 'MessagesSeeker' || currentPageName === 'FAQ' || currentPageName === 'Contact' || currentPageName === 'Insights');

  const shouldHideHeader = authPages.includes(currentPageName) || (onboardingPages.includes(currentPageName) && isOnboardingActive) || isSettingsOnboarding || currentPageName === 'CompanyProfileCompletion' || currentPageName === 'JobSeekerProfileCompletion';

  const isFullWidthPage = currentPageName === 'CreateJob' || currentPageName === 'CandidateProfile' || currentPageName === 'Payments' || currentPageName === 'JobManagement' || currentPageName === 'Statistics' || currentPageName === 'Notifications' || currentPageName === 'JobDetails' || onboardingPages.includes(currentPageName);

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden ${currentPageName === 'Dashboard' ? 'bg-[linear-gradient(180deg,#dcedf4_0%,#dcedf4_20%,#FFFFFF_100%)] md:[background:var(--page-gradient)]' : 'page-gradient'}`} dir="rtl">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');

          :root {
            --primary-blue: #007BFF;
            --success-green: #28A745;
            --warning-yellow: #FFC107;
            --page-gradient: linear-gradient(180deg, #dbedf3 0%, #ffffff 20%);
          }

          * {
            font-family: 'Rubik', sans-serif;
          }
          
          .metch-logo-font {
            font-family: 'Poppins', sans-serif;
          }

          .page-gradient {
            background: var(--page-gradient);
          }

          .navbar-custom {
            background: rgba(221, 238, 244, 0.4); /* #ddeef4 with 40% opacity */
            backdrop-filter: blur(4px) saturate(180%);
          }
        `}
      </style>

      {/* Desktop Navbar Wrapper */}
      {!shouldHideHeader && (
        <div className="hidden md:block pt-[20px] sticky top-0 z-50 pointer-events-none">
          <header className="navbar-custom w-[75%] md:w-[68%] max-w-7xl mx-auto rounded-full shadow-md border border-white/60 pointer-events-auto transition-all duration-300">
            <div className="flex items-center justify-between px-4 lg:px-8 py-3.5">
              {/* Icons - Moved to be first for RTL rendering on the right */}
              <div className="flex items-center gap-1">
                {/* 1. Home (Both) */}
                <NavButton
                  to={createPageUrl("Dashboard")}
                  icon={Home}
                  text="דף הבית"
                  isActive={currentPageName === 'Dashboard'}
                />
                <div className="h-6 w-px bg-white/50 mx-1"></div>

                {/* Job Seeker Navigation (Strict 1-7 Order) */}
                {isJobSeeker && (
                  <>
                    {/* 2. My Details (Settings) */}
                    <NavButton
                      to={createPageUrl("Settings")}
                      icon={User}
                      text="פרטים אישיים" // Was "ניהול הפרטים שלי" in title, simplified to text here to match prev
                      isActive={currentPageName === 'Settings'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* 3. My CV (Profile) */}
                    <NavButton
                      to={createPageUrl("Profile")}
                      icon={FileText}
                      text="קו״ח"
                      isActive={currentPageName === 'Profile'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* 4. Insights (Sparkles icon) */}
                    <NavButton
                      to={createPageUrl("Insights")}
                      icon={Sparkles}
                      text="תובנות"
                      isActive={currentPageName === 'Insights'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* 5. Messages */}
                    <NavButton
                      to={createPageUrl("MessagesSeeker")}
                      icon={MessageSquareText}
                      text="הודעות"
                      isActive={currentPageName === 'MessagesSeeker'}
                      badge={unreadMessagesCount > 0}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* Notifications */}
                    <NavButton
                      to={createPageUrl("Notifications")}
                      icon={Bell}
                      text="התראות"
                      isActive={currentPageName === 'Notifications'}
                      badge={unreadCount > 0}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* 6. FAQ */}
                    <NavButton
                      to={createPageUrl("FAQ")}
                      icon={HelpCircle}
                      text="שאלות נפוצות"
                      isActive={currentPageName === 'FAQ'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    {/* 7. Contact */}
                    <NavButton
                      to={createPageUrl("Contact")}
                      icon={Headphones}
                      text="יצירת קשר"
                      isActive={currentPageName === 'Contact'}
                    />
                  </>
                )}

                {/* Employer Specific Navigation (Existing Logic Preserved) */}
                {!isJobSeeker && (
                  <>
                    <NavButton
                      to={createPageUrl("JobManagement")}
                      icon={Briefcase}
                      text="משרות"
                      isActive={currentPageName === 'JobManagement'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Statistics")}
                      icon={BarChart2}
                      text="סטטיסטיקות"
                      isActive={currentPageName === 'Statistics'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Notifications")}
                      icon={Bell}
                      text="התראות"
                      isActive={currentPageName === 'Notifications'}
                      badge={unreadCount > 0}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Payments")}
                      icon={CreditCard}
                      text="תשלומים"
                      isActive={currentPageName === 'Payments'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Settings")}
                      icon={Settings}
                      text="הגדרות"
                      isActive={currentPageName === 'Settings'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Messages")}
                      icon={MessageSquareText}
                      text="הודעות"
                      isActive={currentPageName === 'Messages'}
                      badge={unreadMessagesCount > 0}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("FAQ")}
                      icon={HelpCircle}
                      text="שאלות נפוצות"
                      isActive={currentPageName === 'FAQ'}
                    />
                    <div className="h-6 w-px bg-white/50 mx-1"></div>

                    <NavButton
                      to={createPageUrl("Contact")}
                      icon={Headphones}
                      text="קשר"
                      isActive={currentPageName === 'Contact'}
                    />
                  </>
                )}
              </div>

              {/* Logo */}
              {/* Logo with Logout on Hover */}
              <div
                className="flex items-center cursor-pointer w-[140px] h-6 justify-end relative"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isLogoHovered ? (
                    <motion.button
                      key="logout"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-900 hover:text-gray-700 whitespace-nowrap"
                    >
                      <span className="text-lg font-medium">התנתקות</span>
                      <LogOut className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="logo"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <h1 className="text-gray-800 text-[26px] metch-logo-font leading-none">Metch</h1>
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/4654a1b94_image.png"
                        alt="Metch Logo"
                        className="h-4"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        </div>
      )}

      {/* Mobile Navbar (Expandable Toolbar) */}
      {!shouldHideHeader && (
        <div className="md:hidden fixed top-4 left-0 right-0 z-50 h-[54px] px-4 w-full monitor-fixed-header">
          <motion.div
            initial={false}
            animate={isMobileMenuOpen ? "open" : "closed"}
            variants={{
              closed: { height: 54, backgroundColor: "rgba(255, 255, 255, 0.3)", borderRadius: 50 },
              open: { height: "auto", backgroundColor: "rgba(235, 245, 250, 0.95)", borderRadius: 32 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`border-2 border-white shadow-sm overflow-hidden backdrop-blur-md relative mx-auto w-full ${isMobileMenuOpen ? 'border-[0.5px]' : ''}`}
            dir="rtl"
          >
            {/* Header Row: Always Visible (but changes content/icon) */}
            <div className="flex items-center justify-between px-4 h-[54px] w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-transparent -mr-2"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-8 h-8 text-[#1A1A1A]" strokeWidth={1.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-8 h-8 text-gray-800" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              <div className="flex items-center gap-2 select-none">
                <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
                  <h1 className="text-gray-800 text-2xl metch-logo-font">Metch</h1>
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/4654a1b94_image.png" alt="Metch Logo" className="h-4 mb-0.5" />
                </Link>
              </div>
            </div>

            {/* Expanded Menu Content */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.nav
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-start px-8 pb-8 gap-5"
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-[19px] font-medium text-[#4A5568] hover:text-[#2B6CB0] transition-colors w-full text-right"
                    >
                      <link.icon className="w-5 h-5" strokeWidth={1.5} />
                      {link.text}
                    </Link>
                  ))}

                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="flex items-center gap-3 text-[19px] font-medium text-[#4A5568] hover:text-red-500 transition-colors w-full text-right mt-2"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    התנתקות
                  </button>
                </motion.nav>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )
      }

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 md:hidden bg-black/10 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <main className={`flex-1 flex justify-center w-full mb-4 ${shouldHideHeader ? 'mt-0 md:mt-4' : ((isFullWidthPage || currentPageName === 'Dashboard' || currentPageName === 'Packages') ? 'mt-24 md:mt-4' : (isJobSeekerMobileFlow ? 'mt-[90px] md:mt-[18px]' : 'mt-[90px]'))} ${isFullWidthPage ? 'px-0' : (isJobSeekerMobileFlow ? 'px-0 md:px-2' : 'px-2')}`}>
        {(isFullWidthPage || (isJobSeekerMobileFlow && (typeof window !== 'undefined' ? window.innerWidth < 768 : false))) ? (
          <div className="w-full h-full">
            {children}
          </div>
        ) : (
          <Card className={`w-full max-w-[99%] shadow-[0_15px_40px_rgba(0,0,0,0.08)] md:shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-gray-100 rounded-[50px] min-h-[92vh] overflow-hidden relative backdrop-blur-sm ${currentPageName === 'Dashboard' ? 'bg-white md:bg-white/99 md:shadow-[0_30px_70px_rgba(0,0,0,0.18)] border md:border-gray-100 rounded-[32px] md:rounded-[50px] max-w-[94%] md:max-w-[99%] mx-auto md:mx-0' : 'bg-white/90'}`}>
            <div className="h-full">
              {children}
            </div>
          </Card>
        )}
      </main>
    </div >
  );
}
