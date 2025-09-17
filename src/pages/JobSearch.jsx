
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Clock, 
  Briefcase,
  Heart,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";

// Mock User service for demonstration purposes
// In a real application, this would fetch user data from an API or context
const User = {
  me: async () => {
    // Simulate an API call
    return new Promise(resolve => {
      setTimeout(() => {
        // Return a mock user object or null if not authenticated
        resolve({ email: "example@user.com", name: "Test User" });
        // resolve(null); // Uncomment to simulate no logged-in user
      }, 500);
    });
  }
};


const MOCK_JOBS = [
  {
    id: "1",
    title: "מנהלת חשבונות",
    company: "ארומה בר",
    location: "מרכז",
    employment_type: "משרה מלאה",
    start_date: "מיידי",
    match_score: 90,
    description: "אנחנו מחפשים מנהלת חשבונות מנוסה, עם יכולת עבודה עצמאית ובצוות, ידע נרחב בתוכנות הנהלת חשבונות וניסיון של לפחות שנתיים בתחום. משרה מלאה במרכז הארץ, תנאים טובים למתאימים.",
    tags: ["ניהול", "כספים", "לקוחות"]
  },
  {
    id: "2", 
    title: "מפתח Full-Stack",
    company: "Tech Solutions",
    location: "תל אביב",
    employment_type: "משרה מלאה",
    start_date: "תוך חודש",
    match_score: 85,
    description: "הצטרף לצוות הפיתוח שלנו! מחפשים מפתח Full-Stack מוכשר עם ניסיון ב-React, Node.js ו-MongoDB. פרויקטים מאתגרים, סביבת עבודה דינמית ואפשרויות קידום רבות. משרה מלאה בתל אביב.",
    tags: ["React", "Node.js", "פיתוח"]
  },
  {
    id: "3",
    title: "מעצבת UX/UI",
    company: "Creative Agency",
    location: "חיפה",
    employment_type: "חלקית",
    start_date: "גמיש",
    match_score: 78,
    description: "מחפשים מעצבת יצירתית עם תשוקה לחווית משתמש ועיצוב ממשקים. נדרש ניסיון ב-Figma ו-Adobe XD. משרה חלקית או פרילנס בחיפה. שלחו לנו תיק עבודות מרשים!",
    tags: ["עיצוב", "UI", "UX"]
  },
  {
    id: "4",
    title: "מנהל/ת שיווק דיגיטלי",
    company: "Global Brands",
    location: "רמת גן",
    employment_type: "מלאה",
    start_date: "מיידי",
    match_score: 92,
    description: "אנחנו מחפשים מנהל/ת שיווק דיגיטלי עם ניסיון מוכח בניהול קמפיינים בגוגל ובפייסבוק, SEO, וניהול תוכן. יכולת אנליטית גבוהה וחשיבה יצירתית. הצטרפו לצוות שיווק מוביל!",
    tags: ["שיווק", "דיגיטל", "SEO", "PPC"]
  },
  {
    id: "5",
    title: "טכנאי/ת שירות",
    company: "Electro Fix",
    location: "באר שבע",
    employment_type: "משרה מלאה",
    start_date: "תוך שבועיים",
    match_score: 65,
    description: "לחברת שירות מובילה דרוש/ה טכנאי/ת שירות בעל/ת רקע טכני. עבודה מול לקוחות, מתן מענה לתקלות ותחזוקה שוטפת. רישיון נהיגה חובה.",
    tags: ["שירות", "טכני", "תיקונים"]
  }
];

export default function JobSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const toggleSaveJob = async (jobId) => {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    const wasLiked = savedJobs.includes(jobId);
    
    setSavedJobs(prev => 
      wasLiked 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );

    // Track save/unsave action
    if (user?.email && job) {
      if (wasLiked) {
        await UserAnalytics.trackJobUnsave(user.email, job);
      } else {
        await UserAnalytics.trackJobSave(user.email, job);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (user?.email && searchTerm.trim()) {
      await UserAnalytics.trackAction(user.email, 'search_query', {
        search_term: searchTerm.trim(),
        search_context: 'job_search'
      });
    }
    // The actual filtering happens via searchTerm state change,
    // which triggers re-render of filteredJobs.
  };

  const filteredJobs = MOCK_JOBS.filter(job =>
    job.title.includes(searchTerm) || 
    job.company.includes(searchTerm) ||
    job.tags.some(tag => tag.includes(searchTerm)) ||
    job.description.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">חיפוש משרות</h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="חפש משרות, חברות או מקצועות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 pl-4 py-3 border-gray-300 focus:border-blue-400 rounded-full h-12 text-right text-lg"
                dir="rtl"
              />
            </form>
          </div>

          {/* Jobs List */}
          <div className="space-y-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-6">
                      
                      {/* Job Actions */}
                      <div className="flex flex-col gap-3 items-center">
                        <Button
                          onClick={() => toggleSaveJob(job.id)}
                          variant="ghost"
                          size="icon"
                          className={`rounded-full ${savedJobs.includes(job.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold">
                          <Link 
                            to={createPageUrl(`JobDetailsSeeker?id=${job.id}`)}
                            onClick={() => {
                              // Track job view
                              if (user?.email) {
                                UserAnalytics.trackJobView(user.email, job);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            לצפייה
                          </Link>
                        </Button>
                      </div>

                      {/* Match Score */}
                      <div className="text-center min-w-[120px]">
                        <div className="text-sm text-gray-600 mb-2">{job.match_score}% התאמה</div>
                        <div dir="ltr" className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              job.match_score >= 85 ? 'bg-green-400' : 
                              job.match_score >= 70 ? 'bg-yellow-400' : 'bg-orange-400'
                            }`} 
                            style={{ width: `${job.match_score}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 text-right">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-700 font-medium text-lg mb-3">{job.company}</p>
                        
                        {/* Job Meta Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4"/>
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4"/>
                            {job.employment_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4"/>
                            {job.start_date}
                          </span>
                        </div>

                        {/* Job Description */}
                        <p className="text-gray-600 mb-4 leading-relaxed">{job.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map((tag, tagIndex) => (
                            <Badge 
                              key={tagIndex} 
                              variant="outline" 
                              className="border-blue-200 text-blue-700 bg-blue-50/50"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Company Logo */}
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-gray-200 flex-shrink-0">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} 
                          alt={job.company} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredJobs.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">לא נמצאו משרות התואמות לחיפוש "{searchTerm}"</p>
              <Button 
                onClick={() => setSearchTerm("")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
              >
                נקה חיפוש
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
