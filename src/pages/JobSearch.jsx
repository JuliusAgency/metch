import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { User } from "@/api/entities";
import { Job } from "@/api/entities";
import SearchBar from "@/components/search/SearchBar";
import JobListItem from "@/components/search/JobListItem";
import NoResults from "@/components/search/NoResults";
import { UserAnalytics } from "@/components/UserAnalytics";

export default function JobSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    loadJobs();
    loadUser();
  }, []);

  const loadJobs = async () => {
    try {
      const jobsData = await Job.filter({});
      setJobs(jobsData);
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const toggleSaveJob = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    const wasLiked = savedJobs.includes(jobId);
    
    setSavedJobs(prev => 
      wasLiked 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );

    if (user?.email && job) {
      if (wasLiked) {
        await UserAnalytics.trackJobUnsave(user.email, job);
      } else {
        await UserAnalytics.trackJobSave(user.email, job);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (user?.email && searchTerm.trim()) {
      await UserAnalytics.trackAction(user.email, 'search_query', {
        search_term: searchTerm.trim(),
        search_context: 'job_search'
      });
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.includes(searchTerm) || 
    job.company.includes(searchTerm) ||
    job.tags?.some(tag => tag.includes(searchTerm)) ||
    job.description.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
          />

          <div className="space-y-6">
            {filteredJobs.map((job, index) => (
              <JobListItem
                key={job.id}
                job={job}
                index={index}
                savedJobs={savedJobs}
                toggleSaveJob={toggleSaveJob}
                user={user}
              />
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <NoResults
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
