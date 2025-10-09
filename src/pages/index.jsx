import Layout from "./Layout.jsx";

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

import JobSearch from "./JobSearch";

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
    
    JobSearch: JobSearch,
    
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
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/CandidateProfile" element={<CandidateProfile />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/ViewQuestionnaire" element={<ViewQuestionnaire />} />
                
                <Route path="/JobManagement" element={<JobManagement />} />
                
                <Route path="/JobDetails" element={<JobDetails />} />
                
                <Route path="/JobApplications" element={<JobApplications />} />
                
                <Route path="/CreateJob" element={<CreateJob />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Insights" element={<Insights />} />
                
                <Route path="/CompanyProfileCompletion" element={<CompanyProfileCompletion />} />
                
                <Route path="/JobSearch" element={<JobSearch />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/AnswerQuestionnaire" element={<AnswerQuestionnaire />} />
                
                <Route path="/ScreeningQuestionnaire" element={<ScreeningQuestionnaire />} />
                
                <Route path="/JobDetailsSeeker" element={<JobDetailsSeeker />} />
                
                <Route path="/MessagesSeeker" element={<MessagesSeeker />} />
                
                <Route path="/UserActivity" element={<UserActivity />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/NotFound" element={<NotFound />} />
                
                <Route path="/CVGenerator" element={<CVGenerator />} />
                
                <Route path="/PreferenceQuestionnaire" element={<PreferenceQuestionnaire />} />
                
            </Routes>
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