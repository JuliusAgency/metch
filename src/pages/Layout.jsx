

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Menu, // Added
  X // Added
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User as UserEntity } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion"; // Added

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Added

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await UserEntity.me();
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated, using demo mode");
      // Set default demo user for non-authenticated users
      setUser({
        user_type: 'employer',
        full_name: 'רפאל (דוגמה)',
        email: 'demo@example.com',
        isDemo: true
      });
    } finally {
      setLoading(false);
    }
  };

  const switchUserType = async () => {
    const newUserType = user?.user_type === 'employer' ? 'job_seeker' : 'employer';
    const newUser = {
      ...user,
      user_type: newUserType,
      full_name: newUserType === 'job_seeker' ? 'דניאל (מחפש עבודה)' : 'רפאל (מעסיק)',
      isDemo: true
    };

    // Update local state immediately
    setUser(newUser);

    // Try to update in database only if not demo user
    if (!user?.isDemo) {
      try {
        await UserEntity.updateMyUserData({ user_type: newUserType });
      } catch (error) {
        console.log("Could not update user type in database");
      }
    }

    // Navigate to dashboard to show the correct view
    navigate(createPageUrl("Dashboard"));

    // Force a small delay to ensure state is updated
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  const closeMenu = () => setIsMobileMenuOpen(false); // Added

  if (loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isJobSeeker = user?.user_type === 'job_seeker';
  
  // Define navLinks array for dynamic rendering in mobile menu
  const navLinks = [
    { page: "Dashboard", icon: Home, text: "דף הבית", both: true },
    { page: "JobSearch", icon: Search, text: "חיפוש", seeker: true },
    { page: "Insights", icon: TrendingUp, text: "תובנות", seeker: true },
    { page: "JobManagement", icon: Briefcase, text: "משרות", employer: true },
    { page: isJobSeeker ? "Profile" : "CompanyProfileCompletion", icon: User, text: "פרופיל", both: true },
    { page: "Notifications", icon: Bell, text: "התראות", both: true },
    { page: "CreditCard", icon: CreditCard, text: "תשלומים", both: true, isPlaceholder: true },
    { page: "Settings", icon: Settings, text: "הגדרות", both: true },
    { page: isJobSeeker ? "MessagesSeeker" : "Messages", icon: MessageSquareText, text: "הודעות", both: true },
    { page: "Contact", icon: Headphones, text: "צור קשר", both: true },
    { page: "FAQ", icon: HelpCircle, text: "שאלות", seeker: true }
  ];
  
  // MobileNavLink component to render individual links in the mobile menu
  const MobileNavLink = ({ page, icon: Icon, text, isPlaceholder }) => {
    // Determine if the current page matches this link's target for active styling
    const isActive = 
      (currentPageName === page) || 
      (page === (isJobSeeker ? "Profile" : "CompanyProfileCompletion") && (currentPageName === "Profile" || currentPageName === "CompanyProfileCompletion")) ||
      (page === (isJobSeeker ? "MessagesSeeker" : "Messages") && (currentPageName === "Messages" || currentPageName === "MessagesSeeker"));

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

  return (
    <div className="min-h-screen page-gradient" dir="rtl">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');

          :root {
            --primary-blue: #007BFF;
            --success-green: #28A745;
            --warning-yellow: #FFC107;
            --page-gradient: linear-gradient(180deg, #D4E5F4 0%, #ffffff 20%);
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
            background-color: transparent;
            backdrop-filter: blur(10px);
          }
        `}
      </style>

      {/* Debug Button - Moved to right for RTL */}
      <div className="fixed top-4 right-4 z-[60]">
        <Button
          onClick={switchUserType}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105"
        >
          DEMO: {isJobSeeker ? '👤 מחפש עבודה' : '🏢 מעסיק'}
        </Button>
      </div>

      {/* Desktop Navbar Wrapper */}
      <div className="hidden md:block pt-6 sticky top-0 z-50">
        <header className="navbar-custom w-[60vw] mx-auto rounded-full shadow-lg border border-white/20">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Icons - Moved to be first for RTL rendering on the right */}
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                  <Home className="w-7 h-7 text-gray-700" />
                  {currentPageName === 'Dashboard' && <span className="font-medium text-gray-700">דף הבית</span>}
                </Link>
              </Button>
              <div className="h-6 w-px bg-white/50 mx-1"></div>

              {/* Job Seeker Specific Navigation */}
              {isJobSeeker && (
                <>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                    <Link to={createPageUrl("JobSearch")} className="flex items-center gap-2">
                      <Search className="w-7 h-7 text-gray-700" />
                      {currentPageName === 'JobSearch' && <span className="font-medium text-gray-700">חיפוש</span>}
                    </Link>
                  </Button>
                  <div className="h-6 w-px bg-white/50 mx-1"></div>
                  
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                    <Link to={createPageUrl("Insights")} className="flex items-center gap-2">
                      <TrendingUp className="w-7 h-7 text-gray-700" />
                      {currentPageName === 'Insights' && <span className="font-medium text-gray-700">תובנות</span>}
                    </Link>
                  </Button>
                  <div className="h-6 w-px bg-white/50 mx-1"></div>
                </>
              )}

              {/* Employer Specific Navigation */}
              {!isJobSeeker && (
                <>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                    <Link to={createPageUrl("JobManagement")} className="flex items-center gap-2">
                      <Briefcase className="w-7 h-7 text-gray-700" />
                      {currentPageName === 'JobManagement' && <span className="font-medium text-gray-700">משרות</span>}
                    </Link>
                  </Button>
                  <div className="h-6 w-px bg-white/50 mx-1"></div>
                </>
              )}

              {/* Profile link */}
              <Button asChild variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <Link to={createPageUrl(isJobSeeker ? "Profile" : "CompanyProfileCompletion")}>
                  <User className="w-7 h-7 text-gray-700" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-white/50 mx-1"></div>

              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                <Link to={createPageUrl("Notifications")} className="flex items-center gap-2">
                  <Bell className="w-7 h-7 text-gray-700" />
                  {currentPageName === 'Notifications' && <span className="font-medium text-gray-700">התראות</span>}
                </Link>
              </Button>
              <div className="h-6 w-px bg-white/50 mx-1"></div>

              <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <CreditCard className="w-7 h-7 text-gray-700" />
              </Button>
              <div className="h-6 w-px bg-white/50 mx-1"></div>

              <Button asChild variant="ghost" size="icon" className="hover:bg-white/20 rounded-full p-3">
                <Link to={createPageUrl("Settings")}>
                  <Settings className="w-7 h-7 text-gray-700" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-white/50 mx-1"></div>

              <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                <Link to={createPageUrl(isJobSeeker ? "MessagesSeeker" : "Messages")} className="flex items-center gap-2">
                  <MessageSquareText className="w-7 h-7 text-gray-700" />
                  {(currentPageName === 'Messages' || currentPageName === 'MessagesSeeker') && <span className="font-medium text-gray-700">הודעות</span>}
                </Link>
              </Button>
              
              {!isJobSeeker && (
                  <>
                    <div className="h-6 w-px bg-white/50 mx-1"></div>
                    <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                      <Link to={createPageUrl("Contact")} className="flex items-center gap-2">
                        <Headphones className="w-7 h-7 text-gray-700" />
                        {currentPageName === 'Contact' && <span className="font-medium text-gray-700">קשר</span>}
                      </Link>
                    </Button>
                  </>
              )}
              
              {isJobSeeker && (
                <>
                  <div className="h-6 w-px bg-white/50 mx-1"></div>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                    <Link to={createPageUrl("FAQ")} className="flex items-center gap-2">
                      <HelpCircle className="w-7 h-7 text-gray-700" />
                      {currentPageName === 'FAQ' && <span className="font-medium text-gray-700">שאלות</span>}
                    </Link>
                  </Button>
                  <div className="h-6 w-px bg-white/50 mx-1"></div>
                  <Button asChild variant="ghost" className="hover:bg-white/20 rounded-full px-3 py-3 text-base">
                    <Link to={createPageUrl("Contact")} className="flex items-center gap-2">
                      <Headphones className="w-7 h-7 text-gray-700" />
                      {currentPageName === 'Contact' && <span className="font-medium text-gray-700">קשר</span>}
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <h1 className="text-gray-800 text-2xl metch-logo-font">Metch</h1>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/4654a1b94_image.png"
                alt="Metch Logo"
                className="h-6"
              />
            </div>
          </div>
        </header>
      </div>
      
      {/* Mobile Navbar */}
      <div className="md:hidden pt-4 pb-2 px-4 sticky top-0 z-40 bg-[#DBECF3]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-8 h-8 text-gray-700" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-gray-800 text-2xl metch-logo-font">Metch</h1>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/4654a1b94_image.png" alt="Metch Logo" className="h-6" />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/60 z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-[101] shadow-lg md:hidden flex flex-col"
              dir="rtl"
            >
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="font-bold text-lg text-gray-800">תפריט</h2>
                <Button variant="ghost" size="icon" onClick={closeMenu}>
                  <X className="w-7 h-7" />
                </Button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                  if (link.seeker && !isJobSeeker) return null;
                  if (link.employer && isJobSeeker) return null;
                  
                  return <MobileNavLink key={link.page} {...link} />;
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

