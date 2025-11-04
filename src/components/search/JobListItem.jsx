import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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

const JobListItem = ({ job, index, savedJobs, toggleSaveJob, user }) => (
    <motion.div
        key={job.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
    >
        <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start gap-6">

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

                    <div className="flex-1 text-right">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-700 font-medium text-lg mb-3">{job.company}</p>

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

                        <p className="text-gray-600 mb-4 leading-relaxed">{job.description}</p>

                        <div className="flex flex-wrap gap-2">
                            {job.tags?.map((tag, tagIndex) => (
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
);

export default JobListItem;