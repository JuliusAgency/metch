import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import DynamicRequirementInput from './DynamicRequirementInput';
import jobCategoryList from '../../../jobs_category.json';
import jobTitles from '../../../jobs.json';
import locations from '../../../locations.json';
import CategorySelect from './CategorySelect';

import jobTaxonomy from '../../job_taxonomy.json';

export default function Step1Details({ jobData, setJobData, onRequirementsDirtyChange }) {
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (name, items) => {
    setJobData(prev => ({ ...prev, [name]: items }));
  };

  const jobTypes = [
    { value: "full_time", label: "מלאה" },
    { value: "part_time", label: "חלקית" },
    { value: "shifts", label: "משמרות" },
    { value: "flexible", label: "גמיש/גמישה" }
  ];
  const categoryOptions = Array.isArray(jobCategoryList)
    ? jobCategoryList.filter(Boolean).filter((category, index, arr) => arr.indexOf(category) === index)
    : [];

  const getTitleOptions = () => {
    if (jobData.category && jobTaxonomy[jobData.category]) {
      return jobTaxonomy[jobData.category];
    }
    return Array.isArray(jobTitles)
      ? jobTitles.filter(Boolean).filter((title, index, arr) => arr.indexOf(title) === index)
      : [];
  };

  const titleOptions = getTitleOptions();

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">משרה מפורטת מובילה למועמדים מדוייקים</h1>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CategorySelect
            value={jobData.category || ''}
            onChange={(value) => handleSelectChange('category', value)}
            options={categoryOptions}
            placeholder="תחום משרה"
          />
          <CategorySelect
            value={jobData.title || ''}
            onChange={(value) => handleSelectChange('title', value)}
            options={titleOptions}
            placeholder="תפקיד"
          />
          <div className="relative">
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              name="start_date"
              placeholder="תחילת עבודה"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              value={jobData.start_date || ''}
              onChange={handleInputChange}
              min={today}
              className="h-12 rounded-full border-gray-300 text-right pr-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select
            value={jobData.employment_type || ''}
            onValueChange={(value) => handleSelectChange('employment_type', value)}
          >
            <SelectTrigger className="h-12 rounded-full border-gray-300">
              <SelectValue placeholder="סוג משרה" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CategorySelect
            value={jobData.location || ''}
            onChange={(value) => handleSelectChange('location', value)}
            options={locations}
            placeholder="מיקום המשרה"
            searchPlaceholder="חפש מיקום..."
          />
          <Textarea
            name="description"
            placeholder="תיאור התפקיד"
            value={jobData.description || ''}
            onChange={handleInputChange}
            className="min-h-[48px] max-h-80 resize-y rounded-3xl border-gray-300 text-right"
            rows={1}
          />
        </div>

        <div className="space-y-6">
          <DynamicRequirementInput
            label="דרישה"
            placeholder="דרישות"
            items={jobData.structured_requirements}
            setItems={(items) => handleDynamicChange('structured_requirements', items)}
            onDirtyChange={onRequirementsDirtyChange}
          />
          <DynamicRequirementInput
            label="השכלה"
            placeholder="השכלה"
            items={jobData.structured_education}
            setItems={(items) => handleDynamicChange('structured_education', items)}
          />
          <DynamicRequirementInput
            label="הסמכה"
            placeholder="הסמכות"
            items={jobData.structured_certifications}
            setItems={(items) => handleDynamicChange('structured_certifications', items)}
          />
        </div>
      </div>
    </div>
  );
}
