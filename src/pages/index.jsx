import Layout from "./Layout.jsx";
import AuthGuard from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import AccessibilityButton from "@/components/layout/AccessibilityButton";

import Dashboard from "./Dashboard";

import Profile from "./Profile";

import CandidateProfile from "./CandidateProfile";

import Messages from "./Messages";

import Notifications from "./Notifications";

import ViewQuestionnaire from "./ViewQuestionnaire";

import JobManagement from "./JobManagement";

import JobDetails from "./JobDetails";

import JobApplications from "./JobApplications";

import CreateJob from "./CreateJob";

import Contact from "./Contact";

import Insights from "./Insights";

import CompanyProfileCompletion from "./CompanyProfileCompletion";



import Settings from "./Settings";

import AnswerQuestionnaire from "./AnswerQuestionnaire";

import ScreeningQuestionnaire from "./ScreeningQuestionnaire";

import JobDetailsSeeker from "./JobDetailsSeeker";

import MessagesSeeker from "./MessagesSeeker";

import UserActivity from "./UserActivity";

import FAQ from "./FAQ";

import NotFound from "./NotFound";

import CVGenerator from "./CVGenerator";

import PreferenceQuestionnaire from "./PreferenceQuestionnaire";

import Login from "./Login";

import Register from "./Register";

import Landing from "./Landing";

import EmailConfirmation from "./EmailConfirmation";

import EmailConfirmed from "./EmailConfirmed";

import UserTypeSelection from "./UserTypeSelection";
import ForgotPassword from "./ForgotPassword";

import Payments from "./Payments";

import Statistics from "./Statistics";
import CareerStageSelection from "./CareerStageSelection";
import Packages from "./Packages";
import JobSeekerProfileCompletion from "./JobSeekerProfileCompletion";
import PaymentSuccess from "./PaymentSuccess";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {

    Dashboard: Dashboard,

    Profile: Profile,

    CandidateProfile: CandidateProfile,

    Messages: Messages,

    Notifications: Notifications,

    ViewQuestionnaire: ViewQuestionnaire,

    JobManagement: JobManagement,

    JobDetails: JobDetails,

    JobApplications: JobApplications,

    CreateJob: CreateJob,

    Contact: Contact,

    Insights: Insights,

    CompanyProfileCompletion: CompanyProfileCompletion,



    Settings: Settings,

    AnswerQuestionnaire: AnswerQuestionnaire,

    ScreeningQuestionnaire: ScreeningQuestionnaire,

    JobDetailsSeeker: JobDetailsSeeker,

    MessagesSeeker: MessagesSeeker,

    UserActivity: UserActivity,

    FAQ: FAQ,

    NotFound: NotFound,

    CVGenerator: CVGenerator,

    PreferenceQuestionnaire: PreferenceQuestionnaire,

    Login: Login,

    Register: Register,

    Landing: Landing,

    EmailConfirmation: EmailConfirmation,

    EmailConfirmed: EmailConfirmed,

    UserTypeSelection: UserTypeSelection,

    ForgotPassword: ForgotPassword,

    Statistics: Statistics,

    CareerStageSelection: CareerStageSelection,

    Payments: Payments,

    Packages: Packages,

    JobSeekerProfileCompletion: JobSeekerProfileCompletion,
    PaymentSuccess: PaymentSuccess,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Login';
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Public routes - no authentication required */}
                <Route path="/" element={<Login />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/Landing" element={<Landing />} />
                <Route path="/EmailConfirmation" element={<EmailConfirmation />} />
                <Route path="/EmailConfirmed" element={<EmailConfirmed />} />
                <Route path="/UserTypeSelection" element={<UserTypeSelection />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected routes - authentication required */}
                <Route path="/Dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/Profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/CandidateProfile" element={<AuthGuard><CandidateProfile /></AuthGuard>} />
                <Route path="/Messages" element={<AuthGuard><Messages /></AuthGuard>} />
                <Route path="/Notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
                <Route path="/ViewQuestionnaire" element={<AuthGuard><ViewQuestionnaire /></AuthGuard>} />
                <Route path="/JobManagement" element={<AuthGuard><JobManagement /></AuthGuard>} />
                <Route path="/JobDetails" element={<AuthGuard><JobDetails /></AuthGuard>} />
                <Route path="/JobApplications" element={<AuthGuard><JobApplications /></AuthGuard>} />
                <Route path="/CreateJob" element={<AuthGuard><CreateJob /></AuthGuard>} />
                <Route path="/Contact" element={<AuthGuard><Contact /></AuthGuard>} />
                <Route path="/Insights" element={<AuthGuard><Insights /></AuthGuard>} />
                <Route path="/CompanyProfileCompletion" element={<AuthGuard><CompanyProfileCompletion /></AuthGuard>} />

                <Route path="/Settings" element={<AuthGuard><Settings /></AuthGuard>} />
                <Route path="/AnswerQuestionnaire" element={<AuthGuard><AnswerQuestionnaire /></AuthGuard>} />
                <Route path="/ScreeningQuestionnaire" element={<AuthGuard><ScreeningQuestionnaire /></AuthGuard>} />
                <Route path="/JobDetailsSeeker" element={<AuthGuard><JobDetailsSeeker /></AuthGuard>} />
                <Route path="/MessagesSeeker" element={<AuthGuard><MessagesSeeker /></AuthGuard>} />
                <Route path="/UserActivity" element={<AuthGuard><UserActivity /></AuthGuard>} />
                <Route path="/FAQ" element={<AuthGuard><FAQ /></AuthGuard>} />
                <Route path="/CVGenerator" element={<AuthGuard><CVGenerator /></AuthGuard>} />
                <Route path="/PreferenceQuestionnaire" element={<AuthGuard><PreferenceQuestionnaire /></AuthGuard>} />
                <Route path="/Statistics" element={<AuthGuard><Statistics /></AuthGuard>} />
                <Route path="/careerstageselection" element={<AuthGuard><CareerStageSelection /></AuthGuard>} />
                <Route path="/Payments" element={<AuthGuard><Payments /></AuthGuard>} />
                <Route path="/Packages" element={<AuthGuard><Packages /></AuthGuard>} />
                <Route path="/JobSeekerProfileCompletion" element={<AuthGuard><JobSeekerProfileCompletion /></AuthGuard>} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <AccessibilityButton />
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}