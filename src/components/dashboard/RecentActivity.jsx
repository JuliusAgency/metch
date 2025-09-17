import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Clock, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  reviewed: { color: "bg-blue-100 text-blue-800", icon: Clock },
  interview: { color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  accepted: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { color: "bg-red-100 text-red-800", icon: XCircle }
};

export default function RecentActivity({ applications }) {
  return (
    <Card className="glass-effect shadow-medium border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Recent Activity
          </CardTitle>
          <Link to={createPageUrl("MyApplications")}>
            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application, index) => {
              const config = statusConfig[application.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              
              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Application Submitted</p>
                      <p className="text-sm text-gray-600">
                        Applied {format(new Date(application.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    
                    <Badge className={config.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {application.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs to see your activity here</p>
            <Link to={createPageUrl("FindJobs")}>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                Browse Jobs
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}