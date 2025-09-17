import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Star, 
  Users,
  Bookmark
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const categoryColors = {
  technology: "bg-blue-100 text-blue-700",
  marketing: "bg-purple-100 text-purple-700", 
  sales: "bg-green-100 text-green-700",
  design: "bg-pink-100 text-pink-700",
  finance: "bg-yellow-100 text-yellow-700",
  operations: "bg-orange-100 text-orange-700",
  hr: "bg-indigo-100 text-indigo-700",
  customer_service: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-700"
};

export default function JobCard({ job, index, onApply }) {
  const categoryColor = categoryColors[job.category] || categoryColors.other;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="glass-effect shadow-medium border-0 hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-lg font-semibold text-gray-700">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                      {job.remote_friendly && (
                        <Badge variant="outline" className="ml-2 text-xs border-green-200 text-green-700">
                          Remote OK
                        </Badge>
                      )}
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary_min && job.salary_max 
                          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                          : job.salary_min 
                            ? `From $${job.salary_min.toLocaleString()}`
                            : `Up to $${job.salary_max?.toLocaleString()}`
                        }
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.employment_type?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">
                {job.description.length > 200 
                  ? `${job.description.substring(0, 200)}...` 
                  : job.description
                }
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge className={categoryColor}>
                  {job.category?.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {job.experience_level?.replace('_', ' ')}
                </Badge>
                {job.skills_required?.slice(0, 3).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700">
                    {skill}
                  </Badge>
                ))}
                {job.skills_required?.length > 3 && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    +{job.skills_required.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applications_count || 0} applicants
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {format(new Date(job.created_date), "MMM d")}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-blue-200 hover:bg-blue-50"
                  >
                    View Details
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => onApply(job)}
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}