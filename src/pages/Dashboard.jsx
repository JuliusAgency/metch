import { useUser } from "@/contexts/UserContext";
import JobSeekerDashboard from "@/components/dashboard/JobSeekerDashboard";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import { Button } from "@/components/ui/button";

// --- MAIN DASHBOARD ROUTER ---
export default function Dashboard() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="p-8 space-y-8 flex justify-center items-center h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center" dir="rtl">נראה שאתה לא מחובר. <Button onClick={() => User.login()}>התחבר</Button></div>;
  }

  // Use user_type to decide which dashboard to render
  if (user.user_type === 'job_seeker') {
    return <JobSeekerDashboard user={user} />;
  } else {
    return <EmployerDashboard user={user} />;
  }
}
