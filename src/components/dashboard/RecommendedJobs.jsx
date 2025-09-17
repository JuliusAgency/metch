import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  ArrowRight, 
  Sparkles,
  Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RecommendedJobs({ jobs, loading, user: _user }) {
  if (loading) {
    return (
      <Card className="glass-effect shadow-medium border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect shadow-medium border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Perfect Matches for You
          </CardTitle>
          <Link to={createPageUrl("FindJobs")}>
            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50">
              View All Jobs
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-blue-600">
                            {job.match_score || 95}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        {(job.salary_min || job.salary_max) && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            {job.salary_min && job.salary_max 
                              ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                              : job.salary_min 
                                ? `From $${job.salary_min.toLocaleString()}`
                                : `Up to $${job.salary_max?.toLocaleString()}`
                            }
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {job.employment_type?.replace('_', ' ')}
                        </div>
                      </div>

                      {job.reasons && (
                        <div className="flex flex-wrap gap-2">
                          {job.reasons.slice(0, 2).map((reason, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link to={createPageUrl(`ViewJob?id=${job.id}`)} className="flex-1">
                      <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-50">
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-600 mb-4">Complete your profile to get personalized job matches!</p>
              <Link to={createPageUrl("Profile")}>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  Complete Profile
                </Button>
              </Link>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}