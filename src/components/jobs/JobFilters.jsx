import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "design", label: "Design" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "Human Resources" },
  { value: "customer_service", label: "Customer Service" },
  { value: "other", label: "Other" }
];

const employmentTypes = [
  { value: "all", label: "All Types" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" }
];

const experienceLevels = [
  { value: "all", label: "All Levels" },
  { value: "entry_level", label: "Entry Level" },
  { value: "mid_level", label: "Mid Level" },
  { value: "senior_level", label: "Senior Level" },
  { value: "executive", label: "Executive" }
];

export default function JobFilters({ filters, setFilters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="glass-effect shadow-medium border-0 sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category" className="font-medium text-gray-700">Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employment_type" className="font-medium text-gray-700">Employment Type</Label>
          <Select
            value={filters.employment_type}
            onValueChange={(value) => handleFilterChange("employment_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employmentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_level" className="font-medium text-gray-700">Experience Level</Label>
          <Select
            value={filters.experience_level}
            onValueChange={(value) => handleFilterChange("experience_level", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="font-medium text-gray-700">Location</Label>
          <Input
            id="location"
            placeholder="Enter city or state..."
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_min" className="font-medium text-gray-700">Minimum Salary</Label>
          <Input
            id="salary_min"
            type="number"
            placeholder="e.g. 50000"
            value={filters.salary_min}
            onChange={(e) => handleFilterChange("salary_min", e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote_friendly"
            checked={filters.remote_friendly}
            onCheckedChange={(checked) => handleFilterChange("remote_friendly", checked)}
          />
          <Label htmlFor="remote_friendly" className="font-medium text-gray-700">
            Remote Friendly
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}